JSONEditor.defaults.editors.object = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return $extend({},this.schema.default || {});
  },
  getChildEditors: function() {
    return this.editors;
  },
  addProperty: function() {
    this._super();
    this.editor_holder.style.display = 'block';
    this.title_controls.style.display = 'block';
    this.editjson_controls.style.display = 'block';
    if(this.addproperty_controls) this.addproperty_controls.style.display = 'block';
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.editor_holder.style.display = 'none';
    this.title_controls.style.display = 'none';
    this.editjson_controls.style.display = 'none';
    if(this.addproperty_controls) this.addproperty_controls.style.display = 'none';
    $trigger(this.cancel_editjson_button,'click');
    if(this.cancel_addproperty_button) $trigger(this.cancel_addproperty_button,'click');
    this.theme.disableHeader(this.title);
  },
  build: function() {
    this.editors = {};
    var self = this;

    this.schema.properties = this.schema.properties || {};

    // If the object should be rendered as a table row
    if(this.getOption('table_row',false)) {
      this.editor_holder = this.container;
      $each(this.schema.properties, function(key,schema) {
        var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.editor_holder.appendChild(self.getTheme().getTableCell());

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self,
          compact: true
        });
      });
    }
    // If the object should be rendered as a table
    else if(this.getOption('table',false)) {
      // TODO: table display format
      throw "Not supported yet";
    }
    // If the object should be rendered as a div
    else {
      this.title = this.getTheme().getHeader(this.getTitle());
      this.container.appendChild(this.title);
      
      this.editjson_holder = this.theme.getTextareaInput();
      this.container.appendChild(this.editjson_holder);
      this.editjson_holder.style.display = 'none';
      this.editjson_holder.style.height = '100px';
      this.editjson_holder.style.width = '100%';
      
      this.addproperty_holder = document.createElement('div');
      this.container.appendChild(this.addproperty_holder);
      this.addproperty_holder.style.display = 'none';
      this.addproperty_input = this.theme.getFormInputField('text');
      this.addproperty_holder.appendChild(this.addproperty_input);
      this.addproperty_input.setAttribute('placeholder','Property name...');
      
      if(this.schema.description) {
        this.description = this.getTheme().getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      this.error_holder = document.createElement('div');
      this.container.appendChild(this.error_holder);
      this.editor_holder = this.getTheme().getIndentedPanel();
      this.container.appendChild(this.editor_holder);

      $each(this.schema.properties, function(key,schema) {
        var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getChildEditorHolder();
        self.editor_holder.appendChild(holder);

        // If the property is required
        var required;
        if(self.schema.required && self.schema.required instanceof Array) {
          required = self.schema.required.indexOf(key) >= 0;
        }

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self,
          required: required
        });
      });

      // Control buttons
      this.title_controls = this.getTheme().getHeaderButtonHolder();
      this.editjson_controls = this.getTheme().getHeaderButtonHolder();
      this.addproperty_controls = this.getTheme().getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      this.title.appendChild(this.editjson_controls);
      this.title.appendChild(this.addproperty_controls);

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getButton('','collapse','Collapse');
      this.title_controls.appendChild(this.toggle_button)
      this.toggle_button.addEventListener('click',function() {
        if(self.collapsed) {
          self.editor_holder.style.display = '';
          self.collapsed = false;
          self.setButtonText(self.toggle_button,'','collapse','Collapse');
        }
        else {
          self.editor_holder.style.display = 'none';
          self.collapsed = true;
          self.setButtonText(self.toggle_button,'','expand','Expand');
        }
      });

      // If it should start collapsed
      if(this.options.collapsed) {
        $trigger(this.toggle_button,'click');
      }
      
      // Edit JSON Button
      this.editing_json = false;
      this.editjson_button = this.getButton('JSON','edit','Edit JSON');
      this.editjson_controls.appendChild(this.editjson_button)
      this.editjson_button.addEventListener('click',function() {
        // Save Changes
        if(self.editing_json) {
          // Get value from form
          try {
            var value = JSON.parse(self.editjson_holder.value);
          }
          catch(e) {
            // Error parsing the JSON
            alert('Invalid JSON - '+e);
            return false;
          }
          
          // Hide the edit form
          self.cancel_editjson_button.style.display = 'none';
          self.editjson_holder.style.display = 'none';
          self.setButtonText(self.editjson_button,'JSON','edito','Edit JSON');
          self.editing_json = false;
          
          // Set the value
          self.setValue(value);
          
          if(self.parent) self.parent.onChildEditorChange(self);
          else self.jsoneditor.onChange();
        }
        // Start Editing
        else {
          self.editing_json = true;
          self.cancel_editjson_button.style.display = '';
          self.editjson_holder.value = JSON.stringify(self.value,null,2);
          self.editjson_holder.style.display = '';
          self.setButtonText(self.editjson_button,'JSON','save','Save JSON');
        }
        
        return false;
      });
      this.cancel_editjson_button = this.getButton('','cancel','Cancel');
      this.editjson_controls.appendChild(this.cancel_editjson_button);
      this.cancel_editjson_button.style.display = 'none';
      this.cancel_editjson_button.addEventListener('click',function() {
          self.cancel_editjson_button.style.display = 'none'
          self.editjson_holder.style.display = 'none';
          self.setButtonText(self.editjson_button,'JSON','edit','Edit JSON');
          self.editing_json = false;
          
          return false;
      });
      
      if(this.canHaveAdditionalProperties()) {
        this.adding_property = false;
        this.addproperty_button = this.getButton('Property','add','Add Property');
        this.addproperty_controls.appendChild(this.addproperty_button)
        this.addproperty_button.addEventListener('click',function() {
          // Add property
          if(self.adding_property) {
            var name = self.addproperty_input.value;
            
            // If property with this name already exists
            if(self.editors[name]) {
              alert('A property already exists with this name');
              return false;
            }
            
            // Hide the edit form
            self.cancel_addproperty_button.style.display = 'none';
            self.addproperty_holder.style.display = 'none';
            self.setButtonText(self.addproperty_button,'Property','add','Add Property');
            self.adding_property = false;
            self.addObjectProperty(name);
          }
          // Start Editing
          else {
            self.adding_property = true;
            self.addproperty_input.value = '';
            self.cancel_addproperty_button.style.display = '';
            self.addproperty_holder.style.display = '';
            self.setButtonText(self.addproperty_button,'Property','save','Save Property');
          }
          
          return false;
        });
        
        this.cancel_addproperty_button = this.getButton('','cancel','Cancel');
        this.addproperty_controls.appendChild(this.cancel_addproperty_button);
        this.cancel_addproperty_button.style.display = 'none';
        this.cancel_addproperty_button.addEventListener('click',function() {
            self.cancel_addproperty_button.style.display = 'none'
            self.addproperty_holder.style.display = 'none'
            self.setButtonText(self.addproperty_button,'Property','add','Add Property');
            self.adding_property = false;
            
            return false;
        });
      }
    }
    
    this.jsoneditor.notifyWatchers(this.path);
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this._super(editor);
  },
  canHaveAdditionalProperties: function() {
    return this.schema.additionalProperties !== false && !this.jsoneditor.options.no_additional_properties;
  },
  addObjectProperty: function(name) {
    var self = this;
    
    // If property with this name already exists
    if(self.editors[name]) {
      return false;
    }
    
    // Determine the schema to use for this new property
    var schema = {}, matched = false;
    // Check if it matches any of the pattern properties
    if(self.schema.patternProperties) {
      $each(self.schema.patternProperties,function(i,el) {
        var regex = new RegExp(i);
        if(regex.test(name)) {
          matched = true;
          schema = $extend(schema,el);
        }
      });
    }
    // Otherwise, check if additionalProperties is a schema
    if(!matched && typeof self.schema.additionalProperties === "object") {
      schema = $extend(schema,self.schema.additionalProperties);
    }
    
    // Add the property
    var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);
    var holder = self.getTheme().getChildEditorHolder();
    self.editor_holder.appendChild(holder);

    self.editors[name] = new editor({
      jsoneditor: self.jsoneditor,
      schema: schema,
      container: holder,
      path: self.path+'.'+name,
      parent: self,
      required: false
    });
    self.editors[name].not_core = true;
    
    self.refreshValue();
    
    self.jsoneditor.notifyWatchers(self.path);
    if(self.parent) self.parent.onChildEditorChange(self);
    else self.jsoneditor.onChange();
  },
  destroy: function() {
    $each(this.editors, function(i,el) {
      el.destroy();
    });
    this.editor_holder.innerHTML = '';
    if(this.title) this.title.parentNode.removeChild(this.title);
    if(this.error_holder) this.error_holder.parentNode.removeChild(this.error_holder);

    this.editors = null;
    this.editor_holder.parentNode.removeChild(this.editor_holder);
    this.editor_holder = null;

    this._super();
  },
  refreshValue: function() {
    this.value = {};
    this.serialized = '';
    var self = this;
    var props = 0;
    
    var removed = false;
    var new_editors = this.editors;
    $each(this.editors, function(i,editor) {
      if(editor.property_removed && editor.not_core) {
        new_editors = {};
        removed = true;
      }
    });
    
    $each(this.editors, function(i,editor) {
      if(editor.addremove) editor.addremove.style.display = '';
      if(editor.property_removed) {
        if(!editor.not_core && removed) new_editors[i] = editor;
        else if(editor.not_core) {
          var container = editor.container;
          editor.destroy();
          if(container.parentNode) container.parentNode.removeChild(container);
        }
        return;
      }
      else if(removed) new_editors[i] = editor;
      
      props++;
      self.value[i] = editor.getValue();
    });
    this.editors = new_editors;
    
    // See if we need to show/hide the add/remove property links
    if(typeof this.schema.minProperties !== "undefined") {
      if(props <= this.schema.minProperties) {
        $each(this.editors, function(i,editor) {
          if(!editor.property_removed && editor.addremove) {
            editor.addremove.style.display = 'none';
          }
        });
      }
    }
    if(typeof this.schema.maxProperties !== "undefined") {
      if(props >= this.schema.maxProperties) {
        $each(this.editors, function(i,editor) {
          if(editor.property_removed && editor.addremove) {
            editor.addremove.style.display = 'none';
          }
        });
      }
    }
  },
  setValue: function(value, initial) {
    value = value || {};
    
    if(typeof value !== "object" || value instanceof Array) value = {};
    
    // First, set the values for all of the defined properties
    $each(this.editors, function(i,editor) {      
      if(typeof value[i] !== "undefined") {
        // If property is removed, add property
        if(editor.property_removed && editor.addremove) {
          $trigger(editor.addremove,'click');
        }
        
        editor.setValue(value[i],initial);
      }
      else {
        // If property isn't required, remove property
        if(!initial && !editor.property_removed && !editor.isRequired() && editor.addremove) {
          $trigger(editor.addremove,'click');
          return;
        }
        
        editor.setValue(editor.getDefault(),initial);
      }
    });
    
    // If additional properties are allowed, create the editors for any of those
    if(this.canHaveAdditionalProperties()) {
      var self = this;
      $each(value, function(i,val) {
        if(!self.editors[i]) {
          self.addObjectProperty(i);
          if(self.editors[i]) {
            self.editors[i].setValue(val,initial);
          }
        }
      });
    }
    
    this.refreshValue();
    this.jsoneditor.notifyWatchers(this.path);
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

    // Show error for the table row if this is inside a table
    if(this.getOption('table_row')) {
      if(my_errors.length) {
        this.theme.addTableRowError(this.container);
      }
      else {
        this.theme.removeTableRowError(this.container);
      }
    }

    // Show errors for child editors
    $each(this.editors, function(i,editor) {
      editor.showValidationErrors(other_errors);
    });
  }
});
