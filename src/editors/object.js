$.jsoneditor.editors.object = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return $.extend(true,{},this.schema.default || {});
  },
  getChildEditors: function() {
    return this.editors;
  },
  addProperty: function() {
    this._super();
    this.editor_holder.show(500);
    this.title_controls.show(500);
    this.editjson_controls.show(500);
    if(this.addproperty_controls) this.addproperty_controls.show(500);
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.editor_holder.hide(500);
    this.title_controls.hide(500);
    this.editjson_controls.hide(500);
    if(this.addproperty_controls) this.addproperty_controls.hide(500);
    this.cancel_editjson_button.trigger('click');
    if(this.cancel_addproperty_button) this.cancel_addproperty_button.trigger('click');
    this.theme.disableHeader(this.title);
  },
  build: function() {
    this.editors = {};
    var self = this;

    this.schema.properties = this.schema.properties || {};

    // If the object should be rendered as a table row
    if(this.getOption('table_row',false)) {
      this.editor_holder = this.container;
      $.each(this.schema.properties, function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getTableCell().appendTo(self.editor_holder);

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
      this.title = this.getTheme().getHeader(this.getTitle()).appendTo(this.container);
      
      this.editjson_holder = this.theme.getTextareaInput().appendTo(this.container).hide().css({
        height: 100,
        width: '100%'
      });
      
      this.addproperty_holder = $("<div>").appendTo(this.container).hide();
      this.addproperty_input = this.theme.getFormInputField('text').appendTo(this.addproperty_holder).attr('placeholder','Property name...');
      
      if(this.schema.description) this.description = this.getTheme().getDescription(this.schema.description).appendTo(this.container);
      this.error_holder = $("<div></div>").appendTo(this.container);
      this.editor_holder = this.getTheme().getIndentedPanel().appendTo(this.container);

      $.each(this.schema.properties, function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getChildEditorHolder().appendTo(self.editor_holder);

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
      this.title_controls = this.getTheme().getHeaderButtonHolder().appendTo(this.title);
      this.editjson_controls = this.getTheme().getHeaderButtonHolder().appendTo(this.title);
      this.addproperty_controls = this.getTheme().getHeaderButtonHolder().appendTo(this.title);

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getButton('','collapse','Collapse').appendTo(this.title_controls).on('click',function() {
        if(self.collapsed) {
          self.editor_holder.show(300);
          self.collapsed = false;
          self.setButtonText(self.toggle_button,'','collapse','Collapse');
        }
        else {
          self.editor_holder.hide(300);
          self.collapsed = true;
          self.setButtonText(self.toggle_button,'','expand','Expand');
        }
      });
      
      // Edit JSON Button
      this.editing_json = false;
      this.editjson_button = this.getButton('JSON','edit','Edit JSON').appendTo(this.editjson_controls).on('click',function() {
        // Save Changes
        if(self.editing_json) {
          // Get value from form
          try {
            var value = JSON.parse(self.editjson_holder.val());
          }
          catch(e) {
            // Error parsing the JSON
            alert('Invalid JSON - '+e);
            return false;
          }
          
          // Hide the edit form
          self.cancel_editjson_button.hide();
          self.editjson_holder.hide(300);
          self.setButtonText(self.editjson_button,'JSON','edito','Edit JSON');
          self.editing_json = false;
          
          // Set the value
          self.setValue(value);
          self.editor_holder.trigger('change');
        }
        // Start Editing
        else {
          self.editing_json = true;
          self.cancel_editjson_button.show();
          self.editjson_holder.show(300);
          self.setButtonText(self.editjson_button,'JSON','save','Save JSON');
        }
        
        return false;
      });
      this.cancel_editjson_button = this.getButton('','cancel','Cancel').appendTo(this.editjson_controls).hide().on('click',function() {
          self.cancel_editjson_button.hide();
          self.editjson_holder.hide(300);
          self.setButtonText(self.editjson_button,'JSON','edit','Edit JSON');
          self.editing_json = false;
          
          return false;
      });
      
      if(this.canHaveAdditionalProperties()) {
        this.adding_property = false;
        this.addproperty_button = this.getButton('Property','add','Add Property').appendTo(this.addproperty_controls).on('click',function() {
          // Add property
          if(self.adding_property) {
            var name = self.addproperty_input.val();
            
            // If property with this name already exists
            if(self.editors[name]) {
              alert('A property already exists with this name');
              return false;
            }
            
            // Hide the edit form
            self.cancel_addproperty_button.hide();
            self.addproperty_holder.hide(300);
            self.setButtonText(self.addproperty_button,'Property','add','Add Property');
            self.adding_property = false;
            self.addObjectProperty(name);
          }
          // Start Editing
          else {
            self.adding_property = true;
            self.addproperty_input.val('');
            self.cancel_addproperty_button.show();
            self.addproperty_holder.show(300);
            self.setButtonText(self.addproperty_button,'Property','save','Save Property');
          }
          
          return false;
        });
        
        this.cancel_addproperty_button = this.getButton('','cancel','Cancel').appendTo(this.addproperty_controls).hide().on('click',function() {
            self.cancel_addproperty_button.hide();
            self.addproperty_holder.hide(300);
            self.setButtonText(self.addproperty_button,'Property','add','Add Property');
            self.adding_property = false;
            
            return false;
        });
      }
    }
      
    // When a child editor changes, refresh the value
    self.editor_holder.on('change',function() {
      self.refreshValue();      
    });
  },
  canHaveAdditionalProperties: function() {
    return this.schema.additionalProperties !== false && !this.jsoneditor.data('jsoneditor').options.no_additional_properties;
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
      $.each(self.schema.patternProperties,function(i,el) {
        var regex = new RegExp(i);
        if(regex.test(name)) {
          matched = true;
          schema = $.extend(true,schema,el);
        }
      });
    }
    // Otherwise, check if additionalProperties is a schema
    if(!matched && typeof self.schema.additionalProperties === "object") {
      schema = $.extend(true,schema,self.schema.additionalProperties);
    }
    
    // Add the property
    var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
    var holder = self.getTheme().getChildEditorHolder().appendTo(self.editor_holder);

    self.editors[name] = new editor({
      jsoneditor: self.jsoneditor,
      schema: schema,
      container: holder,
      path: self.path+'.'+name,
      parent: self,
      required: false
    });
    self.editors[name].not_core = true;
    
    holder.trigger('change');
  },
  destroy: function() {
    $.each(this.editors, function(i,el) {
      el.destroy();
    });
    this.editor_holder.empty();
    if(this.title) this.title.remove();
    if(this.error_holder) this.error_holder.remove();

    this.editors = null;
    this.editor_holder.remove();
    this.editor_holder = null;

    this._super();
  },
  refreshValue: function() {
    this.value = {};
    var self = this;
    var props = 0;
    
    var removed = false;
    var new_editors = this.editors;
    $.each(this.editors, function(i,editor) {
      if(editor.property_removed && editor.not_core) {
        new_editors = {};
        removed = true;
      }
    });
    
    $.each(this.editors, function(i,editor) {
      if(editor.addremove) editor.addremove.show();
      if(editor.property_removed) {
        if(!editor.not_core && removed) new_editors[i] = editor;
        else if(editor.not_core) {
          var container = editor.container;
          editor.destroy();
          container.remove();
        }
        return;
      }
      else if(removed) new_editors[i] = editor;
      
      props++;
      self.value[i] = editor.getValue();
    });
    this.editors = new_editors;
    
    if(!this.editing_json && this.editjson_holder) this.editjson_holder.val(JSON.stringify(this.value,null,2));
    
    // See if we need to show/hide the add/remove property links
    if(typeof this.schema.minProperties !== "undefined") {
      if(props <= this.schema.minProperties) {
        $.each(this.editors, function(i,editor) {
          if(!editor.property_removed && editor.addremove) {
            editor.addremove.hide();
          }
        });
      }
    }
    if(typeof this.schema.maxProperties !== "undefined") {
      if(props >= this.schema.maxProperties) {
        $.each(this.editors, function(i,editor) {
          if(editor.property_removed && editor.addremove) {
            editor.addremove.hide();
          }
        });
      }
    }
  },
  setValue: function(value, initial) {
    value = value || {};
    
    if(typeof value !== "object" || value instanceof Array) value = {};
    
    // First, set the values for all of the defined properties
    $.each(this.editors, function(i,editor) {      
      if(typeof value[i] !== "undefined") {
        // If property is removed, add property
        if(editor.property_removed && editor.addremove) {
          editor.addremove.trigger('click');
        }
        
        editor.setValue(value[i],initial);
      }
      else {
        // If property isn't required, remove property
        if(!initial && !editor.property_removed && !editor.isRequired() && editor.addremove) {
          editor.addremove.trigger('click');
          return;
        }
        
        editor.setValue(editor.getDefault(),initial);
      }
    });
    
    // If additional properties are allowed, create the editors for any of those
    if(this.canHaveAdditionalProperties()) {
      var self = this;
      $.each(value, function(i,val) {
        if(!self.editors[i]) {
          self.addObjectProperty(i);
          if(self.editors[i]) {
            self.editors[i].setValue(val,initial);
          }
        }
      });
    }
    
    this.refreshValue();
    this.container.trigger('set');
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $.each(errors, function(i,error) {
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
        this.error_holder.empty().show();
        $.each(my_errors, function(i,error) {
          self.error_holder.append(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.hide();
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
    $.each(this.editors, function(i,editor) {
      editor.showValidationErrors(other_errors);
    });
  }
});
