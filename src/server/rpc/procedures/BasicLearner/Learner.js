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
    this._learningRate = 0.8;
    this._discountFactor = 0.9;
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
/*
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

 Learner.prototype._getActionValue = function (stateId, actionId) {
 var state = this._states[stateId] || {},
 value = 0,
 i,
 cActions = 0,
 nextStateIds = Object.keys((state.transitions || {})[actionId] || {});

 for (i = 0; i < nextStateIds.length; i += 1) {
 cActions += 1;
 value += this._states[nextStateIds[i]].utility;
 }

 if (cActions === 0) {
 // return 1;
 return null;
 }

 return value / cActions;
 };

 // Learner.prototype.getOptimalChoice = function (stateId) {
 //     var actionValue,
 //         i,
 //         optimalChoice = 0,
 //         optimalValue = 0;
 //
 //     for (i = 0; i < this._actionIds.length; i += 1) {
 //         // actionValue = this._getActionMaxValue(stateId, this._actionIds[i]);
 //         actionValue = this._getActionValue(stateId, this._actionIds[i]);
 //         if (actionValue === 1) {
 //             return this._actionIds[i];
 //         }
 //         if (actionValue > optimalValue) {
 //             optimalChoice = i;
 //             optimalValue = actionValue;
 //         }
 //     }
 //     return this._actionIds[optimalChoice];
 // };

 Learner.prototype.getOptimalChoice = function (stateId) {
 var actionValue,
 i,
 optimalChoice = 0,
 optimalValue = 0,
 noValues = true,
 allZero = true,
 firstUnknown = null;

 for (i = 0; i < this._actionIds.length; i += 1) {
 actionValue = this._getActionValue(stateId, this._actionIds[i]);
 if (actionValue === null) {
 if (firstUnknown === null) {
 firstUnknown = i;
 }
 allZero = false;
 } else if (actionValue === 0) {
 noValues = false;
 } else {
 allZero = false;
 noValues = false;
 if (actionValue > optimalValue) {
 optimalChoice = i;
 optimalValue = actionValue;
 }
 }
 }

 if (allZero || noValues) {
 return this._actionIds(Math.truncate(Math.random() * this._actionIds.length));
 }

 if (optimalValue === 0) {
 return this._actionIds[firstUnknown];
 }

 return this._actionIds[optimalChoice];
 };
 */

Learner.prototype.initState = function (sId, u) {
    var i;
    this._states[sId] = {
        u: u,
        q: [],
        n: {}
    };

    for (i = 0; i < this._actionIds.length; i += 1) {
        this._states[sId].q.push(0);
    }
};

Learner.prototype.getMaxQ = function (sId) {
    var i, state,
        q = 0;

    state = this._states[sId];

    for (i = 0; i < state.q.length; i += 1) {
        if (state.q[i] > q) {
            q = state.q[i];
        }
    }

    return q;
};

Learner.prototype.reportUtility = function (sId, aId, nId, u) {
    var prevState, currentState,
        actionIndex = this._actionIds.indexOf(Number(aId)),
        oldQ, newQ;

    if (actionIndex === -1) {
        return; //false input
    }

    if (this._states[nId] === undefined) {
        this.initState(nId, Number(u));
    }
    currentState = this._states[nId];

    if (this._states[sId] === undefined) {
        //this should only happen for the initial state
        this.initState(sId, 0);
    }

    prevState = this._states[sId];

    prevState.n[nId] = true;

    oldQ = prevState.q[actionIndex];

    // console.log('newQ:', sId, ' - ', actionIndex, ' - ', oldQ +
    //     this._learningRate * (u + this._discountFactor * (this.getMaxQ(nId)) - oldQ));
    // console.log('newQelements:',aId,actionIndex,oldQ,u,this._learningRate,this._discountFactor,this.getMaxQ(nId));
    newQ = oldQ +
        this._learningRate * ((Number(u) - Number(prevState.u)) + this._discountFactor * (this.getMaxQ(nId)) - oldQ);

    prevState.q[actionIndex] = newQ || 0;
    // if (newQ >= 0) {
    //     prevState.q[actionIndex] = newQ;
    // } else {
    //     //whaaat
    //     console.log('nQ:', newQ,
    //         aId, actionIndex, oldQ, u, this._learningRate, this._discountFactor, this.getMaxQ(nId));
    //
    //     prevState.q[actionIndex] = 0;
    // }
};

Learner.prototype.getOptimalChoice = function (sId) {
    var randomize,
        maxQValue,
        state,
        i;

    if (this._states[sId] === undefined) {
        //this should only happen for the initial state
        this.initState(sId, 0);
    }

    state = this._states[sId];
    maxQValue = state.q[0];
    randomize = [0];

    for (i = 1; i < this._actionIds.length; i += 1) {
        if (state.q[i] > maxQValue) {
            randomize = [i];
            maxQValue = state.q[i];
        } else if (state.q[i] === maxQValue) {
            randomize.push(i);
        }
    }

    state = randomize[Math.floor(Math.random() * randomize.length)];
    if (state >= 0 && state < this._actionIds.length) {
        return this._actionIds[state];
    } else {
        //wtf
        console.log(randomize);
        return this._actionIds[randomize[0]];
    }
    return this._actionIds[randomize[Math.round(Math.random() * randomize.length)]];
    // return this._actionIds[randomize[0]];
};

module.exports = Learner;