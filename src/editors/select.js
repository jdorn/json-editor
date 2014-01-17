$.jsoneditor.editors.select = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || '';
  },
  setValue: function(value,initial) {
    value = this.typecast(value||'');

    // Sanitize value before setting it
    var sanitized = value;
    if(this.enum_values.indexOf(sanitized) < 0) {
      sanitized = this.enum_values[0];
    }

    this.input.val(this.enum_options[this.enum_values.indexOf(sanitized)]);
    this.value = sanitized;

    if(sanitized !== value) this.input.trigger('change');

    this.input.trigger('set');
  },
  typecast: function(value) {
    if(this.schema.type === "boolean") {
      return !!value;
    }
    else if(this.schema.type === "number") {
      return 1*value;
    }
    else if(this.schema.type === "integer") {
      return Math.floor(value*1);
    }
    else {
      return ""+value;
    }
  },
  getValue: function() {
    return this.value;
  },
  removeProperty: function() {
    this._super();
    this.input.hide(500);
    if(this.description) this.description.hide(500);
    this.theme.disableLabel(this.label);
  },
  addProperty: function() {
    this._super();
    this.input.show(500);
    if(this.description) this.description.show(500);
    this.theme.enableLabel(this.label);
  },
  build: function() {
    var self = this;
    if(!this.getOption('compact',false)) this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    this.input_type = 'select';
    this.enum_options = [];
    this.enum_values = [];

    // Enum options enumerated
    if(this.schema.enum) {
      $.each(this.schema.enum,function(i,option) {
        self.enum_options[i] = ""+option;
        self.enum_values[i] = self.typecast(option);
      });
    }
    // Boolean
    else if(this.schema.type === "boolean") {
      self.enum_options = ['true','false'];
      self.enum_values = [true,false];
    }
    // Other, not supported
    else {
      throw "'select' editor requires the enum property to be set."
    }

    if(this.getOption('compact')) this.container.addClass('compact');

    this.input = this.theme.getSelectInput(this.enum_options);

    this.input
      .attr('data-schemapath',this.path)
      .attr('data-schematype',this.schema.type)
      .on('change keyup',function(e) {
        var val = $(this).val();

        var sanitized = val;
        if(self.enum_options.indexOf(val) === -1) {
          sanitized = self.enum_options[0];
        }

        self.value = self.enum_values[self.enum_options.indexOf(val)];
      });

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description).appendTo(this.container);

    this.value = this.enum_values[0];

    self.theme.afterInputReady(self.input);
  },
  destroy: function() {
    if(this.label) this.label.remove();
    if(this.description) this.description.remove();
    this.input.remove();

    this._super();
  }
});
