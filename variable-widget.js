var VariableWidget = {
    create: function(name, value, optEditable, optNoDeleteButton) {
      var node = document.createElement('variable');
      var nameNode = node.appendChild(this._createNameNode(name));
      var valueNode = node.appendChild(this._createValueNode(value, optEditable !== undefined ? optEditable : true));

      if (!optNoDeleteButton) {
        var deleteButtonNode = node.appendChild(this._createDeleteButtonNode());
        deleteButtonNode.addEventListener(
            'click',
            function() {
              node.dispatchEvent(new CustomEvent('delete', {detail: {variable: name}}));
            },
            false
        );
      }

      node.renderValue = function() {
        this.renderedValue = valueNode.innerHTML = '' + this.value; //this.value.toFixed(2).replace(/\.?0+$/, '');
      };

      node.updateValue = function() {
        var newValue = parseFloat(valueNode.innerHTML);
        if (isFinite(newValue) && newValue !== this.value) {
          var oldValue = this.value;
          this.value = newValue;
          this.renderValue();
          this.dispatchEvent(new CustomEvent('valuechange', {detail: {oldValue: oldValue, newValue: newValue}}));
        } else {
          this.renderValue();
        }
        valueNode.blur();
      };

      node.updateClassName = function() {
        var className = '';
        if (valueNode.innerHTML !== node.renderedValue) {
          className += 'dirty';
        }
        if (node.locked) {
          className += ' locked';
        }
        node.className = className;
      };

      node.setValue = function(newValue) {
        this.value = newValue;
        this.setAttribute('title', this.value);
        this.renderValue();
        this.updateClassName();
      };

      node.name = name;
      node.setValue(value);
      node.locked = false;

      return node;
    },

    _createNameNode: function(name) {
      var nameNode = document.createElement('name');
      nameNode.appendChild(document.createTextNode(name));

      nameNode.addEventListener(
        'click',
        function(e) {
          if (e.metaKey) {
            var locked = nameNode.parentElement.locked = !nameNode.parentElement.locked;
            nameNode.parentElement.updateClassName();
            e.preventDefault();
            nameNode.parentElement.dispatchEvent(new CustomEvent('lockedchange', {detail: {locked: locked}}));
          }
        },
        false
      );

      return nameNode;
    },

    _createValueNode: function(value, editable) {
      var valueNode = document.createElement('value');
      valueNode.setAttribute('contenteditable', editable);

      valueNode.addEventListener(
          'keydown',
          function(e) {
            if (e.which === 13) {
              this.parentElement.updateValue();
              e.preventDefault();
            }
            setTimeout(this.parentElement.updateClassName, 0);
          },
          false
      );

      valueNode.addEventListener(
          'blur',
          function(e) {
            this.parentElement.updateValue();
          },
          false
      );

      return valueNode;
    },

    _createDeleteButtonNode: function() {
      var node = document.createElement('deleteButton');
      node.innerHTML = '&nbsp;';
      return node;
    }    
};

