App.Var = {
  create(name, value) {
    const $self = $('<aVar><lockButton/><barsButton/><name>' + name + '</name><input type="text"/><deleteButton/></aVar>');
    const $input = $self.children('input');
    const $lockButton = $self.children('lockButton');
    const $barsButton = $self.children('barsButton');
    const $deleteButton = $self.children('deleteButton');
    const $name = $self.children('name');

    let numDecimalPlaces = 2;
    let locked = false;
    let hasBar = false;

    const self = $self[0];

    Object.defineProperties(self, {
      value: {
        get() {
          return value;
        },
        set(newValue) {
          value = newValue;
          $input.val(newValue.toFixed(numDecimalPlaces));
          $name.attr('title', value);
          $self.toggleClass('dirty', false);
        }
      },
      locked: {
        get() {
          return locked;
        },
        set(newLocked) {
          locked = newLocked;
          $self.toggleClass('locked', locked);
        }
      },
      hasBar: {
        get() {
          return hasBar;
        },
        set(newHasBar) {
          hasBar = newHasBar;
          $self.toggleClass('hasBar', hasBar);
        }
      }
    });

    self.value = value;
    self.name = name;

    const ENTER = 13;
    const ESC = 27;
    $input.keyup(e => {
      const dirty = parseFloat($input.val()) !== parseFloat(value.toFixed(numDecimalPlaces));
      if (e.keyCode === ENTER && !dirty || e.keyCode === ESC) {
        self.value = self.value;  // to reset the contents of the input element
        $input.blur();
      } else {
        $self.toggleClass('dirty', dirty);
      }
    });

    $input.change(() => {
      if (isAllHashes($input.val())) {
        numDecimalPlaces = $input.val().length;
        self.value = self.value;  // to reset the contents of the input element
        $input.blur();
        return;
      }

      const newValue = parseFloat($input.val());
      if (Number.isNaN(newValue)) {
        return;
      }

      const oldValue = self.value;
      if (newValue !== oldValue) {
        self.value = newValue;
        $self.trigger('change');
      } else {
        // Do it anyway just to format the input
        self.value = newValue;
      }
      $input.blur();
    });

    $lockButton.click(() => {
      self.locked = !self.locked;
      $self.trigger('lockbuttonclick');
    });

    $barsButton.click(() => {
      self.hasBar = !self.hasBar;
      $self.trigger('barsbuttonclick');
    });

    $deleteButton.click(() => {
      $self.trigger('delete');
    });

    function isAllHashes(str) {
      for (let idx = 0; idx < str.length; idx++) {
        if (str[idx] !== '#') {
          return false;
        }
      }
      return true;
    }

    return self;
  }
};
