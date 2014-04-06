// Multiple Editor (for when `type` is an array)
JSONEditor.defaults.editors.multiple = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return null;
  },
  register: function() {
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
        this.editors[i].unregister();
      }
      if(this.editors[this.type]) this.editors[this.type].register();
    }
    this._super();
  },
  getNumColumns: function() {
    return Math.max(this.editors[this.type].getNumColumns(),4);
  },
  enable: function() {
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
        this.editors[i].enable();
      }
    }
    this.switcher.disabled = false;
    this._super();
  },
  disable: function() {
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
        this.editors[i].disable();
      }
    }
    this.switcher.disabled = true;
    this._super();
  },
  unregister: function() {
    this._super();
    if(this.editors) {
      for(var i=0; i<this.editors.length; i++) {
        this.editors[i].unregister();
      }
    }
  },
  build: function() {
    var self = this;
    var container = this.container;

    this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    this.container.appendChild(this.header);

    this.types = [];
    
    if(this.schema.oneOf) {
      this.oneOf = true;
      this.types = this.schema.oneOf;
      delete this.schema.oneOf;
    }
    else {
      if(!this.schema.type || this.schema.type === "any") {
        this.types = ['string','number','integer','boolean','object','array','null'];
        
        // If any of these primitive types are disallowed
        if(this.schema.disallow) {
          var disallow = this.schema.disallow;
          if(typeof schema.disallow !== 'object' || !(schema.disallow instanceof Array)) {
            disallow = [this.schema.disallow];
          }
          var allowed_types = [];
          $each(this.types,function(i,type) {
            if(disallow.indexOf(type) === -1) allowed_types.push(type);
          });
          this.types = allowed_types;
        }
      }
      else if(this.schema.type instanceof Array) {
        this.types = this.schema.type;
      }
      else {
        this.types = [this.schema.type];
      }
      delete this.schema.type;
    }
    
    this.display_text = this.getDisplayText(this.types);

    this.switcher = this.theme.getSwitcher(this.display_text);
    container.appendChild(this.switcher);
    this.switcher.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      self.type = self.display_text.indexOf(this.value);

      self.register();

      var current_value = self.getValue();

      $each(self.editors,function(type,editor) {
        if(self.type === type) {
          editor.setValue(current_value,true);
          editor.container.style.display = '';
        }
        else editor.container.style.display = 'none';
      });
      self.refreshValue();
      
      if(self.parent) self.parent.onChildEditorChange(self);
      else self.jsoneditor.onChange();
    })
    this.switcher.style.marginBottom = 0;
    this.switcher.style.width = 'auto';
    this.switcher.style.display = 'inline-block';
    this.switcher.style.marginLeft = '5px';

    this.editor_holder = document.createElement('div');
    container.appendChild(this.editor_holder);
    this.type = 0;

    this.editors = [];
    this.validators = [];
    var options = this.theme.getSwitcherOptions(this.switcher);
    var option = 0;
    $each(this.types,function(i,type) {
      var holder = self.theme.getChildEditorHolder();
      self.editor_holder.appendChild(holder);

      var schema;
      
      if(typeof type === "string") {
        schema = $extend({},self.schema);
        schema.type = type;
      }
      else {
        schema = $extend({},self.schema,type);

        // If we need to merge `required` arrays
        if(type.required && type.required instanceof Array && self.schema.required && self.schema.required instanceof Array) {
          schema.required = self.schema.required.concat(type.required);
        }
      }

      self.validators[i] = new JSONEditor.Validator(schema,{
        required_by_default: self.jsoneditor.options.required_by_default,
        no_additional_properties: self.jsoneditor.options.no_additional_properties
      });

      var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);

      self.editors[i] = self.jsoneditor.createEditor(editor,{
        jsoneditor: self.jsoneditor,
        schema: schema,
        container: holder,
        path: self.path,
        parent: self,
        required: true
      });
      if(self.editors[i].header) self.editors[i].header.style.display = 'none';
      
      self.editors[i].option = options[option];
      
      holder.addEventListener('change_header_text',function() {
        self.refreshHeaderText();
      });

      if(i !== self.type) holder.style.display = 'none';
      
      option++;
    });

    this.refreshValue();
    this.refreshHeaderText();

    this.register();
  },
  onChildEditorChange: function(editor) {
    if(this.editors[this.type]) {
      this.refreshHeaderText();
      this.refreshValue();
    }
    
    this._super();
  },
  refreshHeaderText: function() {
    var schemas = [];
    $each(this.editors, function(i,editor) {
      schemas.push(editor.schema);
    });
    var display_text = this.getDisplayText(schemas);
    $each(this.editors, function(i,editor) {
      if(editor.option) {
        editor.option.textContent = display_text[i];
      }
    });
  },
  refreshValue: function() {
    this.value = this.editors[this.type].getValue();
  },
  setValue: function(val,initial) {
    // Determine type by getting the first one that validates
    var self = this;
    $each(this.validators, function(i,validator) {
      if(!validator.validate(val).length) {
        self.type = i;
        self.switcher.value = self.display_text[i];
        return false;
      }
    });
    
    $trigger(self.switcher,'change');

    this.editors[this.type].setValue(val,initial);

    this.refreshValue();
    this.jsoneditor.notifyWatchers(this.path);
  },
  destroy: function() {
    $each(this.editors, function(type,editor) {
      editor.destroy();
    });
    this.editor_holder.parentNode.removeChild(this.editor_holder);
    this.switcher.parentNode.removeChild(this.switcher);
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;
    
    // oneOf error paths need to remove the oneOf[i] part before passing to child editors
    if(this.oneOf) {
      $each(this.editors,function(i,editor) {
        var check = self.path+'.oneOf['+i+']';
        var new_errors = [];
        $each(errors, function(j,error) {
          if(error.path.substr(0,check.length)===check) {
            var new_error = $extend({},error);
            new_error.path = self.path+new_error.path.substr(check.length);
            new_errors.push(new_error);
          }
        });
        
        editor.showValidationErrors(new_errors);
      });
    }
    else {
      $each(this.editors,function(type,editor) {
        editor.showValidationErrors(errors);
      });
    }
  }
});
