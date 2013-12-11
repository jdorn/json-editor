  /**
   * Editor for schemas of type 'string'
   *
   * Renders a text input
   * { type: "string" }
   *
   * Renders a select box if the 'enum' property is set
   * { type: "string", enum: ["option 1","option 2"] }
   */
  $.jsoneditor.editors.string = $.jsoneditor.AbstractEditor.extend({
    default: '',
    initialize: function() {
      this.value = '';

      var self = this;
      this.label = this.theme.getFormInputLabel(this.schema.title || this.schema.id || this.key).appendTo(this.div);

      // Select box
      if(this.schema.enum) {
        this.input_type = 'select';
        this.input = this.theme.getSelectInput().css('width','auto');
        $.each(this.schema.enum,function(i,val) {
          self.input.append(self.theme.getSelectOption(val))
        });
      }
      // Text Area
      else if(this.options.textarea) {
        this.input_type = 'textarea';
        this.input = this.theme.getTextareaInput();
      }
      // Text input
      else {
        this.input_type = this.schema.format? this.schema.format : 'text';
        this.input = this.theme.getFormInputField(this.input_type);

        // Set the min/max for format="range"
        if(this.input_type === 'range') {
          var min = this.schema.minimum || 0;
          var max = this.schema.maximum || 100;

          // If multipleOf is set, make sure minimum and maximum are multiples of multipleOf
          if(this.schema.multipleOf) {
            if(min%this.schema.multipleOf) min = Math.ceil(min/this.schema.multipleOf)*this.schema.multipleOf;
            if(max%this.schema.multipleOf) max = Math.floor(max/this.schema.multipleOf)*this.schema.multipleOf;
            this.input.attr('step',this.schema.multipleOf);
          }

          this.input.attr('min',min);
          this.input.attr('max',max);
          this.input.css({
            marginBottom: '10px'
          });
        }
      }

      this.input
        // data-schemapath is used by other editors to listen to changes
        .attr('data-schemapath',this.path)
        // data-schematype can be used to style different editors based on the string editor
        .attr('data-schematype',this.schema.type)
        // update the editor's value when it is changed
        .on('change keyup',function(e) {
          // Don't allow changing if this field is a template
          if(self.schema.template) {
            $(this).val(self.value);
            return;
          }

          var val = $(this).val();
          // sanitize value
          var sanitized = self.sanitize(val);
          if(val !== sanitized) {
            e.preventDefault();
            e.stopPropagation();
            $(this).val(sanitized);
          }
          self.updateValue();
        })
        .appendTo(this.div);

      // For input type='range', we need to display the value after the input
      if(this.input_type === 'range') {
        this.output = this.theme.getFormOutput().insertAfter(this.input);
      }

      // If this schema is based on a macro template, set that up
      if(this.schema.template) this.setupTemplate();
      else this.updateValue();
    },
    updateValue: function() {
      this.value = this.input.val();

      if(this.output) this.output.val(this.value);
    },
    destroy: function() {
      if(this.vars) {
        var self = this;
        // Remove event listeners for the macro template
        $.each(this.vars,function(name,attr) {
          attr.root.off('change','[data-schemapath="'+attr.adjusted_path+'"]',self.var_listener)
        });
        self.var_listener = null;
      }
      this.template = null;
      this.vars = null;

      this._super();
    },
    setValue: function(value,from_template) {
      // Don't allow directly setting the value
      if(this.template && !from_template) return;

      value = value || '';

      // Sanitize value before setting it
      var sanitized = this.sanitize(value);
      if(this.schema.enum && this.schema.enum.indexOf(sanitized) < 0) {
        sanitized = this.schema.enum[0];
      }

      // If the value has changed
      this.input.val(sanitized);

      this.updateValue();

      if(from_template) this.input.trigger('change');
    },
    setupTemplate: function() {
      // Don't allow editing the input directly if it's based on a macro template
      this.input.addClass('disabled');

      // Compile and store the template
      this.template = $.jsoneditor.template.compile(this.schema.template);

      // Prepare the template vars
      this.vars = {};
      if(this.schema.vars) {
        var self = this;
        this.var_listener = function() {
          window.setTimeout(function() {
            self.refresh();
          });
        };
        $.each(this.schema.vars,function(name,path) {
          var path_parts = path.split('.');
          var first = path_parts.shift();

          // Find the root node for this template variable
          var root = self.div.closest('[data-schemaid="'+first+'"]');
          if(!root.length) throw "Unknown template variable path "+path;

          // Keep track of the root node and path for use when rendering the template
          var adjusted_path = root.data('editor').path + '.' + path_parts.join('.');
          self.vars[name] = {
            root: root,
            path: path_parts,
            adjusted_path: adjusted_path
          };

          // Listen for changes to the variable field
          root.on('change','[data-schemapath="'+adjusted_path+'"]',self.var_listener);
        });

        self.var_listener();
      }
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
    refresh: function() {
      // If this editor needs to be rendered by a macro template
      if(this.template) {
        // Build up template variables
        var vars = {};
        $.each(this.vars,function(name,attr) {
          var obj = attr.root.data('editor').getValue();
          var current_part = -1;
          var val = null;
          // Use "path.to.property" to get root['path']['to']['property']
          while(1) {
            current_part++;
            if(current_part >= attr.path.length) {
              val = obj;
              break;
            }

            if(!obj || typeof obj[attr.path[current_part]] === "undefined") {
              break;
            }

            obj = obj[attr.path[current_part]];
          }
          vars[name] = val;
        });
        this.setValue(this.template(vars),true);
      }
    }
  });
