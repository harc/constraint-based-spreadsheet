function makeVar(name, value) {
  var v = toDOM(
    ['aVar',
      ['lockButton'],
      ['name', name],
      withAttributes(['input'], {type: 'text'}),
      ['deleteButton']]);

  var lockButton = v.childNodes[0];
  var nameField = v.childNodes[1];
  var valueField = v.childNodes[2];
  var deleteButton = v.childNodes[3];

  var numDecimalPlaces = 2;

  var locked = false;
  Object.defineProperties(v, {
    value: {
      get: function() {
        return value;
      },
      set: function(newValue) {
        value = newValue;
        valueField.value = newValue.toFixed(numDecimalPlaces);
        updateView();
      }
    },
    locked: {
      get: function() {
        return locked;
      },
      set: function(newLocked) {
        locked = newLocked;
        updateView();
      }
    }
  });

  function isDirty() {
    return parseFloat(valueField.value) !== parseFloat(value.toFixed(numDecimalPlaces));
  }

  function updateView() {
    v.className = (locked ? 'locked ' : '') + (isDirty() ? 'dirty' : '');
    v.setAttribute('title', value);
  }

  valueField.onkeyup = function(e) {
    updateView();
    if (e.keyCode === 13 && !isDirty() || e.keyCode === 27) {
      v.value = v.value;
      this.blur();
    }
  };

  function isAllHashes(str) {
    for (var idx = 0; idx < str.length; idx++) {
      if (str[idx] !== '#') {
        return false;
      }
    }
    return true;
  }

  valueField.onchange = function() {
    if (isAllHashes(this.value)) {
      numDecimalPlaces = this.value.length;
      v.value = v.value;
      this.blur();
      return;
    }

    var newValue = parseFloat(this.value);
    if (isNaN(newValue)) {
      return;
    }

    var oldValue = v.value;
    if (newValue !== oldValue) {
      v.value = newValue;
      v.dispatchEvent(new CustomEvent('valuechange', {detail: {oldValue: oldValue, newValue: newValue}}));
    } else {
      // Do it anyway to format the input
      v.value = newValue;
    }
    this.blur();
  };

  lockButton.onclick = function() {
    v.locked = !v.locked;
    v.dispatchEvent(new CustomEvent('lockbuttonclick', {detail: {locked: v.locked}}));
  };

  deleteButton.onclick = function() {
    v.dispatchEvent(new CustomEvent('delete'));
    v.parentNode.removeChild(v);
  };

  v.value = value;
  v.name = name;

  return v;
}

