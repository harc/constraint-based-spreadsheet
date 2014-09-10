var ConstraintLanguage = {
    grammar: ohm.namespace('constraints')
        .loadGrammarsFromScriptElement(document.getElementById('grammar'))
        .getGrammar('G'),

    _toErrorExpr: {
        Constraint:      function(x, y)           { return 'Math.abs(' + x.value + ' - (' + y.value + '))'; },
        Expr:            function(expr)           { return expr.value; },
        AddExpr_plus:    function(x, op, y)       { return x.value + op.value + y.value; },
        AddExpr_minus:   function(x, op, y)       { return x.value + op.value + y.value; },
        AddExpr:         function(expr)           { return expr.value; },
        MulExpr_times:   function(x, op, y)       { return x.value + op.value + y.value; },
        MulExpr_divide:  function(x, op, y)       { return x.value + op.value + y.value; },
        MulExpr_modulus: function(x, op, y)       { return x.value + op.value + y.value; },
        MulExpr:         function(expr)           { return expr.value; },
        PriExpr_paren:   function(open, e, close) { return '(' + e.value + ')'; },
        PriExpr_pos:     function(sign, e)        { return '(' + sign.value + e.value + ')'; },
        PriExpr_neg:     function(sign, e)        { return '(' + sign.value + e.value + ')'; },
        PriExpr:         function(expr)           { return expr.value; },
        ident:           function()               { return 'vars.' + this.interval.contents; },
        number:          function()               { return this.interval.contents; }
    },

    _recordVars: function(dict) {
      return {
        ident: function() { dict[this.interval.contents] = true; }
      };
    },

    constraintFromString: function(str, optWeight) {
      var thunk = this.grammar.matchContents(str, 'Constraint');
      if (thunk === undefined) {
        throw 'invalid constraint: ' + str;
      }

      var vars = {};
      thunk(this._recordVars(vars), 'eager');

      var expr = thunk(this._toErrorExpr);
      if (optWeight) {
        expr += ' * ' + optWeight;
      }

      return {
          expr: str,
          vars: Object.keys(vars),
          errorFn: new Function('vars', 'return ' + expr)
      };
    }
};

