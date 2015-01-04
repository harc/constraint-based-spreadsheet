App.Var = {
  create: function(name, value) {
    var $self = $('<aVar><lockButton/><name>' + name + '</name><input type="text"/><deleteButton/></aVar>');
    var $input = $self.children('input');
    var $lockButton = $self.children('lockButton');
    var $name = $self.children('name');
    var $deleteButton = $self.children('deleteButton');

    var numDecimalPlaces = 2;
    var locked = false;

    var self = $self[0];

    Object.defineProperties(self, {
      value: {
        get: function() {
          return value;
        },
        set: function(newValue) {
          value = newValue;
          $input.val(newValue.toFixed(numDecimalPlaces));
          $name.attr('title', value);
          $self.toggleClass('dirty', false);
        }
      },
      locked: {
        get: function() {
          return locked;
        },
        set: function(newLocked) {
          locked = newLocked;
          $self.toggleClass('locked', locked);
        }
      }
    });

    self.value = value;
    self.name = name;

    var ENTER = 13;
    var ESC = 27;
    $input.keyup(function(e) {
      var dirty = parseFloat($input.val()) !== parseFloat(value.toFixed(numDecimalPlaces));
      if (e.keyCode === ENTER && !dirty || e.keyCode === ESC) {
        self.value = self.value;  // to reset the contents of the input element
        $input.blur();
      } else {
        $self.toggleClass('dirty', dirty);
      }
    });

    $input.change(function() {
      if (isAllHashes($input.val())) {
        numDecimalPlaces = $input.val().length;
        self.value = self.value;  // to reset the contents of the input element
        $input.blur();
        return;
      }

      var newValue = parseFloat($input.val());
      if (Number.isNaN(newValue)) {
        return;
      }

      var oldValue = self.value;
      if (newValue !== oldValue) {
        self.value = newValue;
        $self.trigger('change');
      } else {
        // Do it anyway just to format the input
        self.value = newValue;
      }
      $input.blur();
    });

    $lockButton.click(function() {
      self.locked = !self.locked;
      $self.trigger('lockbuttonclick');
    });

    $deleteButton.click(function() {
      $self.trigger('delete');
      $self.remove();
    });

    function isAllHashes(str) {
      for (var idx = 0; idx < str.length; idx++) {
        if (str[idx] !== '#') {
          return false;
        }
      }
      return true;
    }

    return self;
   }
};

