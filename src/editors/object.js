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
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.editor_holder.hide(500);
    this.title_controls.hide(500);
    this.cancel_editjson_button.hide();
    this.editjson_holder.hide(300);
    this.theme.setButtonText(this.editjson_button,'Edit JSON');
    this.editing_json = false;
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

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getTheme().getButton('Collapse').appendTo(this.title_controls).on('click',function() {
        if(self.collapsed) {
          self.editor_holder.show(300);
          self.collapsed = false;
          self.getTheme().setButtonText(self.toggle_button,'Collapse');
        }
        else {
          self.editor_holder.hide(300);
          self.collapsed = true;
          self.getTheme().setButtonText(self.toggle_button,'Expand');
        }
      });
      
      // Edit JSON Button
      this.editing_json = false;
      this.editjson_button = this.theme.getButton('Edit JSON').appendTo(this.title_controls).on('click',function() {
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
          self.theme.setButtonText(self.editjson_button,'Edit JSON');
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
          self.theme.setButtonText(self.editjson_button,'Save JSON');
        }
        
        return false;
      });
      this.cancel_editjson_button = this.theme.getButton('Cancel Edit').appendTo(this.title_controls).hide().on('click',function() {
          self.cancel_editjson_button.hide();
          self.editjson_holder.hide(300);
          self.theme.setButtonText(self.editjson_button,'Edit JSON');
          self.editing_json = false;
          
          return false;
      });
    }
      
    // When a child editor changes, refresh the value
    self.editor_holder.on('change',function() {
      self.refreshValue();      
    });
    
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
    $.each(this.editors, function(i,editor) {
      if(editor.addremove) editor.addremove.show();
      if(editor.property_removed) return;
      props++;
      self.value[i] = editor.getValue();
    });
    
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
