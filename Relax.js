class Relax {
  epsilon = 0.001;
  tinyDelta = 0.000001;

  constructor(varDict, errorFns) {
    this.varDict = varDict;
    this.errorFns = errorFns;
  }

  getError() {
    return this.errorFns
      .map(errorFn => Math.abs(errorFn(this.varDict)))
      .reduce((e1, e2) => e1 + e2, 0);
  }

  // TODO: replace this w/ automatic differentiation
  derivative(errorFn, aVar) {
    const origValue = aVar.value;

    const calcDerivative = (x0, x1) => {
      aVar.value = x0;
      const y0 = errorFn(this.varDict);
      aVar.value = x1;
      const y1 = errorFn(this.varDict);
      aVar.value = origValue;
      return (y1 - y0) / (x1 - x0);
    }
  
    let m = calcDerivative(origValue - this.tinyDelta, origValue + this.tinyDelta);
    if (Math.abs(m) < this.tinyDelta) {
      m = calcDerivative(origValue, origValue + this.tinyDelta);
    }
    if (Math.abs(m) < this.tinyDelta) {
      m = calcDerivative(origValue - this.tinyDelta, origValue);
    }
    return m;
  }

  computeDelta(aVar) {
    let mbs = 0;
    let mms = 0;
    for (const errorFn of this.errorFns) {
      const m = this.derivative(errorFn, aVar);
      const b = errorFn(this.varDict) - m * aVar.value;
      mbs += m * b;
      mms += m * m;
    }
    const newValue = -mbs / mms;
    return isFinite(newValue) ? newValue - aVar.value : undefined;
  }

  getUnlockedVars() {
    return Object.keys(this.varDict)
      .map(varName => this.varDict[varName])
      .filter(aVar => !aVar.locked);
  }

  relax(optVars) {
    const vars = optVars || this.getUnlockedVars();
    const deltas = vars.map(aVar => this.computeDelta(aVar));
    const numDeltas = deltas.filter(d => typeof d === 'number' /*&& d > this.epsilon*/).length;
    if (numDeltas === 0) {
      return;
    }
    for (let idx = 0; idx < vars.length; idx++) {
      const aVar = vars[idx];
      const delta = deltas[idx];
      if (typeof delta === 'number' /*&& delta > this.epsilon*/) {
        aVar.value += delta / numDeltas;
      }
    }
  }

  iterateForUpTo(tMillis) {
    const vars = this.getUnlockedVars();
    const t0 = Date.now();
    while (this.getError() > this.epsilon && (Date.now() - t0) < tMillis) {
      this.relax(vars);
    }
    const error = this.getError();
    if (error > this.epsilon) {
      for (const aVar of vars) {
        const sign = Math.random() < 0.5 ? -1 : 1;
        aVar.value += sign * self.tinyDelta;
      }
    }
    return error;
  }
}
