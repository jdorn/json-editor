JSONEditor.defaults.editors.multiselect = JSONEditor.AbstractEditor.extend({
  preBuild: function() {
    this._super();
    var i;

    this.select_options = {};
    this.select_values = {};

    var items_schema = this.jsoneditor.expandRefs(this.schema.items || {});

    var e = items_schema["enum"] || [];
    var t = items_schema.options? items_schema.options.enum_titles || [] : [];
    this.option_keys = [];
    this.option_titles = [];
    for(i=0; i<e.length; i++) {
      // If the sanitized value is different from the enum value, don't include it
      if(this.sanitize(e[i]) !== e[i]) continue;

      this.option_keys.push(e[i]+"");
      this.option_titles.push((t[i]||e[i])+"");
      this.select_values[e[i]+""] = e[i];
    }
  },
  build: function() {
    var self = this, i;
    if(!this.options.compact) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    if((!this.schema.format && this.option_keys.length < 8) || this.schema.format === "checkbox") {
      this.input_type = 'checkboxes';

      this.inputs = {};
      this.controls = {};
      for(i=0; i<this.option_keys.length; i++) {
        this.inputs[this.option_keys[i]] = this.theme.getCheckbox();
        this.select_options[this.option_keys[i]] = this.inputs[this.option_keys[i]];
        var label = this.theme.getCheckboxLabel(this.option_titles[i]);
        this.controls[this.option_keys[i]] = this.theme.getFormControl(label, this.inputs[this.option_keys[i]]);
      }

      this.control = this.theme.getMultiCheckboxHolder(this.controls,this.label,this.description);
    }
    else {
      this.input_type = 'select';
      this.input = this.theme.getSelectInput(this.option_keys);
      this.theme.setSelectOptions(this.input,this.option_keys,this.option_titles);
      this.input.multiple = true;
      this.input.size = Math.min(10,this.option_keys.length);

      for(i=0; i<this.option_keys.length; i++) {
        this.select_options[this.option_keys[i]] = this.input.children[i];
      }

      if(this.schema.readOnly || this.schema.readonly) {
        this.always_disabled = true;
        this.input.disabled = true;
      }

      this.control = this.theme.getFormControl(this.label, this.input, this.description);
    }

    this.container.appendChild(this.control);
    this.control.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();

      var new_value = [];
      for(i = 0; i<self.option_keys.length; i++) {
        if(self.select_options[self.option_keys[i]].selected || self.select_options[self.option_keys[i]].checked) new_value.push(self.select_values[self.option_keys[i]]);
      }

      self.updateValue(new_value);
      self.onChange(true);
    });
  },
  setValue: function(value, initial) {
    var i;
    value = value || [];
    if(typeof value !== "object") value = [value];
    else if(!(Array.isArray(value))) value = [];

    // Make sure we are dealing with an array of strings so we can check for strict equality
    for(i=0; i<value.length; i++) {
      if(typeof value[i] !== "string") value[i] += "";
    }

    // Update selected status of options
    for(i in this.select_options) {
      if(!this.select_options.hasOwnProperty(i)) continue;

      this.select_options[i][this.input_type === "select"? "selected" : "checked"] = (value.indexOf(i) !== -1);
    }

    this.updateValue(value);
    this.onChange();
  },
  setupSelect2: function() {
    if(window.jQuery && window.jQuery.fn && window.jQuery.fn.select2) {
        var options = window.jQuery.extend({},JSONEditor.plugins.select2);
        if(this.schema.options && this.schema.options.select2_options) options = $extend(options,this.schema.options.select2_options);
        this.select2 = window.jQuery(this.input).select2(options);
        var self = this;
        this.select2.on('select2-blur',function() {
            var val =self.select2.select2('val');
            self.value = val;
            self.onChange(true);
        });
    }
    else {
        this.select2 = null;
    }
  },
  onInputChange: function() {
      this.value = this.input.value;
      this.onChange(true);
  },
  postBuild: function() {
      this._super();
      this.setupSelect2();
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
    if(this.select2) this.select2.select2('val',this.value);
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
    if(!this.always_disabled) {
      if(this.input) {
        this.input.disabled = false;
      }
      else if(this.inputs) {
        for(var i in this.inputs) {
          if(!this.inputs.hasOwnProperty(i)) continue;
          this.inputs[i].disabled = false;
        }
      }
      if(this.select2) this.select2.select2("enable",true);
      this._super();
    }
  },
  disable: function(always_disabled) {
    if(always_disabled) this.always_disabled = true;
    if(this.input) {
      this.input.disabled = true;
    }
    else if(this.inputs) {
      for(var i in this.inputs) {
        if(!this.inputs.hasOwnProperty(i)) continue;
        this.inputs[i].disabled = true;
      }
    }
    if(this.select2) this.select2.select2("enable",false);
    this._super();
  },
  destroy: function() {
    if(this.select2) {
        this.select2.select2('destroy');
        this.select2 = null;
    }
    this._super();
  }
});
