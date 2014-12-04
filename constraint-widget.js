var ConstraintWidget = {
    create: function(constraint) {
      var node = document.createElement('constraint');
      node.constraint = constraint;
      var exprNode = node.appendChild(this._createExprNode(constraint.expr));
      var deleteButtonNode = node.appendChild(this._createDeleteButtonNode());

      deleteButtonNode.addEventListener(
          'click',
          function() {
            node.dispatchEvent(new CustomEvent('delete', {detail: {constraint: constraint}}));
          },
          false
      );
 
      node.update = function() {
        if (exprNode.innerHTML !== this.constraint.expr) {
          try {
            var oldExpr = this.constraint.expr;
            var c = ConstraintLanguage.constraintFromString(exprNode.innerHTML);
            this.constraint.expr = c.expr;
            this.constraint.vars = c.vars;
            this.constraint.errorFn = c.errorFn;
            this.dispatchEvent(
                new CustomEvent('valuechange', {detail: {oldValue: oldExpr, newValue: this.constraint.expr}}));
          } catch(e) {
            exprNode.innerHTML = this.constraint.expr;
          }
        }
        exprNode.blur();
      };

      node.updateDirty = function() {
        node.className = exprNode.innerHTML !== node.constraint.expr ? 'dirty' : '';
      };

      return node;
    },

    _createDeleteButtonNode: function() {
      var node = document.createElement('deleteButton');
      node.innerHTML = '&nbsp;';
      return node;
    },

    _createExprNode: function(expr) {
      var exprNode = document.createElement('expr');
      exprNode.innerHTML = expr;
      exprNode.setAttribute('contenteditable', true);
      exprNode.setAttribute('spellcheck', false);

      exprNode.addEventListener(
          'keydown',
          function(e) {
            if (e.which === 13) {
              this.parentElement.update();
              e.preventDefault();
            }
            setTimeout(this.parentElement.updateDirty, 0);
          },
          false
      );

      exprNode.addEventListener(
          'blur',
          function(e) {
            this.parentElement.update();
          },
          false
      );

      return exprNode;
    }
};

