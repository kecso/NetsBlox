/**
 * @author kecso / https://github.com/kecso
 */
var FS = require('fs');

var Learner = function () {
    this._states = {};
    this._name = null;
    this._actionIds = [];
};

Learner.prototype.init = function (actions) {
    this._states = {};
    this._name = null;
    this._actionIds = actions;
};

Learner.prototype.load = function (preDataName) {
    this._name = preDataName;
    try {
        this._states = JSON.parse(FS.readFileSync(preDataName + '.json', 'utf8'));
    } catch (e) {
        this._states = {};
    }
};

Learner.prototype.update = function () {
    try {
        FS.writeFileSync(this._name + '.json', JSON.stringify(this._states, null, 2), 'utf8');
    } catch (e) {

    }
};

Learner.prototype.reportUtility = function (stateId, actionId, nextStateId, utility) {
    //update utility value
    stateId = stateId + '';
    actionId = actionId + '';
    nextStateId = nextStateId + '';
    utility = Number(utility);
    if (this._states[nextStateId] === undefined) {
        this._states[nextStateId] = {};
    }
    this._states[nextStateId].utility = utility;

    //update transition values
    this._states[stateId] = this._states[stateId] || {};
    this._states[stateId].visitCount = this._states[stateId].visitCount || 0;
    this._states[stateId].visitCount += 1;

    this._states[stateId].transitions = this._states[stateId].transitions || {};
    this._states[stateId].transitions[actionId] = this._states[stateId].transitions[actionId] || {};
    this._states[stateId].transitions[actionId][nextStateId] =
        this._states[stateId].transitions[actionId][nextStateId] || 0;
    this._states[stateId].transitions[actionId][nextStateId] += 1;
};

Learner.prototype._getActionMaxValue = function (stateId, actionId) {
    var state = this._states[stateId],
        maxValue = 0,
        nextStateIds,
        nUtility,
        cAll,
        cState,
        value,
        i;

    if (!state) {
        return 1; //we want our learner to discover new paths
    }

    nextStateIds = Object.keys((state.transitions || {})[actionId] || {});
    if (nextStateIds.length === 0) {
        return 1;
    }

    for (i = 0; i < nextStateIds.length; i += 1) {
        nUtility = Number(this._states[nextStateIds[0]].utility);
        if (nUtility === 'NaN') {
            nUtility = 1;
        }
        cAll = state.visitCount;
        cState = state.transitions[actionId][nextStateIds[i]];
        if (!cAll || !cState) {
            return 1;
        }
        value = nUtility * (1.0) * (cState / cAll);
        if (value > maxValue) {
            maxValue = value;
        }
    }
    return maxValue;
};

Learner.prototype.getOptimalChoice = function (stateId) {
    var actionValue,
        i,
        optimalChoice = 0,
        optimalValue = 0;

    for (i = 0; i < this._actionIds.length; i += 1) {
        actionValue = this._getActionMaxValue(stateId, this._actionIds[i]);
        if (actionValue === 1) {
            return this._actionIds[i];
        }
        if (actionValue > optimalValue) {
            optimalChoice = i;
            optimalValue = actionValue;
        }
    }

    return this._actionIds[optimalChoice];
};

module.exports = Learner;