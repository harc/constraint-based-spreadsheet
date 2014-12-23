function makeApp() {
  var relaxButton, vars, constraints, addConstraintButton;
  var app = toDOM(
    ['app',
      vars = toDOM(['vars']),
      ['right',
        constraints = toDOM(['constraints']),
        addConstraintButton = toDOM(['addConstraintButton'])],
      ['bottom',
        relaxButton = toDOM(['relaxButton'])]]
  );

  var goodEffortTime = 2000;

  // Add constraint button

  addConstraintButton.addEventListener(
    'click',
    function(e) {
      var newC = addConstraint();
      constraints.appendChild(newC);
      newC.focus();
    },
    false
  );

  // Relax button

  var relaxButtonDown = false;
  relaxButton.addEventListener(
    'mousedown',
     function(e) {
       relaxButtonDown = true;
     },
     false
  );

  document.body.addEventListener(
    'mouseup',
    function(e) {
      relaxButtonDown = false;
    },
    false
  );

  function setError(error) {
    relaxButton.innerHTML = error.toFixed(5);
  }

  var relaxingUntilTime = 0;
  var toDoWhenSatisfiedOrDone = [];
  function relaxForUpTo(millis, optFn) {
    relaxingUntilTime = Date.now() + millis;
    toDoWhenSatisfiedOrDone.push({timeout: relaxingUntilTime, fn: optFn || function() {}});
  }

  var errorFns = [];
  var varDict = {};

  function addConstraint() {
    var constraint = makeConstraint();
    constraints.appendChild(constraint);
    errorFns.push(constraint.errorFn);
    relaxForUpTo(goodEffortTime);

    function getIndex() {
      var idx = 0;
      var c = constraints.firstChild;
      while (c !== constraint) {
        idx++;
        c = c.nextSibling;
      }
      return idx;
    }

    constraint.addEventListener(
      'valuechange',
      function(e) {
        errorFns.splice(getIndex(), 1, constraint.errorFn);
        constraint.varNames.forEach(function(name) {
          if (!varDict[name]) {
            addVar(name);
          }
        });
        relaxForUpTo(goodEffortTime);
      },
      false
    );

    constraint.addEventListener(
      'delete',
      function(e) {
        errorFns.splice(getIndex(), 1);
        relaxForUpTo(goodEffortTime);
      },
      false
    );

    return constraint;
  }

  function addVar(name) {
    var aVar = makeVar(name, 0);
    vars.appendChild(aVar);
    varDict[name] = aVar;

    var lockButtonClickCount = 0;
    aVar.addEventListener(
      'lockbuttonclick',
      function(e) {
        lockButtonClickCount++;
        if (!e.detail.locked) {
          relaxForUpTo(goodEffortTime);
        }
      },
      false
    );

    aVar.addEventListener(
      'valuechange',
      function(e) {
        var fn;
        if (!aVar.locked) {
          aVar.locked = true;
          var oldLockButtonClickCount = lockButtonClickCount;
          fn = function() {
            if (lockButtonClickCount === oldLockButtonClickCount) {
              aVar.locked = false;
              relaxForUpTo(goodEffortTime);
            }
          };
        }
        relaxForUpTo(goodEffortTime, fn);
      },
      false
    );

    aVar.addEventListener(
      'delete',
      function(e) {
        for (var idx = 0; idx < constraints.childNodes.length; idx++) {
          var c = constraints.childNodes[idx];
          c.inlineVar(aVar.name, aVar.value);
        }
        delete varDict[name];
      },
      false
    );

  }

  setError(0);

  var relax = new Relax(varDict, errorFns);

  var relaxing = false;
  var relaxed = true;
  function updateView() {
    app.className = (relaxing ? 'relaxing' : '') + (relaxed ? ' relaxed' : '');
  }

  function doSomeRelaxing() {
    var currTime = Date.now();
    relaxing = false;
    if (currTime < relaxingUntilTime || relaxButtonDown) {
      relaxing = true;
      var error = relax.iterateForUpTo(1000 / 50);
      setError(error);
      if (error < relax.epsilon) {
        relaxed = true;
        console.log(Object.
            keys(varDict).
            map(function(varName) { return varName + ' = ' + varDict[varName].value; }).
            join(', '));
        relaxingUntilTime = 0;
        while (toDoWhenSatisfiedOrDone.length > 0) {
          var fn = toDoWhenSatisfiedOrDone.shift().fn;
          fn();
        }
      } else {
        relaxed = false;
      }
    }
    while (toDoWhenSatisfiedOrDone.length > 0 && currTime >= toDoWhenSatisfiedOrDone[0].timeout) {
      var fn = toDoWhenSatisfiedOrDone.shift().fn;
      fn();
    }
    updateView();
    requestAnimationFrame(doSomeRelaxing);
  }
  requestAnimationFrame(doSomeRelaxing);

  return app;
}

