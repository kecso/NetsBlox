// This is the TicTacToe RPC. It will maintain the game board and can be queried
// for win/tie/ongoing as well as turn

'use strict';

var R = require('ramda'),
    debug = require('debug'),
    log = debug('NetsBlox:RPCManager:BasicLearnerRPC:log'),
    trace = debug('NetsBlox:RPCManager:BasicLearnerRPC:trace'),
    Constants = require('../../../../common/Constants'),
    info = debug('NetsBlox:RPCManager:BasicLearnerRPC:info'),
    Learner = require('./Learner');

/**
 * TicTacToeRPC - This constructor is called on the first request to an RPC
 * from a given room
 *
 * @constructor
 * @return {undefined}
 */
var BasicLearnerRPC = function () {
    this._learners = {};
};

/**
 * Return the path to the given RPC
 *
 * @return {String}
 */
BasicLearnerRPC.getPath = function () {
    return '/basiclearner';
};

/**
 * This function is used to expose the public API for RPC calls
 *
 * @return {Array<String>}
 */
BasicLearnerRPC.getActions = function () {
    return ['getLearner',
        'getOptimalChoice',
        'reportUtility',
        'reportGood',
        'reportBad',
        'updateLearner',
        'finishGame'];
};

// Actions
BasicLearnerRPC.prototype.getLearner = function (req, res) {
    var userId = req.query.uId,
        i,
        actionSpaceSize = req.query.a,
        actions = [];

    for (i = 0; i < actionSpaceSize; i += 1) {
        actions.push(i+1);
    }

    this._learners[userId] = new Learner();
    this._learners[userId].init(actions);
    this._learners[userId].load(req.query.name || 'basic');
    res.send(true);
};

BasicLearnerRPC.prototype.getOptimalChoice = function (req, res) {
    var learner = this._learners[req.query.uId];

    if (learner) {
        res.send('' + learner.getOptimalChoice(req.query.s));
    } else {
        res.send('1');
    }
};

BasicLearnerRPC.prototype.reportUtility = function (req, res) {
    var learner = this._learners[req.query.uId];

    if (learner) {
        learner.reportUtility(req.query.s, req.query.a, req.query.ns, req.query.u);
    }
    res.send(true);
};

BasicLearnerRPC.prototype.reportGood = function (req, res) {
    var learner = this._learners[req.query.uId];

    if (learner) {
        learner.reportUtility(req.query.s, req.query.a, req.query.ns, 1);
    }
    res.send(true);
};

BasicLearnerRPC.prototype.reportBad = function (req, res) {
    var learner = this._learners[req.query.uId];

    if (learner) {
        learner.reportUtility(req.query.s, req.query.a, req.query.ns, 0);
    }
    res.send(true);
};

BasicLearnerRPC.prototype.updateLearner = function (req, res) {
    var learner = this._learners[req.query.uId];

    if (learner) {
        learner.update();
    }
    res.send(true);
};

BasicLearnerRPC.prototype.finishGame = function (req, res) {
    this._learners = {};
    res.send(true);
};

module.exports = BasicLearnerRPC;
