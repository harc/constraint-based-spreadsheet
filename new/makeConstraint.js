function makeConstraint() {
  var c = toDOM(
    ['aConstraint',
      withAttributes(['input'], {type: 'text'}),
      ['deleteButton'],
      ['error']]);

  var expr = '';
  var exprField = c.childNodes[0];
  var deleteButton = c.childNodes[1];
  var errorField = c.childNodes[2];

  var grammar = ohm.namespace('rbs').getGrammar('Grammar');

  function refreshVarNames(node) {
    var varName = {};
    var recordVarNames = grammar.semanticAction({
      ident:     function(_, _) { varName[this.interval.contents] = true; },
      _terminal: function()     {},
      _default:  function()     { this.children.forEach(function(child) { recordVarNames(child); }); }
    });
    recordVarNames(node);
    c.varNames = Object.keys(varName);
  }

  var toErrorExpr = grammar.synthesizedAttribute({
    Constraint:     function(expr)    { return toErrorExpr(expr); },
    Constraint_lt:  function(x, _, y) { return 'Math.max(0, ' + toErrorExpr(x) + ' - (' + toErrorExpr(y) + '))'; },
    Constraint_eq:  function(x, _, y) { return toErrorExpr(x) + ' - (' + toErrorExpr(y) + ')'; },
    Constraint_gt:  function(x, _, y) { return 'Math.max(0, ' + toErrorExpr(y) + ' - (' + toErrorExpr(x) + '))'; },
    Expr:           function(expr)    { return toErrorExpr(expr); },
    AddExpr_plus:   function(x, _, y) { return toErrorExpr(x) + ' + ' + toErrorExpr(y); },
    AddExpr_minus:  function(x, _, y) { return toErrorExpr(x) + ' - ' + toErrorExpr(y); },
    AddExpr:        function(expr)    { return toErrorExpr(expr); },
    MulExpr_times1: function(x, y)    { return toErrorExpr(x) + ' * ' + toErrorExpr(y); },
    MulExpr_times2: function(x, _, y) { return toErrorExpr(x) + ' * ' + toErrorExpr(y); },
    MulExpr_divide: function(x, _, y) { return toErrorExpr(x) + ' / ' + toErrorExpr(y); },
    MulExpr:        function(expr)    { return toErrorExpr(expr); },
    ExpExpr_exp:    function(x, _, y) { return 'Math.pow('+ toErrorExpr(x) + ', ' + toErrorExpr(y) + ')'; },
    ExpExpr:        function(expr)    { return toErrorExpr(expr); },
    PriExpr_paren:  function(_, e, _) { return '(' + toErrorExpr(e) + ')'; },
    PriExpr_pos:    function(_, e)    { return '(' + toErrorExpr(e) + ')'; },
    PriExpr_neg:    function(_, e)    { return '-(' + toErrorExpr(e) + ')'; },
    PriExpr:        function(expr)    { return toErrorExpr(expr); },
    ident:          function(_, _)    { return 'varDict.' + this.interval.contents + '.value'; },
    number:         function(_)       { return this.interval.contents; }
  });

  function toErrorFn(node) {
    return new Function('varDict', 'return ' + toErrorExpr(node) + ';');
  }

  c.inlineVar = function(name, value) {
    if (expr.length === 0) {
      return;
    }

    var node = grammar.matchContents(withoutPrettyChars(expr), 'Constraint');
    var intervals = [];
    var collectIntervals = grammar.semanticAction({
      ident:     function(_, _) {
                   if (this.interval.contents === name) {
                     intervals.push(this.interval);
                   }
                 },
      _terminal: function() {},
      _default:  function() { this.children.forEach(function(child) { collectIntervals(child); }); }
    });
    collectIntervals(node);
    if (intervals.length === 0) {
      return;
    }
    var newExpr = expr;
    while (intervals.length > 0) {
      var interval = intervals.pop();
      newExpr = newExpr.substr(0, interval.startIdx) + value + newExpr.substr(interval.endIdx);
    }
    exprField.value = newExpr;
    exprField.onchange();
  };

  function isDirty() {
    return exprField.value !== expr;
  }

  function updateView() {
    c.className = (isDirty() ? 'dirty' : '') + (errorField.childNodes.length > 0 ? ' withError' : '');
  }

  var ENTER = 13;
  var ESC = 27;
  exprField.onkeyup = function(e) {
    if (e.keyCode === ESC || e.keyCode === ENTER && !isDirty()) {
      exprField.value = expr;
      parse(exprField.value);
      this.blur();
    } else if (e.keyCode === ENTER) {
      exprField.onchange();
    }
    updateView();
  };

  function toPrettyChar(charCode) {
    switch (charCode) {
      case 42: return '\u00D7';
      case 45: return '\u2013';
      case 47: return '\u00F7';
      default: return undefined;
    }
  }

  function withoutPrettyChars(str) {
    return str.
        replace(/\u00D7/g, '*').
        replace(/\u2013/g, '-').
        replace(/\u00F7/g, '/');
  }

  exprField.onkeypress = function(e) {
    var pretty = toPrettyChar(e.charCode);
    if (pretty !== undefined &&
        typeof this.selectionStart === 'number' && typeof this.selectionEnd == 'number') {
      var selectionStart = this.selectionStart;
      var selectionEnd = this.selectionEnd;
      this.value = this.value.slice(0, selectionStart) + pretty + this.value.slice(selectionEnd);
      this.setSelectionRange(selectionStart + 1, selectionStart + 1);
      return false;
    }
  };

  exprField.onchange = function() {
    var newExpr = this.value;
    if (newExpr === expr) {
      return;
    }

    var node = parse(newExpr);
    if (!node) {
      updateView();
      return;
    }

    var oldExpr = expr;
    expr = newExpr;
    refreshVarNames(node);
    c.errorFn = toErrorFn(node);
    c.dispatchEvent(new CustomEvent('valuechange', {detail: {oldValue: oldExpr, newValue: newExpr}}));
    updateView();
    this.blur();
  };

  function parse(newExpr) {
    errorField.innerHTML = '';
    try {
      return grammar.matchContents(withoutPrettyChars(newExpr), 'Constraint', true);
    } catch (e) {
      errorField.innerHTML = '<label>Expected: </label>';
      exprField.setSelectionRange(e.getPos(), e.getPos());
      e.getExpected().forEach(function(text, idx, expected) {
        var element = createExpectedElement(text);
        if (idx > 0) {
          errorField.appendChild(toDOM(['light', idx === expected.length - 1 ? ', or ' : ', ']));
        }
        errorField.appendChild(element);
      });
      return undefined;
    }
  }

  function createExpectedElement(s) {
    return toDOM(
        s.charAt(0) === '"' && s.charAt(s.length - 1) === '"' ||
        s.charAt(0) === "'" && s.charAt(s.length - 1) === "'" ?
            ['literal',
              ['light', '"'],
              ['code', s.substr(1, s.length - 2)],
              ['light', '"']] :
            ['description', s]
    );
  }

  deleteButton.onclick = function() {
    c.dispatchEvent(new CustomEvent('delete'));
    c.parentNode.removeChild(c);
  };

  c.focus = function() {
    exprField.focus();
  };

  exprField.value = '';
  c.errorFn = function() { return 0; };
  updateView();
  return c;
}

