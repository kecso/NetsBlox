// This is the TicTacToe RPC. It will maintain the game board and can be queried
// for win/tie/ongoing as well as turn

'use strict';

var R = require('ramda'),
    FS = require('fs'),
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
    this._statistics = {};
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
        'finishGame',
        'reportValue',
        'saveStatistics'];
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
    this._statistics[userId] = [];
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

BasicLearnerRPC.prototype.reportValue = function (req,res) {
    var classId = req.query.uId+(req.query.a || "");
    this._statistics[classId] = this._statistics[classId] || [];
    this._statistics[classId].push(Number(req.query.v));
    res.send(true);
};

BasicLearnerRPC.prototype.saveStatistics = function (req,res) {
    var statistics = this._statistics,
        outFileContent = "",
        id,i;

    console.log('saving statistics');
    this._statistics = {};
    for(id in statistics){
        console.log('id: ',id);
        outFileContent+='"'+id+'",';
        for(i=0;i<statistics[id].length;i+=1){
            outFileContent+=statistics[id][i]+',';
        }
        outFileContent+='\n';
    }

    FS.appendFileSync('statistics.csv',outFileContent,'utf8');
};

module.exports = BasicLearnerRPC;
