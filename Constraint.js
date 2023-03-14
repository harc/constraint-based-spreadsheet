App.Constraint = {
  grammar: ohm.namespace('rbs').getGrammar('Grammar'),
  create() {
    // TODO: replace <input> element w/ CodeMirror to make syntax highlighting, etc. possible.
    const $self = $('<aConstraint><input type="text"/><deleteButton/><error/></aConstraint>');
    const $input = $self.children('input');
    const $deleteButton = $self.children('deleteButton');
    const $error = $self.children('error');

    let expr = '';

    const self = $self[0];
    self.errorFn = () => 0;
    self.varNames = [];

    const ENTER = 13;
    const ESC = 27;
    $input.keyup(e => {
      if (e.keyCode === ESC || e.keyCode === ENTER && !isDirty()) {
        $input.val(expr);
        parse($input.val());
        $input.blur();
      } else if (e.keyCode === ENTER) {
        exprChanged();
      }
      updateView();
    });

    $input.keypress(e => {
      const pretty = toPrettyChar(e.charCode);
      if (pretty !== undefined &&
          typeof this.selectionStart === 'number' &&
          typeof this.selectionEnd == 'number') {
        const selectionStart = this.selectionStart;
        const selectionEnd = this.selectionEnd;
        this.value = this.value.slice(0, selectionStart) + pretty + this.value.slice(selectionEnd);
        this.setSelectionRange(selectionStart + 1, selectionStart + 1);
        return false;
      }
    });

    $input.change(exprChanged);

    $deleteButton.click(() => {
      $self.trigger('delete');
    });

    self.focus = () => $input.focus();

    function exprChanged() {
      const newExpr = $input.val();
      if (newExpr === expr) {
        return;
      }

      const node = parse(newExpr);
      if (!node) {
        updateView();
        return;
      }

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

    self.inlineVar = (name, value) => {
      if (expr.length === 0) {
        return;
      }

      const node = App.Constraint.grammar.matchContents(withoutPrettyChars(expr), 'Constraint');
      const intervals = [];
      const collectIntervals = App.Constraint.grammar.semanticAction({
        ident(_1, _2) {
          if (this.interval.contents === name) {
            intervals.push(this.interval);
          }
        },
        _terminal() {},
        _default() {
          this.children.forEach(child => collectIntervals(child));
        }
      });
      collectIntervals(node);
      if (intervals.length === 0) {
        return;
      }
      let newExpr = expr;
      while (intervals.length > 0) {
        const interval = intervals.pop();
        newExpr = newExpr.substr(0, interval.startIdx) + value + newExpr.substr(interval.endIdx);
      }
      $input.val(newExpr);
      $input.trigger('change');
    };

    function refreshVarNames(node) {
      const varName = {};
      const recordVarNames = App.Constraint.grammar.semanticAction({
        ident(_1, _2) {
          varName[this.interval.contents] = true;
        },
        _terminal() {},
        _default() {
          this.children.forEach(child => recordVarNames(child));
        }
      });
      recordVarNames(node);
      self.varNames = Object.keys(varName);
    }

    function toErrorFn(node) {
      return new Function('varDict', 'return ' + toErrorExpr(node) + ';');
    }

    const toErrorExpr = App.Constraint.grammar.synthesizedAttribute({
      Constraint(expr) {
        return toErrorExpr(expr);
      },
      Constraint_lt(x, _, y) {
        return '1000000 * Math.max(0, ' + toErrorExpr(x) + ' - (' + toErrorExpr(y) + '))';
      },
      Constraint_eq(x, _, y) {
        return toErrorExpr(x) + ' - (' + toErrorExpr(y) + ')';
      },
      Constraint_gt(x, _, y) {
        return '1000000 * Math.max(0, ' + toErrorExpr(y) + ' - (' + toErrorExpr(x) + '))';
      },
      Constraint_def(x, _, e) {
        throw new Error('TODO');
      },
      Expr(expr) {
        return toErrorExpr(expr);
      },
      AddExpr_plus(x, _, y) {
        return toErrorExpr(x) + ' + ' + toErrorExpr(y);
      },
      AddExpr_minus(x, _, y) {
        return toErrorExpr(x) + ' - ' + toErrorExpr(y);
      },
      AddExpr(expr) {
        return toErrorExpr(expr);
      },
      MulExpr_times1(x, y) {
        return toErrorExpr(x) + ' * ' + toErrorExpr(y);
      },
      MulExpr_times2(x, _, y) {
        return toErrorExpr(x) + ' * ' + toErrorExpr(y);
      },
      MulExpr_divide(x, _, y) {
        return toErrorExpr(x) + ' / ' + toErrorExpr(y);
      },
      MulExpr(expr) {
        return toErrorExpr(expr);
      },
      ExpExpr_exp(x, _, y) {
        return 'Math.pow('+ toErrorExpr(x) + ', ' + toErrorExpr(y) + ')';
      },
      ExpExpr(expr) {
        return toErrorExpr(expr);
      },
      PriExpr_paren(_1, e, _2) {
        return '(' + toErrorExpr(e) + ')';
      },
      PriExpr_pos(_, e) {
        return '(' + toErrorExpr(e) + ')';
      },
      PriExpr_neg(_, e) {
        return '-(' + toErrorExpr(e) + ')';
      },
      PriExpr(expr) {
        return toErrorExpr(expr);
      },
      ident(_1, _2) {
        return 'varDict.' + this.interval.contents + '.value';
      },
      number(_) {
        return this.interval.contents;
      }
    });

    function parse(newExpr) {
      $self.children('error').empty();
      try {
        return App.Constraint.grammar.matchContents(withoutPrettyChars(newExpr), 'Constraint', true);
      } catch (e) {
        $('<label>Expected: </label>').appendTo($error);
        $input[0].setSelectionRange(e.getPos(), e.getPos());
        e.getExpected().forEach((text, idx, expected) => {
          if (idx > 0) {
            $('<light/>').text( idx === expected.length - 1 ? ', or ' : ', ').appendTo($error);
          }
          if (
            text.charAt(0) === '"' && text.charAt(text.length - 1) === '"' ||
            text.charAt(0) === "'" && text.charAt(text.length - 1) === "'")
          {
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
