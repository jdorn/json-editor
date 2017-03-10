JSONEditor.defaults.editors.arraySelectize = JSONEditor.AbstractEditor.extend({
  build: function() {
    this.title = this.theme.getFormInputLabel(this.getTitle());

    this.title_controls = this.theme.getHeaderButtonHolder();
    this.title.appendChild(this.title_controls);
    this.error_holder = document.createElement('div');

    if(this.schema.description) {
      this.description = this.theme.getDescription(this.schema.description);
    }

    this.input = document.createElement('select');
    this.input.setAttribute('multiple', 'multiple');

    var group = this.theme.getFormControl(this.title, this.input, this.description);

    this.container.appendChild(group);
    this.container.appendChild(this.error_holder);

    window.jQuery(this.input).selectize({
      delimiter: false,
      createOnBlur: true,
      create: true
    });
  },
  postBuild: function() {
      var self = this;
      this.input.selectize.on('change', function(event) {
          self.refreshValue();
          self.onChange(true);
      });
  },
  destroy: function() {
    this.empty(true);
    if(this.title && this.title.parentNode) this.title.parentNode.removeChild(this.title);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);

    this._super();
  },
  empty: function(hard) {},
  setValue: function(value, initial) {
    var self = this;
    // Update the array's value, adding/removing rows when necessary
    value = value || [];
    if(!(Array.isArray(value))) value = [value];

    this.input.selectize.clearOptions();
    this.input.selectize.clear(true);

    value.forEach(function(item) {
      self.input.selectize.addOption({text: item, value: item});
    });
    this.input.selectize.setValue(value);

    this.refreshValue(initial);
  },
  refreshValue: function(force) {
    this.value = this.input.selectize.getValue();
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $each(errors, function(i,error) {
      if(error.path === self.path) {
        my_errors.push(error);
      }
      else {
        other_errors.push(error);
      }
    });

    // Show errors for this editor
    if(this.error_holder) {

      if(my_errors.length) {
        var message = [];
        this.error_holder.innerHTML = '';
        this.error_holder.style.display = '';
        $each(my_errors, function(i,error) {
          self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.style.display = 'none';
      }
    }
  }
});
