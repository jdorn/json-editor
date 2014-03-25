JSONEditor.defaults.editors.select = JSONEditor.AbstractEditor.extend({
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

    if(this.value === sanitized) {
      return;
    }

    this.input.value = this.enum_options[this.enum_values.indexOf(sanitized)];
    this.value = sanitized;
    this.jsoneditor.notifyWatchers(this.path);
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
    this.input.style.display = 'none';
    if(this.description) this.description.style.display = 'none';
    this.theme.disableLabel(this.label);
  },
  addProperty: function() {
    this._super();
    this.input.style.display = '';
    if(this.description) this.description.style.display = '';
    this.theme.enableLabel(this.label);
  },
  build: function() {
    var self = this;
    if(!this.getOption('compact',false)) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    this.input_type = 'select';
    this.enum_options = [];
    this.enum_values = [];

    // Enum options enumerated
    if(this.schema.enum) {
      $each(this.schema.enum,function(i,option) {
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

    if(this.getOption('compact')) this.container.setAttribute('class',this.container.getAttribute('class')+' compact');

    this.input = this.theme.getSelectInput(this.enum_options);

    if(this.schema.readOnly || this.schema.readonly) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    this.input.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      var val = this.value;

      var sanitized = val;
      if(self.enum_options.indexOf(val) === -1) {
        sanitized = self.enum_options[0];
      }

      self.value = self.enum_values[self.enum_options.indexOf(val)];
      
      if(self.parent) self.parent.onChildEditorChange(self);
      else self.jsoneditor.onChange();
      self.jsoneditor.notifyWatchers(self.path);
    });

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    this.value = this.enum_values[0];

    // If the Select2 library is loaded use it when we have lots of items
    if(window.$ && $.fn && $.fn.select2 && this.enum_options.length > 2) {
      $(this.input).select2();
    }

    self.theme.afterInputReady(self.input);
    this.jsoneditor.notifyWatchers(this.path);
  },
  enable: function() {
    if(!this.always_disabled) this.input.disabled = false;
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  },
  destroy: function() {
    if(this.label) this.label.parentNode.removeChild(this.label);
    if(this.description) this.description.parentNode.removeChild(this.description);
    this.input.parentNode.removeChild(this.input);

    this._super();
  }
});
