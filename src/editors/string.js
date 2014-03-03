$.jsoneditor.editors.string = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {    
    return this.schema.default || '';
  },
  setValue: function(value,initial,from_template) {
    value = value || '';
    if(typeof value === "object") value = JSON.stringify(value);
    if(typeof value !== "string") value = ""+value;

    if(!from_template && value) this.last_set = value;

    // Sanitize value before setting it
    var sanitized = this.sanitize(value);
    if(this.select_options && this.select_options.indexOf(sanitized) < 0) {
      sanitized = this.select_options[0];
    }

    this.input.val(sanitized);
    
    // If using SCEditor, update the WYSIWYG
    if(this.sceditor_instance) {
      this.sceditor_instance.val(sanitized);
    }
    if(this.epiceditor) {
      this.epiceditor.importFile(null,sanitized);
    }

    this.refreshValue();

    if(this.getValue() !== value || from_template) this.container.trigger('change');
    this.container.trigger('set');
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
    if(!this.getOption('compact',false)) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    // Select box
    if(this.schema.enum) {
      this.input_type = 'select';
      this.select_options = this.schema.enum;
      this.input = this.theme.getSelectInput(this.select_options);
    }
    // Dynamic Select box
    else if(this.schema.enumSource) {
      this.input_type = 'select';
      this.input = this.theme.getSelectInput([]);
      if(this.schema.enumValue) {
        this.select_template = $.jsoneditor.compileTemplate(this.schema.enumValue, this.template_engine);
      }
    }
    // Specific format
    else if(this.schema.format) {
      // Text Area
      if(this.schema.format === 'textarea') {
        this.input_type = 'textarea';
        this.input = this.theme.getTextareaInput();
      }
      // WYSIWYG html/bbcode
      else if(this.schema.format === 'html' || this.schema.format === 'bbcode') {
        this.input_type = this.schema.format;
        
        this.input = this.theme.getTextareaInput();
      }
      // Markdown
      else if(this.schema.format === 'markdown') {
        this.input_type = 'markdown';
        this.input = this.theme.getTextareaInput();
      }
      // Range Input
      else if(this.schema.format === 'range') {
        this.input_type = 'range';
        var min = this.schema.minimum || 0;
        var max = this.schema.maximum || Math.max(100,min+1);
        var step = 1;
        if(this.schema.multipleOf) {
          if(min%this.schema.multipleOf) min = Math.ceil(min/this.schema.multipleOf)*this.schema.multipleOf;
          if(max%this.schema.multipleOf) max = Math.floor(max/this.schema.multipleOf)*this.schema.multipleOf;
          step = this.schema.multipleOf;
        }

        this.input = this.theme.getRangeInput(min,max,step);
      }
      // HTML5 Input type
      else {
        this.input_type = this.schema.format;
        this.input = this.theme.getFormInputField(this.input_type);
      }
    }
    // Normal text input
    else {
      this.input_type = 'text';
      this.input = this.theme.getFormInputField(this.input_type);
    }
    
    // minLength, maxLength, and pattern
    if(typeof this.schema.maxLength !== "undefined") this.input.attr('maxlength',this.schema.maxLength);
    if(typeof this.schema.pattern !== "undefined") this.input.attr('pattern',this.schema.pattern);
    else if(typeof this.schema.minLength !== "undefined") this.input.attr('pattern','.{'+this.schema.minLength+',}');

    if(this.getOption('compact')) this.container.addClass('compact');

    if(this.schema.readOnly || this.schema.readonly) this.input.prop('disabled',true);

    this.input
      .on('change keyup',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Don't allow changing if this field is a template
        if(self.schema.template) {
          $(this).val(self.value);
          return;
        }

        var val = $(this).val();
        
        // sanitize value
        var sanitized = self.sanitize(val);
        if(val !== sanitized) {
          $(this).val(sanitized).trigger('change');
          return;
        }

        self.refreshValue();
        
        if(e.type === "change") {
          self.container.trigger('change');
        }
      });

    if(this.schema.format) this.input.attr('data-schemaformat',this.schema.format);

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description).appendTo(this.container);

    // If the Select2 library is loaded
    if(this.input_type === "select" && $.fn.select2) {
      this.input.select2();
    }

    // Any special formatting that needs to happen after the input is added to the dom
    window.setTimeout(function() {
      self.afterInputReady();
    });

    // Compile and store the template
    if(this.schema.template) {
      this.template = $.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
    }
    else this.refreshValue();
  },
  afterInputReady: function() {
    var self = this;
    
    // Setup WYSIWYG editor
    if(this.input_type === 'html' || this.input_type === 'bbcode') {
      // If SCEditor is loaded
      if($.fn.sceditor) {
        self.input.sceditor({
          plugins: self.input_type==='html'? 'xhtml' : 'bbcode',
          emoticonsEnabled: false,
          width: '100%',
          height: 300
        });
        
        self.sceditor_instance = self.input.sceditor('instance');
        
        self.sceditor_instance.blur(function() {
          // Get editor's value
          var val = $("<div>"+self.sceditor_instance.val()+"</div>");
          // Remove sceditor spans/divs
          $('#sceditor-start-marker,#sceditor-end-marker,.sceditor-nlf',val).remove();
          // Set the value and update
          self.input.val(val.html());
          self.container.trigger('change');
        });
      }
      // TODO: support other WYSIWYG editors
    }
    // Markdown
    else if(this.input_type === 'markdown') {
      if(window.EpicEditor) {
        this.epiceditor_container = $("<div>").insertBefore(this.input);
        this.input.hide();
        this.epiceditor = new EpicEditor({
          container: this.epiceditor_container.get(0),
          clientSideStorage: false,
          basePath: '//cdnjs.cloudflare.com/ajax/libs/epiceditor/0.2.0'
        });
        
        this.epiceditor.on('update',function() {
          var val = self.epiceditor.exportFile();
          self.input.val(val);
          self.container.trigger('change');
        });
        
        this.epiceditor.load();
      }
    }
    
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function() {
    this.value = this.input.val();
    if(typeof this.value !== "string") this.value = '';
  },
  destroy: function() {    
    // If using SCEditor, destroy the editor instance
    if(this.sceditor_instance) {
      this.sceditor_instance.destroy();
    }
    if(this.epiceditor) {
      this.epiceditor.unload();
    }
    
    this.template = null;
    this.input.remove();
    if(this.label) this.label.remove();
    if(this.description) this.description.remove();

    this._super();
  },
  /**
   * This is overridden in derivative editors
   */
  sanitize: function(value) {
    return value;
  },
  /**
   * Re-calculates the value if needed
   */
  onWatchedFieldChange: function() {    
    var self = this;
    
    // If this editor needs to be rendered by a macro template
    if(this.template) {
      var vars = this.getWatchedFieldValues();
      this.setValue(this.template(vars),false,true);
    }
    // If this editor uses a dynamic select box
    if(this.schema.enumSource) {
      var vars = this.getWatchedFieldValues();
      var select_options = [];
      
      if(!vars[this.schema.enumSource]) throw "Unknown enumSource "+this.schema.enumSource;
      $.each(vars[this.schema.enumSource],function(i,el) {
        var value;
        if(self.select_template) {
          value = self.select_template({
            i: i,
            item: el
          });
        }
        else {
          value = el;
        }
        value = ""+value;
        
        if(select_options.indexOf(value) === -1) select_options.push(value);
      });
      
      this.theme.setSelectOptions(this.input, select_options);
      this.select_options = select_options;
      if(this.last_set && select_options.indexOf(this.last_set) !== -1) {
        this.setValue(this.last_set,false,true);
      }
      else if(select_options.indexOf(this.getValue()) === -1) {
        this.setValue(select_options[0],false,true);
      }
    }
    
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;

    var messages = [];
    $.each(errors,function(i,error) {
      if(error.path === self.path) {
        messages.push(error.message);
      }
    });

    if(messages.length) {
      this.theme.addInputError(this.input, messages.join('. ')+'.');
    }
    else {
      this.theme.removeInputError(this.input);
    }
  }
});
