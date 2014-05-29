JSONEditor.defaults.editors.multiselect = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return [];
  },
  build: function() {
    var self = this;
    if(!this.getOption('compact',false)) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    this.select_options = {};
    this.select_values = {};

    var e = this.schema.items.enum || [];
    var options = [];
    for(var i=0; i<e.length; i++) {
      // If the sanitized value is different from the enum value, don't include it
      if(this.sanitize(e[i]) !== e[i]) continue;

      options.push(e[i]+"");
      this.select_values[e[i]+""] = e[i];
    }

    if((!this.schema.format && options.length < 8) || this.schema.format === "checkbox") {
      this.input_type = 'checkboxes';

      this.inputs = {};
      this.controls = {};
      for(var i=0; i<options.length; i++) {
        this.inputs[options[i]] = this.theme.getCheckbox();
        this.select_options[options[i]] = this.inputs[options[i]];
        var label = this.theme.getCheckboxLabel(options[i]);
        this.controls[options[i]] = this.theme.getFormControl(label, this.inputs[options[i]]);
      }

      this.control = this.theme.getMultiCheckboxHolder(this.controls,this.label,this.description);
    }
    else {
      this.input_type = 'select';
      this.input = this.theme.getSelectInput(options);
      this.input.multiple = true;
      this.input.size = Math.min(10,options.length);

      for(var i=0; i<options.length; i++) {
        this.select_options[options[i]] = this.input.children[i];
      }

      if(this.schema.readOnly || this.schema.readonly) {
        this.always_disabled = true;
        this.input.disabled = true;
      }

      this.control = this.getTheme().getFormControl(this.label, this.input, this.description);
    }

    this.container.appendChild(this.control);
    this.control.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();

      var new_value = [];
      for(var i = 0; i<options.length; i++) {
        if(self.select_options[options[i]].selected || self.select_options[options[i]].checked) new_value.push(self.select_values[options[i]]);
      }

      self.updateValue(new_value);

      if(self.parent) self.parent.onChildEditorChange(self);
      else self.jsoneditor.onChange();
      self.jsoneditor.notifyWatchers(self.path);
    });
  },
  setValue: function(value, initial) {
    value = value || [];
    if(typeof value !== "object") value = [value];
    else if(!(value instanceof Array)) value = [];

    // Make sure we are dealing with an array of strings so we can check for strict equality
    for(var i=0; i<value.length; i++) {
      if(typeof value[i] !== "string") value[i] += "";
    }

    // Update selected status of options
    for(var i in this.select_options) {
      if(!this.select_options.hasOwnProperty(i)) continue;

      this.select_options[i][this.input_type === "select"? "selected" : "checked"] = (value.indexOf(i) !== -1);
    }

    if(this.updateValue(value)) {
      if(this.parent) this.onChildEditorChange(this);
      else this.jsoneditor.onChange();
    }

    this.jsoneditor.notifyWatchers(this.path);
  },
  register: function() {
    this._super();
    if(!this.input) return;
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
    if(!this.input) return;
    this.input.removeAttribute('name');
  },
  getNumColumns: function() {
    var longest_text = this.getTitle().length;
    for(var i in this.select_values) {
      if(!this.select_values.hasOwnProperty(i)) continue;
      longest_text = Math.max(longest_text,(this.select_values[i]+"").length+4);
    }

    return Math.min(12,Math.max(longest_text/7,2));
  },
  updateValue: function(value) {
    var changed = false;
    var new_value = [];
    for(var i=0; i<value.length; i++) {
      if(!this.select_options[value[i]+""]) {
        changed = true;
        continue;
      }
      var sanitized = this.sanitize(this.select_values[value[i]]);
      new_value.push(sanitized);
      if(sanitized !== value[i]) changed = true;
    }
    this.value = new_value;
    return changed;
  },
  sanitize: function(value) {
    if(this.schema.items.type === "number") {
      return 1*value;
    }
    else if(this.schema.items.type === "integer") {
      return Math.floor(value*1);
    }
    else {
      return ""+value;
    }
  },
  enable: function() {
    if(!this.always_disabled) this.input.disabled = false;
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  }
});