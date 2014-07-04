JSONEditor.defaults.editors.radio = JSONEditor.AbstractEditor.extend({
  setValue: function(value,initial) {
    value = this.typecast(value || '');

    // Sanitize value before setting it
    var sanitized = value;
    if(this.schema.enum.indexOf(sanitized) < 0) {
      sanitized = this.schema.enum[0];
    }

    if(this.value === sanitized) {
      return;
    }

    var self = this;
    $each(this.inputs,function(i,input) {
      if (input.value === sanitized) {
        input.checked = true;
        self.value = sanitized;
        self.jsoneditor.notifyWatchers(self.path);
        return false;
      }
    });
  },
  register: function() {
    this._super();
    if(!this.inputs) return;
    $each(this.inputs,function(i,input) {
      input.setAttribute('name',this.formname);
    });
  },
  unregister: function() {
    this._super();
    if(!this.inputs) return;
    $each(this.inputs,function(i,input) {
      input.removeAttribute('name');
    });
  },
  getNumColumns: function() {
    var longest_text = this.getTitle().length;
    for(var i=0; i<this.schema.enum.length; i++) {
      longest_text = Math.max(longest_text,this.schema.enum[i].length+4);
    }
    return Math.min(12,Math.max(longest_text/7,2));
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
    $each(this.inputs,function(i,input) {
      input.style.display = 'none';
    });
    if(this.description) this.description.style.display = 'none';
    this.theme.disableLabel(this.label);
  },
  addProperty: function() {
    this._super();
    $each(this.inputs,function(i,input) {
      input.style.display = '';
    });
    if(this.description) this.description.style.display = '';
    this.theme.enableLabel(this.label);
  },
  sanitize: function(value) {
    if(this.schema.type === "number") {
      return 1*value;
    }
    else if(this.schema.type === "integer") {
      return Math.floor(value*1);
    }
    else {
      return ""+value;
    }
  },
  build: function() {
    var self = this, i;
    if(!this.getOption('compact',false)) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    this.select_options = {};
    this.select_values = {};

    var e = this.schema.enum || [];
    var options = [];
    for(i=0; i<e.length; i++) {
      // If the sanitized value is different from the enum value, don't include it
      if(this.sanitize(e[i]) !== e[i]) continue;

      options.push(e[i]+"");
      this.select_values[e[i]+""] = e[i];
    }

    this.input_type = 'radiogroup';
    this.inputs = {};
    this.controls = {};
    for(i=0; i<options.length; i++) {
      this.inputs[options[i]] = this.theme.getRadio();
      this.inputs[options[i]].setAttribute('value', options[i]);
      this.inputs[options[i]].setAttribute('name', this.formname);
      var label = this.theme.getRadioLabel((this.schema.enumTitles && this.schema.enumTitles[options[i]]) ?
          this.schema.enumTitles[options[i]]
          : options[i]);
      label.setAttribute('for', this.formname);
      this.controls[options[i]] = this.theme.getFormControl(label, this.inputs[options[i]]);
    }

    this.control = this.theme.getRadioGroupHolder(this.controls,this.label,this.description);
    this.container.appendChild(this.control);
    this.control.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();

      var val = e.target.value;

      var sanitized = val;
      if(self.schema.enum.indexOf(val) === -1) {
        sanitized = self.schema.enum[0];
      }

      self.value = sanitized;

      if(self.parent) self.parent.onChildEditorChange(self);
      else self.jsoneditor.onChange();
      self.jsoneditor.notifyWatchers(self.path);
    });
  },
  enable: function() {
    if(!this.always_disabled) {
      $each(this.inputs,function(i,input) {
        input.disabled = false;
      });
    }
    this._super();
  },
  disable: function() {
    $each(this.inputs,function(i,input) {
      input.disabled = true;
    });
    this._super();
  },
  destroy: function() {
    if(this.label) this.label.parentNode.removeChild(this.label);
    if(this.description) this.description.parentNode.removeChild(this.description);
    $each(this.inputs,function(i,input) {
      input.parentNode.removeChild(input);  
    });
    this._super();
  }
});