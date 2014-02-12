// Multiple Editor (for when `type` is an array)
$.jsoneditor.editors.multiple = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return null;
  },
  build: function() {
    var self = this;
    var container = this.getContainer();

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
          $.each(this.types,function(i,type) {
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

    this.switcher = this.theme.getSelectInput(this.display_text)
      .appendTo(container)
      .on('change',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        self.type = self.display_text.indexOf($(this).val());

        var current_value = self.getValue();

        $.each(self.editors,function(type,editor) {
          if(self.type === type) {
            editor.setValue(current_value,true);
            editor.container.show();
          }
          else editor.container.hide();
        });

        self.container.trigger('change');
        
        return false;
      })
      .css({
        marginBottom: 0,
        float: 'right'
      });

    this.editor_holder = this.theme.getIndentedPanel().appendTo(container);
    this.type = 0;

    this.editors = [];
    this.validators = [];
    $.each(this.types,function(i,type) {
      var holder = self.theme.getChildEditorHolder().appendTo(self.editor_holder);

      var schema;
      
      if(typeof type === "string") {
        schema = $.extend(true,{},self.schema);
        schema.type = type;
      }
      else {
        schema = $.extend(true,{},self.schema,type);

        // If we need to merge `required` arrays
        if(type.required && type.required instanceof Array && self.schema.required && self.schema.required instanceof Array) {
          schema.required = self.schema.required.concat(type.required);
        }
      }

      self.validators[i] = new $.jsoneditor.Validator(schema,{
        required_by_default: self.jsoneditor.data('jsoneditor').options.required_by_default,
        no_additional_properties: self.jsoneditor.data('jsoneditor').options.no_additional_properties
      });

      var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);

      self.editors[i] = new editor({
        jsoneditor: self.jsoneditor,
        schema: schema,
        container: holder,
        path: self.path,
        parent: self.parent,
        required: true
      });

      if(i !== self.type) holder.hide();
    });

    this.editor_holder.on('change set',function() {
      self.refreshValue();
    });

    this.switcher.val(this.display_text[this.type]);
  },
  refreshValue: function() {
    this.value = this.editors[this.type].getValue();
  },
  setValue: function(val,initial) {
    // Determine type by getting the first one that validates
    var self = this;
    $.each(this.validators, function(i,validator) {
      if(!validator.validate(val).length) {
        self.type = i;
        self.switcher.val(self.display_text[i]).trigger('change');
        return false;
      }
    });

    this.editors[this.type].setValue(val,initial);

    this.refreshValue();
    this.container.trigger('set');
  },
  destroy: function() {
    $.each(this.editors, function(type,editor) {
      editor.destroy();
    });
    this.editor_holder.remove();
    this.switcher.remove();
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;
    
    // oneOf error paths need to remove the oneOf[i] part before passing to child editors
    if(this.oneOf) {
      $.each(this.editors,function(i,editor) {
        var check = self.path+'.oneOf['+i+']';
        var new_errors = [];
        $.each(errors, function(j,error) {
          if(error.path.substr(0,check.length)===check) {
            var new_error = $.extend({},error);
            new_error.path = self.path+new_error.path.substr(check.length);
            new_errors.push(new_error);
          }
        });
        
        editor.showValidationErrors(new_errors);
      });
    }
    else {
      $.each(this.editors,function(type,editor) {
        editor.showValidationErrors(errors);
      });
    }
  }
});
