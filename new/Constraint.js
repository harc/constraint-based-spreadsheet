App.Constraint = {
  grammar: ohm.namespace('rbs').getGrammar('Grammar'),
  create: function() {
    // TODO: replace <input> element w/ CodeMirror to make syntax highlighting, etc. possible.
    var $self = $('<aConstraint><input type="text"/><deleteButton/><error/></aConstraint>');
    var $input = $self.children('input');
    var $deleteButton = $self.children('deleteButton');
    var $error = $self.children('error');

    var expr = '';

    var self = $self[0];
    self.errorFn = function() { return 0; };
    self.varNames = [];

    var ENTER = 13;
    var ESC = 27;
    $input.keyup(function(e) {
      if (e.keyCode === ESC || e.keyCode === ENTER && !isDirty()) {
        $input.val(expr);
        parse($input.val());
        $input.blur();
      } else if (e.keyCode === ENTER) {
        exprChanged();
      }
      updateView();
    });

    $input.keypress(function(e) {
      var pretty = toPrettyChar(e.charCode);
      if (pretty !== undefined &&
          typeof this.selectionStart === 'number' && typeof this.selectionEnd == 'number') {
        var selectionStart = this.selectionStart;
        var selectionEnd = this.selectionEnd;
        this.value = this.value.slice(0, selectionStart) + pretty + this.value.slice(selectionEnd);
        this.setSelectionRange(selectionStart + 1, selectionStart + 1);
        return false;
      }
    });

    $input.change(exprChanged);

    $deleteButton.click(function() {
      $self.trigger('delete');
      $self.remove();
    });

    self.focus = function() {
      $input.focus();
    };

    function exprChanged() {
      var newExpr = $input.val();
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
      self.errorFn = toErrorFn(node);
      $self.trigger('change');
      updateView();
      $input.blur();
    };

    function updateView() {
      $self.toggleClass('dirty', isDirty());
      $self.toggleClass('withError', $error.children().length > 0);
    }

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

    function isDirty() {
      return $input.val() !== expr;
    }

    self.inlineVar = function(name, value) {
      if (expr.length === 0) {
        return;
      }

      var node = App.Constraint.grammar.matchContents(withoutPrettyChars(expr), 'Constraint');
      var intervals = [];
      var collectIntervals = App.Constraint.grammar.semanticAction({
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
      $input.val(newExpr);
      $input.trigger('change');
    };

    function refreshVarNames(node) {
      var varName = {};
      var recordVarNames = App.Constraint.grammar.semanticAction({
        ident:     function(_, _) { varName[this.interval.contents] = true; },
        _terminal: function()     {},
        _default:  function()     { this.children.forEach(function(child) { recordVarNames(child); }); }
      });
      recordVarNames(node);
      self.varNames = Object.keys(varName);
    }

    function toErrorFn(node) {
      return new Function('varDict', 'return ' + toErrorExpr(node) + ';');
    }

    var toErrorExpr = App.Constraint.grammar.synthesizedAttribute({
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

    function parse(newExpr) {
      $self.children('error').empty();
      try {
        return App.Constraint.grammar.matchContents(withoutPrettyChars(newExpr), 'Constraint', true);
      } catch (e) {
        $('<label>Expected: </label>').appendTo($error);
        $input[0].setSelectionRange(e.getPos(), e.getPos());
        e.getExpected().forEach(function(text, idx, expected) {
          if (idx > 0) {
            $('<light/>').text( idx === expected.length - 1 ? ', or ' : ', ').appendTo($error);
          }
          if (text.charAt(0) === '"' && text.charAt(text.length - 1) === '"' ||
              text.charAt(0) === "'" && text.charAt(text.length - 1) === "'") {
            text = text.substr(1, text.length - 2);
            $('<literal><light>"</light><code>' + text + '</code><light>"</light></literal>').appendTo($error);
          } else {
            $('<description>' + text + '</description>').appendTo($error);
          }
        });
        return undefined;
      }
    }

    return self;
  }
};

