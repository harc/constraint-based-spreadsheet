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
      var self = this;
      var c = {
        init: function(str, optWeight) {
          this.expr = str;
          this.weight = optWeight || 1;

          var thunk = self.grammar.matchContents(str, 'Constraint');
          if (thunk === undefined) {
            throw 'invalid constraint: ' + str;
          }

          var vars = {};
          thunk(self._recordVars(vars), 'eager');
          this.vars = Object.keys(vars);

          var errorExpr = thunk(self._toErrorExpr) + ' * ' + this.weight;
          this.errorFn = new Function('vars', 'return ' + errorExpr);
        },
        killVar: function(name, value) {
          var idx = this.vars.indexOf(name);
          if (idx >= 0) {
            var newExpr = '';
            var parts = this.expr.split(name);
            for (var p = 0; p < parts.length; p++) {
              var thisPart = parts[p];
              var lastPart = parts[p - 1];
              var nextPart = parts[p + 1];
              if (p > 0 &&
                  !(lastPart && /[a-zA-Z0-9]/.test(lastPart[lastPart.length - 1]) ||
                    nextPart && /[a-zA-Z0-9]/.test(nextPart[0]))) {
                newExpr += value;
              }
              newExpr += thisPart;
            }
            this.init(newExpr, this.weight);
            return true;
          } else {
            return false;
          }
        }
      };
      c.init(str, optWeight);
      return c;
    }
};

