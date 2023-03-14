function Relax(varDict, errorFns) {
  this.varDict = varDict;
  this.errorFns = errorFns;
}

Relax.prototype.epsilon = 0.001;
Relax.prototype.tinyDelta = 0.000001;

Relax.prototype.getError = function() {
  var self = this;
  return this.errorFns
      .map(function(errorFn) { return Math.abs(errorFn(self.varDict)); })
      .reduce(function(e1, e2) { return e1 + e2; }, 0);
};

// TODO: replace this w/ automatic differentiation
Relax.prototype.derivative = function(errorFn, aVar) {
  var self = this;
  var origValue = aVar.value;

  function calcDerivative(x0, x1) {
    aVar.value = x0;
    var y0 = errorFn(self.varDict);
    aVar.value = x1;
    var y1 = errorFn(self.varDict);
    aVar.value = origValue;
    return (y1 - y0) / (x1 - x0);
  }

  var m = calcDerivative(origValue - this.tinyDelta, origValue + this.tinyDelta);
  if (Math.abs(m) < this.tinyDelta) {
    m = calcDerivative(origValue, origValue + this.tinyDelta);
  }
  if (Math.abs(m) < this.tinyDelta) {
    m = calcDerivative(origValue - this.tinyDelta, origValue);
  }
  return m;
};

Relax.prototype.computeDelta = function(aVar) {
  var self = this;
  var mbs = 0;
  var mms = 0;
  self.errorFns.forEach(function(errorFn) {
    var m = self.derivative(errorFn, aVar);
    var b = errorFn(self.varDict) - m * aVar.value;
    mbs += m * b;
    mms += m * m;
  });
  var newValue = -mbs / mms;
  return isFinite(newValue) ? newValue - aVar.value : undefined;
};

Relax.prototype.getUnlockedVars = function() {
  var self = this;
  return Object.keys(this.varDict)
      .map(function(varName) { return self.varDict[varName]; })
      .filter(function(aVar) { return !aVar.locked; });
};

Relax.prototype.relax = function(optVars) {
  var vars = optVars || this.getUnlockedVars();
  var deltas = vars.map(aVar => this.computeDelta(aVar));
  var numDeltas = deltas.filter(d => typeof d === 'number' /*&& d > this.epsilon*/).length;
  for (var idx = 0; idx < vars.length; idx++) {
    var aVar = vars[idx];
    var delta = deltas[idx];
    if (typeof delta === 'number' /*&& delta > this.epsilon*/) {
      aVar.value += delta / numDeltas;
    }
  }
};

Relax.prototype.iterateForUpTo = function(tMillis) {
  var self = this;
  var vars = this.getUnlockedVars();
  var t0 = Date.now();
  var count = 0;
  while (this.getError() > this.epsilon && (Date.now() - t0) < tMillis) {
    this.relax(vars);
    count++;
  }
  var error = this.getError();
  if (error > this.epsilon) {
    vars.forEach(function(aVar) {
      var sign = Math.random() < 0.5 ? -1 : 1;
      aVar.value += sign * self.tinyDelta;
    });
  }
  return error;
};
