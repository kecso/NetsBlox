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
    this._learningRate = 1;
    this._discountFactor = 1;
    this._epsilon = 0.005;
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

Learner.prototype.initState = function (sId, u) {
    var i;
    this._states[sId] = {
        u: u,
        q: [],
        h: []
    };

    for (i = 0; i < this._actionIds.length; i += 1) {
        this._states[sId].q.push(0);
    }
};

Learner.prototype.getMaxQ = function (sId) {
    var i, state,
        q = 0;

    state = this._states[sId];

    if(!state) {
        return 0;
    }
    q=state.q[0] || 0;
    for (i = 0; i < state.q.length; i += 1) {
        if (state.q[i] > q) {
            q = state.q[i];
        }
    }

    return q;
};

Learner.prototype.reportUtility = function (sId, aId, nId, u) {
    var prevState,
        actionIndex = this._actionIds.indexOf(Number(aId)),
        oldQ, newQ, 
        reward;

    if (actionIndex === -1) {
        return; //false input
    }

    if (this._states[nId] === undefined) {
        this.initState(nId, Number(u));
    }

    if (this._states[sId] === undefined) {
        //this should only happen for the initial state
        this.initState(sId, 0);
    }

    prevState = this._states[sId];

    // prevState.n[nId] = true;

    oldQ = prevState.q[actionIndex];

    reward = Number(u) - 0.5 /* Number(u) - Number(prevState.u) */;

    newQ = oldQ +
        this._learningRate * (reward + this._discountFactor * (this.getMaxQ(nId)) - oldQ);

    prevState.q[actionIndex] = newQ || 0;
    prevState.h[actionIndex] = prevState.h[actionIndex] || [];
    prevState.h[actionIndex].push(oldQ);
};

/* epsilon-greedy policy */
Learner.prototype.getOptimalChoice = function(sId) {
    var i,
        max,
        maxindex,
        state = this._states[sId],
        result;

    if(Math.random()<this._epsilon || !state){
        result = this._actionIds[Math.floor(Math.random()*this._actionIds.length)];
        return result;
    }

    max = state.q[0];
    maxindex=0;
    for(i=1;i<state.q.length;i+=1){
        if(max<state.q[i]){
            maxindex=i;
            max=state.q[i];
        }
    }

    result = this._actionIds[maxindex];
    return result;
};

Learner.prototype._getOptimalChoice = function (sId) {
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
    // return this._actionIds[randomize[Math.round(Math.random() * randomize.length)]];
    // return this._actionIds[randomize[0]];
};

module.exports = Learner;