// NetsBlocks Server
// Handles the groups and websocket communication 

'use strict';

// Web Sockets
var WebSocketServer = require('ws').Server,
    counter = 0,
    GenericManager = require('./GroupManagers/GenericManager'),
    R = require('ramda'),
    Utils = require('./Utils'),
    debug = require('debug'),
    log = debug('NetsBlocks:log'),
    info = debug('NetsBlocks:info');

var NetsBlocksServer = function(opts) {
    opts = opts || {};
    this.sockets = [];
    this.socket2Role = {};

    var GroupManager = opts.GroupManager || GenericManager;
    this.groupManager = new GroupManager();
    info('Using GroupManager: '+this.groupManager.getName());
};

/**
 * Start the WebSocket server and start the socket updating interval.
 *
 * @param {Object} opts
 * @return {undefined}
 */
NetsBlocksServer.prototype.start = function(opts) {
    this._wss = new WebSocketServer(opts);

    var self = this;
    this._wss.on('connection', function(socket) {
        log('WebSocket connection established! ('+counter+')');

        // ID the socket
        socket.id = ++counter;
        self.sockets.push(socket);
        self.socket2Role[socket.id] = 'default_'+socket.id;

        // Add the client to the global group
        self.groupManager.onConnect(socket);
        self.groupManager._printGroups();
        // Broadcast 'join' on connect
        self.notifyGroupJoin(socket);

        socket.on('message', function(data) {
            log('Received message: ',data);
            self.onMsgReceived(socket, data);
        }.bind(this));
    }.bind(this));

    // Check if the sockets are alive
    setInterval(function() {
        self.updateSockets();
    }, 500);

};

NetsBlocksServer.prototype.stop = function(opts) {
    this._wss.close();
};

/**
 * Broadcast the given message to the given peers.
 *
 * @param {String} message
 * @param {WebSocket} peers
 * @return {undefined}
 */
NetsBlocksServer.prototype.broadcast = function(message, peers) {
    console.log('broadcasting '+message,'to', peers.map(function(r){return r.id;}));
    var s;
    for (var i = peers.length; i--;) {
        s = peers[i];
        // Check if the socket is open
        if (this.updateSocket(s)) {
            s.send(message);
        }
    }
};

/**
 * Check if the sockets are still active and remove any stale sockets.
 *
 * @return {undefined}
 */
NetsBlocksServer.prototype.updateSockets = function() {
    var groups = this.groupManager.getAllGroups(),
        open;

    if (!this.sockets.length) {
        return;
    }

    // Replace the next portion TODO
    //
    // We should find the sockets to remove from each group
    // then broadcast to the remaining for all the removed sockets
    var isOpen = R.pipe(R.partialRight(Utils.getAttribute, 'readyState'), 
            Utils.not(R.eq.bind(R, this.sockets[0].OPEN))),
        closed,
        roles;

    for (var i = groups.length; i--;) {
        // Get the closed sockets
        closed = Utils.extract(isOpen, groups[i]);

        roles = closed.map(function(s) {
            return this.socket2Role[s.id];
        }.bind(this));

        // Broadcast to remaining 'leave '+role
        closed.forEach(R.pipe(this._removeFromRecords.bind(this), 
                              this.groupManager.onDisconnect.bind(this.groupManager)));

        roles.forEach(R.pipe(
            R.partial(R.concat, 'leave '),  // Create 'leave '+role msg
            R.partialRight(this.broadcast.bind(this), groups[i])));  // broadcast!
    }
};

/**
 * Check if the socket is still open. If not, clean up the groups and broadcast updates.
 *
 * @param {WebSocket} socket
 * @return {Boolean} connected?
 */
NetsBlocksServer.prototype.updateSocket = function(socket) {
    if (socket.readyState !== socket.OPEN) {
        console.log('Removing disconnected socket ('+socket.id+')');
        var role = this.socket2Role[socket.id];
        this._removeFromRecords(socket);
        // Broadcast the leave message to peers of the given socket
        var peers = this.groupManager.getGroupMembers(socket);

        console.log('socket', socket.id, 'is leaving');
        this.groupManager.onDisconnect(socket);
        this.broadcast('leave '+role, peers);
        return false;
    }
    return true;
};

NetsBlocksServer.prototype._removeFromRecords = function(socket) {
    var index = this.sockets.indexOf(socket),
        role = this.socket2Role[socket.id];

    delete this.socket2Role[socket.id];
    this.sockets.splice(index,1);
    return socket;
};

/**
 * Broadcast a JOIN message to the other members in the group.
 *
 * @param {WebSocket} socket
 * @return {undefined}
 */
NetsBlocksServer.prototype.notifyGroupJoin = function(socket) {
    var role = this.socket2Role[socket.id],
        peers = this.groupManager.getGroupMembers(socket);

    // Send 'join' messages to peers in the 'group'
    this.broadcast('join '+role, peers);

    // Send new member join messages from everyone else
    for (var i = peers.length; i--;) {
        if (peers[i] !== socket.id) {
            socket.send('join '+this.socket2Role[peers[i]]);
        }
    }
};

/**
 * Handle a WebSocket message from a client.
 *
 * @param {WebSocket} socket
 * @param {String} message
 * @return {undefined}
 */
NetsBlocksServer.prototype.onMsgReceived = function(socket, message) {
    var msg = message.split(' '),
        socketId = socket.id,
        type = msg.shift(),
        oldRole = this.socket2Role[socket.id],
        peers,
        group,
        oldMembers,
        role;

    // Early return..
    if (!this.groupManager.isMessageAllowed(socket, message)) {
        return;
    }

    log('Received msg:', message, 'from',socket.id);

    oldMembers = this.groupManager.onMessage(socket, message);

    // Handle the different request types
    switch (type) {
        case 'register':
            role = msg.shift();  // record the roleId
            this.socket2Role[socket.id] = role;
            break;

        case 'message':
            // broadcast the message, role to all peers
            role = this.socket2Role[socketId];
            msg.push(role);
            log('About to broadcast '+msg.join(' ')+
                        ' from socket #'+socketId+' ('+role+')');
            peers = this.groupManager.getGroupMembersToMessage(socket);
            this.broadcast(msg.join(' '), peers);
            break;

        default:
            break;
    }

    if (oldMembers) { // Update group change
        var k,
            r;

        // Broadcast 'leave' to old peers
        k = oldMembers.indexOf(socket);
        oldMembers.splice(k,1);
        this.broadcast('leave '+oldRole, oldMembers);

        this.notifyGroupJoin(socket);
    }
};

module.exports = NetsBlocksServer;