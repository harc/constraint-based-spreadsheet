var App = {};

App.GOOD_EFFORT_TIME_MS = 2000,

App.init = function() {
  $('addConstraintButton').click(function() {
    var newC = addConstraint();
    $('constraints').append(newC);
    newC.focus();
  });

  var relaxButtonDown = false;
  $('relaxButton').mousedown(function() { relaxButtonDown = true; });
  $(document.body).mouseup(function() { relaxButtonDown = false; });

  function setError(error) {
    $('relaxButton').text(error.toFixed(5));
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
    $('constraints').append(constraint);
    errorFns.push(constraint.errorFn);
    relaxForUpTo(App.GOOD_EFFORT_TIME_MS);

    $(constraint).change(function() {
      errorFns.splice($(constraint).index(), 1, constraint.errorFn);
      constraint.varNames.forEach(function(name) {
        if (!varDict[name]) {
          addVar(name);
        }
      });
      relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
    });

    $(constraint).on('delete', function() {
      errorFns.splice($(constraint).index(), 1);
      relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
    });

    return constraint;
  }

  function addVar(name) {
    var aVar = makeVar(name, 0);
    $('vars').append(aVar);
    varDict[name] = aVar;

    var lockButtonClickCount = 0;
    $(aVar).on('lockbuttonclick', function(e) {
      lockButtonClickCount++;
      if (!e.originalEvent.detail.locked) {
        relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
      }
    });

    $(aVar).change(function() {
      var fn;
      if (!aVar.locked) {
        aVar.locked = true;
        var oldLockButtonClickCount = lockButtonClickCount;
        fn = function() {
          if (lockButtonClickCount === oldLockButtonClickCount) {
            aVar.locked = false;
            relaxForUpTo(App.GOOD_EFFORT_TIME_MS);
          }
        };
      }
      relaxForUpTo(App.GOOD_EFFORT_TIME_MS, fn);
    });

    $(aVar).on('delete', function() {
      $('aConstraint').each(function() { this.inlineVar(aVar.name, aVar.value); });
    });
  }

  setError(0);

  var relax = new Relax(varDict, errorFns);

  var relaxing = false;
  var relaxed = true;

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
    $('app').toggleClass('relaxing', relaxing);
    $('app').toggleClass('relaxed', relaxed);
    requestAnimationFrame(doSomeRelaxing);
  }
  requestAnimationFrame(doSomeRelaxing);
};

