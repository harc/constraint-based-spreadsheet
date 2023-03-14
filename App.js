const chartScale = 1;
const chartBarWidth = 50;
const chartBottomPadding = 100;

const App = {
  GOOD_EFFORT_TIME_MS: 2000,

  init() {
    $('addConstraintButton').click(() => {
      const newC = addConstraint();
      $('constraints').append(newC);
      newC.focus();
    });
  
    let relaxButtonDown = false;
    $('relaxButton').mousedown(() => { relaxButtonDown = true; });
    $(document.body).mouseup(() => { relaxButtonDown = false; });
  
    function setError(error) {
      $('errorValue').text(error.toFixed(5));
    }
  
    let relaxingUntilTime = 0;
    let toDoWhenSatisfiedOrDone = [];
    function relaxForUpTo(millis, optFn) {
      relaxingUntilTime = Date.now() + millis;
      toDoWhenSatisfiedOrDone.push({
        timeout: relaxingUntilTime,
        fn: optFn || (() => {})
      });
    }
  
    const errorFns = [];
    const varDict = {};
  
    function addConstraint() {
      const constraint = App.Constraint.create();
      $('constraints').append(constraint);
      errorFns.push(constraint.errorFn);
      relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
  
      $(constraint).change(() => {
        errorFns.splice($(constraint).index(), 1, constraint.errorFn);
        constraint.varNames.forEach((name) => {
          if (!varDict[name]) {
            addVar(name);
          }
        });
        relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
      });
  
      $(constraint).on('delete', () => deleteConstraint(constraint));
  
      return constraint;
    }
  
    function addVar(name) {
      const aVar = App.Var.create(name, 0);
      $('vars').append(aVar);
      varDict[name] = aVar;
  
      let lockButtonClickCount = 0;
      $(aVar).on('lockbuttonclick', () => {
        lockButtonClickCount++;
        if (!aVar.locked) {
          relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
        }
      });
  
      $(aVar).change(() => {
        let fn;
        if (!aVar.locked) {
          aVar.locked = true;
          let oldLockButtonClickCount = lockButtonClickCount;
          fn = () => {
            if (lockButtonClickCount === oldLockButtonClickCount) {
              aVar.locked = false;
              relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
            }
          };
        }
        relaxForUpTo(App.GOOD_EFFORT_TIME_MS, fn);
      });
  
      $(aVar).on('delete', () => {
        $('aConstraint').each(function() {
          this.inlineVar(aVar.name, aVar.value);
          if (this.varNames.length === 0) {
            deleteConstraint(this);
          }
        });
        delete varDict[name];
        $(aVar).remove();
      });
    }
  
    function deleteConstraint(constraint) {
      errorFns.splice($(constraint).index(), 1);
      $(constraint).remove();
      relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
    }
  
    setError(0);
  
    const relax = new Relax(varDict, errorFns);
  
    let relaxing = false;
    let relaxed = true;
  
    const ctxt = canvas.getContext('2d');
  
    function doSomeRelaxing() {
  
      doBarStuff();
  
      let currTime = Date.now();
      relaxing = false;
      if (currTime < relaxingUntilTime || relaxButtonDown) {
        relaxing = true;
        const error = relax.iterateForUpTo(1000 / 50);
        setError(error);
        if (error < relax.epsilon) {
          relaxed = true;
          relaxingUntilTime = 0;
          while (toDoWhenSatisfiedOrDone.length > 0) {
            const fn = toDoWhenSatisfiedOrDone.shift().fn;
            fn();
          }
        } else {
          relaxed = false;
        }
      }
      while (toDoWhenSatisfiedOrDone.length > 0 && currTime >= toDoWhenSatisfiedOrDone[0].timeout) {
        const fn = toDoWhenSatisfiedOrDone.shift().fn;
        fn();
      }
      $('app').toggleClass('relaxing', relaxing);
      $('app').toggleClass('relaxed', relaxed);
      requestAnimationFrame(doSomeRelaxing);
    }
  
    function doBarStuff() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
  
      if (targetVar) {
        targetVar.value = targetVarDesiredValue;
        relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
      }
  
      let x = 0;
      Object.keys(varDict).forEach(name => {
        if (!varDict[name].hasBar) {
          return;
        }
        const scaledValue = varDict[name].value * chartScale;
        ctxt.fillStyle = 'cornflowerblue';
        ctxt.fillRect(x, innerHeight - scaledValue - chartBottomPadding, chartBarWidth - 2, scaledValue);
        ctxt.fillStyle = 'black';
        ctxt.font = '10pt Avenir';
        const w = ctxt.measureText(name).width;
        const yOffset = scaledValue > 0 ? 6 : -18;
        ctxt.fillText(name, x + (chartBarWidth - 2) / 2 - w / 2, innerHeight - scaledValue - chartBottomPadding - yOffset);
        x += chartBarWidth;
      });
    }
  
    let targetVar = null;
    let targetVarOrigValue;
    let targetVarDesiredValue;
    let yOffset;
  
    canvas.onmousedown = e => {
      const idx = Math.floor(e.offsetX / chartBarWidth);
      targetVar = Object.values(varDict).filter(v => v.hasBar)[idx] || null;
      if (targetVar) {
        console.log(targetVar.name);
        targetVarOrigValue = targetVar.value;
        targetVarDesiredValue = targetVarOrigValue;
        yOffset = e.offsetY;
      }
    };
  
    canvas.onmousemove = e => {
      if (!targetVar) {
        return;
      }
  
      const delta = (yOffset - e.offsetY) / chartScale;
      targetVarDesiredValue = targetVarOrigValue + delta;
    };
  
    canvas.onmouseup = e => {
      targetVar = null;
    };
  
    requestAnimationFrame(doSomeRelaxing);  
  }
};
