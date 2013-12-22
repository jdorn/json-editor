/*! JSON Editor v0.2.6 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2013-12-21
 */

/**
 * See README.md for requirements and usage info
 */

(function($) {  

/* Simple JavaScript Inheritance
* By John Resig http://ejohn.org/
* MIT Licensed.
*/
// Inspired by base2 and Prototype
var Class;!function(){var a=!1,b=/xyz/.test(function(){})?/\b_super\b/:/.*/;Class=function(){},Class.extend=function(c){function g(){!a&&this.init&&this.init.apply(this,arguments)}var d=this.prototype;a=!0;var e=new this;a=!1;for(var f in c)e[f]="function"==typeof c[f]&&"function"==typeof d[f]&&b.test(c[f])?function(a,b){return function(){var c=this._super;this._super=d[a];var e=b.apply(this,arguments);return this._super=c,e}}(f,c[f]):c[f];return g.prototype=e,g.prototype.constructor=g,g.extend=arguments.callee,g}}();

/**
 * Turn an element into a schema editor
 * @param options Options (must contain at least a `schema` property)
 *
 * Constructor:
 * $("#container").jsoneditor({
 *   schema: {...}
 * });
 *
 * Set Value:
 * $("#container").jsoneditor('value',{...})
 *
 * Get Value:
 * var value = $("#container").jsoneditor('value');
 *
 * Destroy:
 * $("#container").jsoneditor('destroy');
 */
$.fn.jsoneditor = function(options) {
  var $this = $(this), d;

  // Get/Set value
  if(options === 'value') {
    d = $this.data('jsoneditor');
    if(!d) throw "JSON Editor must be instantiated before getting or setting the value";

    // Setting value
    if(arguments.length > 1) {
      d.root.setValue(arguments[1]);
      return this;
    }
    // Getting value
    else {
      return d.root.getValue();
    }
  }
  // Destroy editor
  else if(options === 'destroy') {
    d = $this.data('jsoneditor');
    if(!d) return this;
    d.schema = null;
    d.options = null;
    d.root.destroy();
    d = null;
    $this.data('jsoneditor',null);

    return this;
  }
  // Validate
  else if(options === 'validate') {
    d = $this.data('jsoneditor');
    if(!d) throw "JSON Editor must be instantiated before trying to validate";
    
    d.root.isValid(arguments[1]);
    
    return this;
  }

  options = options || {};

  var schema = options.schema;
  var data = options.startval;

  var editor_class = $.jsoneditor.getEditorClass(schema);

  var theme_class = $.jsoneditor.themes[options.theme || $.jsoneditor.theme];

  if(!theme_class) throw "Unknown theme " + (options.theme || $.jsoneditor.theme);

  // Store info about the jsoneditor in the element
  var d = {
    schema: schema,
    options: options,
    definitions: {},
    theme: new theme_class(),
    template: options.template
  };
  $this.data('jsoneditor',d);

  d.root = new editor_class({
    jsoneditor: $this,
    schema: schema,
    container: $this
  });

  // Starting data
  if(data) d.root.setValue(data);

  return this;
};

$.jsoneditor = {
  template: null,
  theme:null,
  editors: {},
  templates: {},
  themes: {},
  resolvers: [],

  // Helper functions
  expandSchema: function(schema, editor) {
    if(schema['$ref']) {
      if(!schema['$ref'].match(/^#\/definitions\//)) {
        throw "JSON Editor only supports local references to schema definitions defined for the root node";
      }
      var key = schema['$ref'].substr(14);
      var definitions = editor.data('jsoneditor').definitions;
      if(!definitions[key]) throw "Schema definition not found - "+schema['$ref'];

      return $.extend(true,{},definitions[key]);
    }
    return schema;
  },
  getEditorClass: function(schema, editor) {
    schema = $.jsoneditor.expandSchema(schema, editor);

    var classname;

    if(schema.editor) classname = schema.editor;
    else {
      $.each($.jsoneditor.resolvers,function(i,resolver) {
        var tmp;
        if(tmp = resolver(schema)) {
          if($.jsoneditor.editors[tmp]) {
            classname = tmp;
            return false;
          }
        }
      });
    }

    if(!classname) throw "Unknown editor for schema "+JSON.stringify(schema);
    if(!$.jsoneditor.editors[classname]) throw "Unknown editor "+classname;

    return $.jsoneditor.editors[classname];
  },
  compileTemplate: function(template, name) {
    name = name || $.jsoneditor.template;

    var engine;

    // Specifying a preset engine
    if(typeof name === 'string') {
      if(!$.jsoneditor.templates[name]) throw "Unknown template engine "+name;
      engine = $.jsoneditor.templates[name]();

      if(!engine) throw "Template engine "+name+" missing required library.";
    }
    // Specifying a custom engine
    else {
      engine = name;
    }

    if(!engine) throw "No template engine set";
    if(!engine.compile) throw "Invalid template engine set";

    return engine.compile(template);
  }
};


/**
 * All editors should extend from this class
 */
$.jsoneditor.AbstractEditor = Class.extend({
  init: function(options) {
    this.container = options.container;
    this.jsoneditor = options.jsoneditor;
    this.schema = options.schema;
    this.schema = $.jsoneditor.expandSchema(this.schema,this.jsoneditor);

    this.theme = this.jsoneditor.data('jsoneditor').theme;
    this.template_engine = this.jsoneditor.data('jsoneditor').template;

    // Store schema definitions
    if(this.schema.definitions) {
      var definitions = this.jsoneditor.data('jsoneditor').definitions;
      $.each(this.schema.definitions,function(key,schema) {
        definitions[key] = schema;
      });
    }

    this.options = $.extend(true, {}, (this.options || {}), (this.schema.options || {}), options);

    if(!options.path && !this.schema.id) this.schema.id = 'root';
    this.path = options.path || this.schema.id;
    if(this.schema.id) this.container.attr('data-schemaid',this.schema.id);
    this.container.data('editor',this);

    this.key = this.path.split('.').pop();
    this.parent = options.parent;

    this.build();

    this.setValue(this.getDefault());
  },

  build: function() {

  },
  isValid: function(callback) {
    callback();
  },
  setValue: function(value) {
    this.value = value;
  },
  getValue: function() {
    return this.value;
  },
  refreshValue: function() {

  },
  getChildEditors: function() {
    return false;
  },
  destroy: function() {
    this.value = null;
    this.container = null;
    this.jsoneditor = null;
    this.schema = null;
    this.path = null;
    this.key = null;
    this.parent = null;
  },
  getDefault: function() {
    return this.schema.default || null;
  },

  getTheme: function() {
    return this.theme;
  },
  getSchema: function() {
    return this.schema;
  },
  getContainer: function() {
    return this.container;
  },
  getTitle: function() {
    return this.schema.title || this.schema.id || this.key;
  },
  getPath: function() {
    return this.path;
  },
  getParent: function() {
    return this.parent;
  },
  getOption: function(key, def) {
    if(typeof this.options[key] !== 'undefined') return this.options[key];
    else return def;
  }
});

$.jsoneditor.editors.string = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || '';
  },
  setValue: function(value,from_template) {
    value = value || '';

    // Sanitize value before setting it
    var sanitized = this.sanitize(value);
    if(this.schema.enum && this.schema.enum.indexOf(sanitized) < 0) {
      sanitized = this.schema.enum[0];
    }

    this.input.val(sanitized);

    this.refreshValue();

    if(from_template) this.input.trigger('change');
  },
  isValid: function(callback) {
    var errors = [];
    var valid;
    
    // Check minLength and maxLength
    var hasmin, hasmax;
    valid = true;
    if(typeof this.schema.minLength !== "undefined") {
      hasmin = true;
      if(this.value.length < this.schema.minLength) valid = false;
    }
    if(typeof this.schema.maxLength !== "undefined") {
      hasmax = true;
      if(this.value.length > this.schema.maxLength) valid = false;
    }
    if(!valid) {
      var error;
      // Needs to be between min and max length
      if(hasmin && hasmax) {
        error = "Length must be between "+this.schema.minLength+" and "+this.schema.maxLength+".";
      }
      // Needs to be longer than min
      else if(hasmin) {
        error = "Length must be at least "+this.schema.minLength+".";
      }
      // Needs to be shorter than max
      else {
        error = "Length must be at most "+this.schema.maxLength+".";
      }
      errors.push({
        path: this.path,
        message: error
      });
    }
    
    // Check enum
    if(this.schema.enum) {
      if($.inArray(this.value, this.schema.enum) < 0) {
        errors.push({
          path: this.path,
          message: "Must be one of "+this.schema.enum.join(', ')
        });
      }
    }
    
    // Check pattern
    if(this.schema.pattern) {
      var regex = new RegExp(this.schema.pattern);
      if(!regex.test(this.value)) errors.push({
        path: this.path,
        message: "Must match pattern: "+this.schema.pattern
      });
    }
    
    if(errors.length) callback(errors);
    else callback();
  },
  build: function() {
    var self = this;
    if(!this.getOption('compact',false)) this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    // Select box
    if(this.schema.enum) {
      this.input_type = 'select';
      this.input = this.theme.getSelectInput(this.schema.enum);
    }
    // Text Area
    else if(this.schema.format && this.schema.format == 'textarea') {
      this.input_type = 'textarea';
      this.input = this.theme.getTextareaInput();
    }
    else if(this.schema.format && this.schema.format == 'range') {
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
    // Other input type
    else {
      this.input_type = this.schema.format? this.schema.format : 'text';
      this.input = this.theme.getFormInputField(this.input_type);
    }

    if(this.getOption('compact')) this.container.addClass('compact');
    
    this.input
      .attr('data-schemapath',this.path)
      .attr('data-schematype',this.schema.type)
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
          $(this).val(sanitized).trigger('change');
          return;
        }

        self.refreshValue();
      });

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description).appendTo(this.container);

    // Any special formatting that needs to happen after the input is added to the dom
    window.setTimeout(function() {
      self.theme.afterInputReady(self.input);
    });

    // If this schema is based on a macro template, set that up
    if(this.schema.template) this.setupTemplate();
    else this.refreshValue();
  },
  refreshValue: function() {
    this.value = this.input.val();
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
    this.input.remove();
    if(this.label) this.label.remove();
    if(this.description) this.description.remove();

    this._super();
  },
  setupTemplate: function() {
    // Compile and store the template
    this.template = $.jsoneditor.compileTemplate(this.schema.template, this.template_engine);

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
        var root = self.container.closest('[data-schemaid="'+first+'"]');
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

$.jsoneditor.editors.number = $.jsoneditor.editors.string.extend({
  getDefault: function() {
    return this.schema.default || 0;
  },
  sanitize: function(value) {
    return (value+"").replace(/[^0-9\.\-]/g,'');
  },
  getValue: function() {
    return this.value*1;
  },
  isValid: function(callback) {
    var val = this.getValue();
    
    if(typeof val === 'number') {
      var valid = true, hasmin, hasmax, hasmultipleof;
      
      
      if(typeof this.schema.minimum !== "undefined") {
        hasmin = true;
        if(this.schema.exclusiveMinimum && val <= this.schema.minimum) valid = false;
        else if(val < this.schema.minimum) valid = false;
      }
      
      if(typeof this.schema.maximum !== "undefined") {
        hasmax = true;
        if(this.schema.exclusiveMaximum && val >= this.schema.maximum) valid = false;
        else if(val > this.schema.maximum) valid = false;
      }
      
      if(typeof this.schema.multipleOf !== "undefined") {
        hasmultipleof = true;
        if(val % this.schema.multipleOf) valid = false;
      }
      
      if(valid) callback();
      else {
        var error;
        
        // If value must be between a min and max
        if(hasmin && hasmax) {
          error = "Must be between "+this.schema.minimum+" (";
          error += (this.schema.exclusiveMinimum)? 'exclusive' : 'inclusive';
          error += ") and "+this.schema.maximum+" (";
          error += (this.schema.exclusiveMaximum)? 'exclusive' : 'inclusive';
          error += ")";
        }
        // If value must be greater than a min
        else if(hasmin) {
          error = "Must be greater than ";
          if(!this.schema.exclusiveMinimum) error += "or equal to ";
          error += this.schema.minimum;
        }
        // If value must be less than a max
        else if(hasmax) {
          error = "Must be less than ";
          if(!this.schema.exclusiveMaximum) error += "or equal to ";
          error += this.schema.maximum;
        }
        
        // If value must be a multiple of something
        if(hasmultipleof && error) error += " and divisble by "+this.schema.multipleOf;
        else if(hasmultipleof) error = "Must be divisble by "+this.schema.multipleOf;
        
        error += ".";
        
        callback([{
          path: this.path,
          message: error
        }]);
      }
    }
    else callback([
      {
        path: this.path,
        message: "not a number"
      }
    ]);
  }
});

$.jsoneditor.editors.integer = $.jsoneditor.editors.number.extend({
  sanitize: function(value) {
    value = value + "";
    return value.replace(/[^0-9\-]/g,'');
  },
  isValid: function(callback) {
    var val = this.getValue();
    
    this._super(function(err) {
      // Make sure it's a valid number first
      if(err) callback(err);
      // Then, make sure it's an integer
      else if(val%1 === 0) callback();
      else callback([
        {
          path: this.path,
          message: "not an integer"
        }
      ]);
    });
  }
});

// Boolean Editor (simple checkbox)
$.jsoneditor.editors.boolean = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return false;
  },
  build: function() {
    var container = this.getContainer();
    if(!this.getOption('compact',false)) this.label = this.theme.getCheckboxLabel(this.getTitle());
    this.input = this.theme.getCheckbox();

    if(this.schema.description) this.description = this.theme.getCheckboxDescription(this.schema.description);

    this.input_holder = this.theme.getFormControl(this.label, this.input, this.description).appendTo(container);

    var self = this;

    if(this.getOption('compact')) this.container.addClass('compact');

    this.input
      // data-schemapath is used by other editors to listen to changes
      .attr('data-schemapath',this.getPath())
      // data-schematype can be used to style different editors based on the string editor
      .attr('data-schematype',this.schema.type)
      //update the editor's value when it is changed
      .on('change',function(e) {
        self.refreshValue();
      });
  },
  refreshValue: function() {
    this.value = this.input.prop('checked');
  },
  setValue: function(val) {
    if(val) this.input.prop('checked',true);
    else this.input.prop('checked',false);

    this.refreshValue();
  },
  destroy: function() {
    this.input.remove();
    if(this.label) this.label.remove();
    if(this.description) this.description.remove();
    this.input_holder.remove();
    this.input = this.label = this.description = this.input_holder = null;

    this._super();
  },
  isValid: function(callback) {
    // A boolean field is always valid
    callback();
  }
});

$.jsoneditor.editors.object = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return $.extend(true,{},this.schema.default || {});
  },
  getChildEditors: function() {
    return this.editors;
  },
  build: function() {
    this.editors = {};
    var self = this;

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
    }
    // If the object should be rendered as a div
    else {
      this.title = this.getTheme().getHeader(this.getTitle()).appendTo(this.container);
      if(this.schema.description) this.description = this.getTheme().getDescription(this.schema.description).appendTo(this.container);
      this.editor_holder = this.getTheme().getIndentedPanel().appendTo(this.container);

      $.each(this.schema.properties, function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getChildEditorHolder().appendTo(self.editor_holder);

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self
        });
      });

      // Control buttons
      this.title_controls = this.getTheme().getHeaderButtonHolder().appendTo(this.title);

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getTheme().getButton('hide').appendTo(this.title_controls).on('click',function() {
        if(self.collapsed) {
          self.editor_holder.show(300);
          self.collapsed = false;
          self.getTheme().setButtonText(self.toggle_button,'hide');
        }
        else {
          self.editor_holder.hide(300);
          self.collapsed = true;
          self.getTheme().setButtonText(self.toggle_button,'show');
        }
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

    this.editors = null;
    this.editor_holder.remove();
    this.editor_holder = null;

    this._super();
  },
  refreshValue: function() {
    this.value = {};
    var self = this;
    $.each(this.editors, function(i,editor) {
      self.value[i] = editor.getValue();
    });
  },
  setValue: function(value) {
    value = value || {};
    var self = this;
    $.each(this.editors, function(i,editor) {
      if(typeof value[i] !== "undefined") {
        editor.setValue(value[i]);
      }
      else {
        editor.setValue(editor.getDefault());
      }
    });
    this.refreshValue();
  },
  isValid: function(callback) {
    var errors = [];

    var needed = 0;
    $.each(this.editors, function(i,editor) {
      needed++;
    });
    
    if(!needed) return callback();

    var finished = 0;
    $.each(this.editors, function(i,editor) {
      editor.isValid(function(err) {
        if(err) {
          errors = errors.concat(err);
        }
        finished++;

        if(finished >= needed) {
          if(errors.length) callback(errors);
          else callback();
        }
      });
    });
  }
});

$.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  build: function() {
    this.rows = [];
    var self = this;
    
    if(!this.getOption('compact',false)) {
      this.title = this.theme.getHeader(this.getTitle()).appendTo(this.container);
      this.title_controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
      if(this.schema.description) this.description = this.theme.getDescription(this.schema.description).appendTo(this.container);
    }
    this.row_holder = this.theme.getIndentedPanel().appendTo(this.container);
    
    this.controls = this.theme.getButtonHolder().appendTo(this.container);
    
    this.row_holder.on('change',function() {
      self.refreshValue();
    });
    
    // Determine the default value and title of an array element
    this.item_title = this.schema.items.title || this.schema.items.id || this.getTitle();
    var tmp = this.getElementEditor(0);
    if(tmp.getChildEditors()) {
      this.item_has_child_editors = true;
    }
    this.item_default = tmp.getDefault();    
    tmp.destroy();
    
    this.row_holder.empty();
    
    // Add controls
    this.addControls();
  },
  getItemDefault: function() {
    return $.extend(true,{},{default:this.item_default}).default;
  },
  getItemTitle: function() {
    return this.item_title;
  },
  getElementEditor: function(i) {
    var schema_copy = $.extend({},this.schema.items);
    schema_copy.title = this.getItemTitle()+' '+i;

    var editor = $.jsoneditor.getEditorClass(schema_copy, this.jsoneditor);

    var holder;
    if(this.item_has_child_editors) {
      holder = this.theme.getChildEditorHolder();
    }
    else {
      holder = this.theme.getIndentedPanel();
    }

    holder.appendTo(this.row_holder);

    var ret = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema_copy,
      container: holder,
      path: this.path+'.'+i,
      parent: this
    });
    
    ret.array_controls = this.theme.getButtonHolder().appendTo(holder);
    
    return ret;
  },
  destroy: function() {
    this.empty();
    if(this.title) this.title.remove();
    if(this.description) this.description.remove();
    if(this.row_holder) this.row_holder.remove();
    
    this.rows = this.title = this.description = this.row_holder = null;

    this._super();
  },
  empty: function() {
    if(!this.rows) return;
    var self = this;
    $.each(this.rows,function(i,row) {
      row.destroy();
      self.rows[i] = null;
    });
    self.rows = [];
  },
  setValue: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];

    // Make sure value has between minItems and maxItems items in it
    if(this.schema.minItems) {
      while(value.length < this.schema.minItems) {
        value.push(this.getItemDefault());
      }
    }
    if(this.schema.maxItems && value.length > this.schema.maxItems) {
      value = value.slice(0,this.schema.maxItems);
    }

    var self = this;
    $.each(value,function(i,val) {
      if(self.rows[i]) {
        // TODO: don't set the row's value if it hasn't changed
        self.rows[i].setValue(val);
      }
      else {
        self.addRow(val);
      }
    });

    for(var j=value.length; j<self.rows.length; j++) {
      var holder = self.rows[j].container;
      self.rows[j].destroy();
      holder.remove();
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    self.refreshValue();
    
    // TODO: sortable
  },
  isValid: function(callback) {
    var errors = [];

    var needed = this.rows.length;

    var valid;

    // Check for maxItems and minItems
    valid = true;
    var hasmin, hasmax;
    if(typeof this.schema.maxItems !== "undefined") {
      hasmax = true;
      if(needed > this.schema.maxItems) valid = false;
    }
    if(typeof this.schema.minItems !== "undefined") {
      hasmin = true;
      if(needed < this.schema.minItems) valid = false;
    }
    if(!valid) {
      var error;
      if(hasmin && hasmax) {
        error = "Must have between "+this.schema.minItems+" and "+this.schema.maxItems+" items.";
      }
      else if(hasmin) {
        error = "Must have at least "+this.schema.minItems+" items.";
      }
      else {
        error = "Must have at most "+this.schema.maxItems+" items.";
      }
      errors.push({
        path: this.path,
        message: error
      });
    }
    
    // Check for unique items
    if(this.schema.uniqueItems) {
      var seen = {};
      valid = true;
      $.each(this.rows, function(i,row) {
        var key = JSON.stringify(row.getValue());
        if(seen[key]) {
          valid = false;
          return false;
        }
        seen[key] = true;
      });
      if(!valid) errors.push({
        path: this.path,
        message: "Must have unique values."
      });
    }
    
    // No rows to validate
    if(!needed) {
      if(errors.length) callback(errors);
      else callback();
    }
    
    // Validate each row
    else {
      var finished = 0;
      $.each(this.rows, function(i,row) {
        row.isValid(function(err) {
          if(err) {
            errors = errors.concat(err);
          }
          finished++;
          
          if(finished >= needed) {
            if(errors.length) callback(errors);
            else callback();
          }
        });
      });
    }
  },
  refreshValue: function() {
    var self = this;
    this.value = [];

    // If we currently have minItems items in the array
    var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;

    $.each(this.rows,function(i,editor) {
      // Hide the move down button for the last row
      if(i === self.rows.length - 1) {
        editor.movedown_button.hide();
      }
      else {
        editor.movedown_button.show();
      }

      // Hide the delete button if we have minItems items
      if(minItems) {
        editor.delete_button.hide();
      }
      else {
        editor.delete_button.show();
      }

      // Get the value for this editor
      self.value[i] = editor.getValue();
    });
    
    if(!this.value.length) {
      this.delete_last_row_button.hide();
      this.remove_all_rows_button.hide();
    }
    else if(this.value.length === 1) {      
      this.remove_all_rows_button.hide();  

      // If there are minItems items in the array, hide the delete button beneath the rows
      if(minItems) {
        this.delete_last_row_button.hide();
      }
      else {
        this.delete_last_row_button.show();
      }
    }
    else {
      // If there are minItems items in the array, hide the delete button beneath the rows
      if(minItems) {
        this.delete_last_row_button.hide();
        this.delete_last_row_button.hide();
      }
      else {
        this.delete_last_row_button.show();
        this.remove_all_rows_button.show();
      }
    }

    // If there are maxItems in the array, hide the add button beneath the rows
    if(this.schema.maxItems && this.schema.maxItems <= this.rows.length) {
      this.add_row_button.hide();
    }
    else {
      this.add_row_button.show();
    } 
  },
  addRow: function(value) {
    var self = this;
    var i = this.rows.length;
    
    self.rows[i] = this.getElementEditor(i);
    
    // Buttons to delete row, move row up, and move row down
    self.rows[i].delete_button = this.theme.getButton('Delete '+self.getItemTitle())
      .addClass('delete')
      .data('i',i)
      .on('click',function() {
        var i = $(this).data('i');

        var value = self.getValue();

        var newval = [];
        $.each(value,function(j,row) {
          if(j===i) return; // If this is the one we're deleting
          newval.push(row);
        });
        self.setValue(newval);
        self.container.trigger('change');
      });
    self.rows[i].moveup_button = this.theme.getButton('Move up')
      .data('i',i)
      .addClass('moveup')
      .on('click',function() {
        var i = $(this).data('i');

        if(i<=0) return;
        var rows = self.getValue();
        var tmp = rows[i-1];
        rows[i-1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.container.trigger('change');
      });
    self.rows[i].movedown_button = this.theme.getButton('Move down')
      .addClass('movedown')
      .data('i',i)
      .on('click',function() {
        var i = $(this).data('i');

        var rows = self.getValue();
        if(i>=rows.length-1) return;
        var tmp = rows[i+1];
        rows[i+1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.container.trigger('change');
      });

    var controls_holder = self.rows[i].title_controls || self.rows[i].array_controls;
    if(controls_holder) {
      controls_holder.append(self.rows[i].delete_button);
      if(i) controls_holder.append(self.rows[i].moveup_button);
      controls_holder.append(self.rows[i].movedown_button);
    }

    if(value) self.rows[i].setValue(value);
  },
  addControls: function() {
    var self = this;
    
    this.collapsed = false;
    this.toggle_button = this.theme.getButton('hide').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.row_holder.show(300);
        self.theme.setButtonText($(this),'hide');
      }
      else {
        self.collapsed = true;
        self.row_holder.hide(300);
        self.theme.setButtonText($(this),'show');
      }
    });
    
    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.theme.getButton('Add '+this.getItemTitle())
      .on('click',function() {
        self.addRow();
        self.refreshValue();
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.delete_last_row_button = this.theme.getButton('Delete Last '+this.getItemTitle())
      .on('click',function() {
        var rows = self.getValue();
        rows.pop();
        self.setValue(rows);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.remove_all_rows_button = this.theme.getButton('Delete All')
      .on('click',function() {
        self.setValue([]);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    // Make rows sortable
    this.row_holder
      .on('sortupdate',function(e,ui) {
        var oldi = ui.oldindex;
        var newi = ui.item.index();

        e.stopPropagation();
        e.preventDefault();

        if(oldi == newi) return;

        // Get the new value for the array
        var value = self.getValue();
        var newval = [];
        var row = value[oldi];
        var before = oldi>newi;
        $.each(value,function(i,el) {
          if(i===oldi) return;

          if(before) {
            if(i===newi) newval.push(row);
            newval.push(el);
          }
          else {
            newval.push(el);
            if(i===newi) newval.push(row);
          }
        });

        // Move the element back to where it was
        ui.item.detach();
        if(oldi) {
          self.row_holder.children().eq(oldi-1).after(ui.item);
        }
        else {
          self.row_holder.children().eq(0).before(ui.item);
        }

        self.setValue(newval);
        self.div.trigger('change');
      })
  }
});

$.jsoneditor.editors.table = $.jsoneditor.editors.array.extend({
  build: function() {
    this.rows = [];
    var self = this;

    this.table = this.theme.getTable();
    this.thead = this.theme.getTableHead().appendTo(this.table);
    this.header_row = this.theme.getTableRow().appendTo(this.thead);
    this.row_holder = this.theme.getTableBody().appendTo(this.table);

    // Determine the default value of array element
    var tmp = this.getElementEditor(0);
    this.item_default = tmp.getDefault();
    this.item_title = this.schema.items.title || this.schema.items.id || this.getTitle();

    // Build header row for table
    if(tmp.getChildEditors()) {
      this.item_has_child_editors = true;

      if(!this.getOption('compact',false)) {
        this.title = this.theme.getHeader(this.getTitle()).appendTo(this.container);
        this.title_controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
        if(this.schema.description) this.description = this.theme.getDescription(this.schema.description).appendTo(this.container);
      }
    }

    this.table.appendTo(this.container);
    this.controls = this.theme.getButtonHolder().appendTo(this.container);

    if(this.item_has_child_editors) {
      $.each(tmp.getChildEditors(), function(i,editor) {
        self.header_row.append(self.theme.getTableHeaderCell().text(editor.getTitle()).attr('title',editor.schema.title));
      });
    }
    else {
      self.header_row.append(self.theme.getTableHeaderCell().text(this.item_title));
    }

    tmp.destroy();
    this.row_holder.empty();

    // Row Controls column
    self.header_row.append(self.theme.getTableHeaderCell().html("&nbsp;"));

    this.row_holder.on('change',function() {
      self.refreshValue();
    });


    // Add controls
    this.addControls();
  },
  getItemDefault: function() {
    return $.extend(true,{},{default:this.item_default}).default;
  },
  getItemTitle: function() {
    return this.item_title;
  },
  getElementEditor: function(i) {
    var schema_copy = $.extend({},this.schema.items);
    var editor = $.jsoneditor.getEditorClass(schema_copy, this.jsoneditor);
    var row = this.theme.getTableRow().appendTo(this.row_holder);
    var holder = this.item_has_child_editors? row : this.theme.getTableCell().appendTo(row);

    var ret = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema_copy,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      compact: true,
      table_row: true
    });

    ret.controls_cell = this.theme.getTableCell().appendTo(row);
    ret.row = row;
    ret.table_controls = this.theme.getButtonHolder().appendTo(ret.controls_cell);

    return ret;
  },
  destroy: function() {
    this.empty();
    if(this.title) this.title.remove();
    if(this.description) this.description.remove();
    if(this.row_holder) this.row_holder.remove();
    this.table.remove();

    this.rows = this.title = this.description = this.row_holder = this.table = null;

    this._super();
  },
  empty: function() {
    if(!this.rows) return;
    var self = this;
    $.each(this.rows,function(i,row) {
      if(!self.item_has_child_editors) {
        row.row.remove();
      }
      row.destroy();
      self.rows[i] = null;
    });
    self.rows = [];
  },
  setValue: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];

    // Make sure value has between minItems and maxItems items in it
    if(this.schema.minItems) {
      while(value.length < this.schema.minItems) {
        value.push(this.getItemDefault());
      }
    }
    if(this.schema.maxItems && value.length > this.schema.maxItems) {
      value = value.slice(0,this.schema.maxItems);
    }

    var self = this;
    $.each(value,function(i,val) {
      if(self.rows[i]) {
        // TODO: don't set the row's value if it hasn't changed
        self.rows[i].setValue(val);
      }
      else {
        self.addRow(val);
      }
    });

    for(var j=value.length; j<self.rows.length; j++) {
      var holder = self.rows[j].container;
      if(!self.item_has_child_editors) {
        self.rows[j].row.remove();
      }
      self.rows[j].destroy();
      holder.remove();
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    self.refreshValue();

    // TODO: sortable
  },
  refreshValue: function() {
    var self = this;
    this.value = [];

    // If we currently have minItems items in the array
    var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;

    $.each(this.rows,function(i,editor) {
      // Hide the move down button for the last row
      if(i === self.rows.length - 1) {
        editor.movedown_button.hide();
      }
      else {
        editor.movedown_button.show();
      }

      // Hide the delete button if we have minItems items
      if(minItems) {
        editor.delete_button.hide();
      }
      else {
        editor.delete_button.show();
      }

      // Get the value for this editor
      self.value[i] = editor.getValue();
    });

    if(!this.value.length) {
      this.delete_last_row_button.hide();
      this.remove_all_rows_button.hide();
      this.toggle_button.hide();
      this.table.hide();
    }
    else if(this.value.length === 1) {
      this.table.show();
      this.toggle_button.show();
      this.remove_all_rows_button.hide();

      // If there are minItems items in the array, hide the delete button beneath the rows
      if(minItems) {
        this.delete_last_row_button.hide();
      }
      else {
        this.delete_last_row_button.show();
      }
    }
    else {
      this.table.show();
      this.toggle_button.show();
      // If there are minItems items in the array, hide the delete button beneath the rows
      if(minItems) {
        this.delete_last_row_button.hide();
        this.delete_last_row_button.hide();
      }
      else {
        this.delete_last_row_button.show();
        this.remove_all_rows_button.show();
      }
    }

    // If there are maxItems in the array, hide the add button beneath the rows
    if(this.schema.maxItems && this.schema.maxItems <= this.rows.length) {
      this.add_row_button.hide();
    }
    else {
      this.add_row_button.show();
    }
  },
  addRow: function(value) {
    var self = this;
    var i = this.rows.length;

    self.rows[i] = this.getElementEditor(i);

    // Buttons to delete row, move row up, and move row down
    self.rows[i].delete_button = this.theme.getButton('Delete '+self.getItemTitle())
      .addClass('delete')
      .data('i',i)
      .on('click',function() {
        var i = $(this).data('i');

        var value = self.getValue();

        var newval = [];
        $.each(value,function(j,row) {
          if(j===i) return; // If this is the one we're deleting
          newval.push(row);
        });
        self.setValue(newval);
        self.container.trigger('change');
      });
    self.rows[i].moveup_button = this.theme.getButton('Move up')
      .data('i',i)
      .addClass('moveup')
      .on('click',function() {
        var i = $(this).data('i');

        if(i<=0) return;
        var rows = self.getValue();
        var tmp = rows[i-1];
        rows[i-1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.container.trigger('change');
      });
    self.rows[i].movedown_button = this.theme.getButton('Move down')
      .addClass('movedown')
      .data('i',i)
      .on('click',function() {
        var i = $(this).data('i');

        var rows = self.getValue();
        if(i>=rows.length-1) return;
        var tmp = rows[i+1];
        rows[i+1] = rows[i];
        rows[i] = tmp;

        self.setValue(rows);
        self.container.trigger('change');
      });

    var controls_holder = self.rows[i].table_controls;
    controls_holder.append(self.rows[i].delete_button);
    if(i) controls_holder.append(self.rows[i].moveup_button);
    controls_holder.append(self.rows[i].movedown_button);

    if(value) self.rows[i].setValue(value);
  },
  addControls: function() {
    var self = this;

    this.collapsed = false;
    this.toggle_button = this.theme.getButton('hide').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.row_holder.show(300);
        self.theme.setButtonText($(this),'hide');
      }
      else {
        self.collapsed = true;
        self.row_holder.hide(300);
        self.theme.setButtonText($(this),'show');
      }
    });

    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.theme.getButton('Add '+this.getItemTitle())
      .on('click',function() {
        self.addRow();
        self.refreshValue();
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.delete_last_row_button = this.theme.getButton('Delete Last '+this.getItemTitle())
      .on('click',function() {
        var rows = self.getValue();
        rows.pop();
        self.setValue(rows);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.remove_all_rows_button = this.theme.getButton('Delete All')
      .on('click',function() {
        self.setValue([]);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    // Make rows sortable
    this.row_holder
      .on('sortupdate',function(e,ui) {
        var oldi = ui.oldindex;
        var newi = ui.item.index();

        e.stopPropagation();
        e.preventDefault();

        if(oldi == newi) return;

        // Get the new value for the array
        var value = self.getValue();
        var newval = [];
        var row = value[oldi];
        var before = oldi>newi;
        $.each(value,function(i,el) {
          if(i===oldi) return;

          if(before) {
            if(i===newi) newval.push(row);
            newval.push(el);
          }
          else {
            newval.push(el);
            if(i===newi) newval.push(row);
          }
        });

        // Move the element back to where it was
        ui.item.detach();
        if(oldi) {
          self.row_holder.children().eq(oldi-1).after(ui.item);
        }
        else {
          self.row_holder.children().eq(0).before(ui.item);
        }

        self.setValue(newval);
        self.div.trigger('change');
      })
  }
});


$.jsoneditor.AbstractTheme = Class.extend({
  getFormInputLabel: function(text) {
    return $("<label>").text(text);
  },
  getCheckboxLabel: function(text) {
    return this.getFormInputLabel(text);
  },
  getHeader: function(text) {
    return $("<h3>").text(text);
  },
  getCheckbox: function() {
    return this.getFormInputField('checkbox');
  },
  getSelectInput: function(options) {
    var select = $("<select>");
    $.each(options, function(i,val) {
      select.append($("<option>").attr('value',val).text(val));
    });
    return select;
  },
  getTextareaInput: function() {
    return $("<textarea>");
  },
  getRangeInput: function(min,max,step) {
    return $("<input type='range'>")
      .attr('min',min)
      .attr('max',max)
      .attr('step',step);
  },
  getFormInputField: function(type) {
    return $("<input type='"+type+"'>");
  },
  afterInputReady: function(input) {
    
  },
  getFormControl: function(label, input, description) {
    return $("<div>")
      .append(label)
      .append(input)
      .append(description)
  },
  getIndentedPanel: function() {
    return $("<div>").css({
      paddingLeft: 10,
      marginLeft: 10,
      borderLeft: '1px solid #ccc'
    });
  },
  getChildEditorHolder: function() {
    return $("<div>");
  },
  getDescription: function(text) {
    return $("<p>").text(text);
  },
  getCheckboxDescription: function(text) {
    return this.getDescription(text);
  },
  getFormInputDescription: function(text) {
    return this.getDescription(text);
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder();
  },
  getButtonHolder: function() {
    return $("<div>");
  },
  getButton: function(text) {
    return $("<button>").text(text);
  },
  setButtonText: function(button, text) {
    button.text(text);
  },
  getTable: function() {
    return $("<table></table>");
  },
  getTableRow: function() {
    return $("<tr></tr>");
  },
  getTableHead: function() {
    return $("<thead></thead>");
  },
  getTableBody: function() {
    return $("<tbody></tbody>");
  },
  getTableHeaderCell: function() {
    return $("<th></th>");
  },
  getTableCell: function() {
    return $("<td></td>");
  }
});

$.jsoneditor.themes.bootstrap2 = $.jsoneditor.AbstractTheme.extend({
  getRangeInput: function(min, max, step) {
    // TODO: use bootstrap slider
    return this._super(min, max, step);
  },
  getSelectInput: function(options) {
    return this._super(options).css({
      width: 'auto'
    });
  },
  afterInputReady: function(input) {
    if(input.closest('.compact').length) {
      input.closest('.control-group').removeClass('control-group');
      input.closest('.controls').removeClass('controls');
      input.css('margin-bottom',0);
    }

    // TODO: use bootstrap slider
  },
  getIndentedPanel: function() {
    return $("<div></div>").addClass('well well-small');
  },
  getFormInputDescription: function(text) {
    return $("<p></p>").addClass('help-inline').text(text);
  },
  getFormControl: function(label, input, description) {
    var ret = $("<div></div>").addClass('control-group');

    var controls;

    if(label && input.attr('type') === 'checkbox') {
      controls = $("<div></div>").addClass('controls').appendTo(ret);
      label.addClass('checkbox').append(input).appendTo(controls);
    }
    else {
      if(label) label.addClass('control-label').appendTo(ret);
      controls = $("<div></div>").addClass('controls').append(input).appendTo(ret);
    }

    if(description) controls.append(description);

    return ret;
  },
  getHeaderButtonHolder: function() {
    return $("<div></div>").addClass('btn-group').css({
      marginLeft: 10
    });
  },
  getButtonHolder: function() {
    return $("<div></div>").addClass('btn-group');
  },
  getButton: function(text) {
    return $("<button></button>").addClass('btn btn-default').text(text);
  },
  getTable: function() {
    return $("<table></table>").addClass('table table-bordered').css({
      width: 'auto',
      maxWidth: 'none'
    });
  }
});

$.jsoneditor.themes.bootstrap3 = $.jsoneditor.AbstractTheme.extend({
  getSelectInput: function(options) {
    return this._super(options).addClass('form-control').css({
      width: 'auto'
    });
  },
  getTextareaInput: function() {
    return $("<textarea>").addClass('form-control');
  },
  getRangeInput: function(min, max, step) {
    // TODO: use better slider
    return this._super();
  },
  getFormInputField: function(type) {
    return this._super().addClass('form-control');
  },
  getFormControl: function(label, input, description) {
    var group = $("<div></div>");

    if(label && input.attr('type') === 'checkbox') {
      group.addClass('checkbox');
      label.append(input).appendTo(group);
    } 
    else {
      group.addClass('form-group');
      if(label) label.appendTo(group);
      input.appendTo(group);
    }

    if(description) group.append(description);

    return group;
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('well well-sm');
  },
  getFormInputDescription: function(text) {
    return $("<p>").addClass('help-block').text(text);
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      marginLeft: 10
    });
  },
  getButtonHolder: function() {
    return $("<div>").addClass('btn-group');
  },
  getButton: function(text) {
    return $("<button>").addClass('btn btn-default').text(text);
  },
  getTable: function() {
    return $("<table>").addClass("table table-bordered").css({
      width: 'auto',
      maxWidth: 'none'
    });
  }
});

// Base Foundation theme
$.jsoneditor.themes.foundation = $.jsoneditor.AbstractTheme.extend({
  getChildEditorHolder: function() {
    return $("<div>").css({
      marginBottom: 15
    });
  }, 
  getSelectInput: function(options) {
    var select = $("<select>").css({
      width: 'auto',
      minWidth: 'none',
      padding: 5,
      marginTop: 3
    });
    $.each(options, function(i,val) {
      select.append($("<option>").attr('value',val).text(val));
    });
    return select;
  },
  afterInputReady: function(input) {
    if(input.closest('.compact').length) {
      input.css('margin-bottom',0);
    }
  },
  getFormInputDescription: function(text) {
    return $("<p></p>").text(text).css({
      marginTop: -10,
      fontStyle: 'italic'
    });
  },
  getFormControl: function(label, input, description) {
    return $("<div>")
      .append(label)
      .append(input)
      .append(description)
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('panel');
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      display: 'inline-block',
      marginLeft: 10,
      verticalAlign: 'middle'
    });
  },
  getButtonHolder: function() {
    return $("<div>").addClass('button-group');
  },
  getButton: function(text) {
    return $("<button>").addClass('small button').text(text);
  }
});

// Foundation 3 Specific Theme
$.jsoneditor.themes.foundation3 = $.jsoneditor.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    return this._super().css({
      fontSize: '.6em'
    });
  }
});

// Foundation 4 Specific Theme
$.jsoneditor.themes.foundation4 = $.jsoneditor.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    return this._super().css({
      fontSize: '.6em'
    });
  },
  getFormInputDescription: function(text) {
    return this._super().css({
      fontSize: '.8rem'
    });
  }
});

// Foundation 5 Specific Theme
$.jsoneditor.themes.foundation5 = $.jsoneditor.themes.foundation.extend({
  getFormInputDescription: function(text) {
    return this._super().css({
      fontSize: '.8rem'
    });
  },
  getButton: function(text) {
    return $("<button>").addClass('tiny button').text(text);
  }
});

$.jsoneditor.themes.html = $.jsoneditor.AbstractTheme.extend({
  getFormInputLabel: function(text) {
    return this._super(text).css({
      display: "block",
      marginBottom: 3
    });
  },
  getFormInputDescription: function(text) {
    return this._super(text).css({
      fontSize: '.8em',
      margin: 0,
      display: 'inline-block',
      fontStyle: 'italic'
    });
  },
  getIndentedPanel: function() {
    return $("<div>").css({
      border: '1px solid #ddd',
      padding: 5,
      margin: 5,
      borderRadius: 3
    });
  },
  getChildEditorHolder: function() {
    return $("<div>").css({
      marginBottom: 8
    });
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      display: 'inline-block',
      marginLeft: 10,
      fontSize: '.8em',
      verticalAlign: 'middle'
    });
  },
  getTable: function() {
    return $("<table>").css({
      borderBottom: '1px solid #ccc',
      marginBottom: 5
    });
  }
});

$.jsoneditor.themes.jqueryui = $.jsoneditor.AbstractTheme.extend({
  getTable: function() {
    return $("<table>").attr('cellpadding',5).attr('cellspacing',0);
  },
  getTableHeaderCell: function() {
    return $("<th>").addClass('ui-state-active').css({
      fontWeight: 'bold'
    });
  },
  getTableCell: function() {
    return $("<td>").addClass('ui-widget-content');
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      marginLeft: 10,
      fontSize: '.6em',
      display: 'inline-block'
    });
  },
  getFormInputDescription: function(text) {
    return this.getDescription(text).css({
      display: 'inline-block',
      marginLeft: 10
    });
  },
  getDescription: function(text) {
    return $("<p>").css({
      fontSize: '.8em',
      fontStyle: 'italic'
    }).text(text);
  },
  getButtonHolder: function() {
    return $("<div>").addClass('ui-buttonset').css({
      fontSize: '.7em'
    });
  },
  getFormInputLabel: function(text) {
    return $("<label>").text(text).css({
      marginRight: '5px'
    });
  },
  getButton: function(text) {
    return $("<button>").addClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only').append(
      $("<span>").addClass('ui-button-text').text(text)
    );
  },
  setButtonText: function(button,text) {
    $(".ui-button-text",button).text(text);
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('ui-widget-content ui-corner-all').css({
      padding: '1em 1.4em'
    });
  }
});

$.jsoneditor.templates.ejs = function() {
  if(!window.EJS) return false;

  return {
    compile: function(template) {
      var compiled = new EJS({
        text: template
      });

      return function(context) {
        return compiled.render(context);
      };
    }
  };
};
$.jsoneditor.templates.handlebars = function() {
  return window.Handlebars;
};
$.jsoneditor.templates.hogan = function() {
  if(!window.Hogan) return false;

  return {
    compile: function(template) {
      var compiled = Hogan.compile(template);
      return function(context) {
        return compiled.render(context);
      }
    }
  };
};
$.jsoneditor.templates.markup = function() {
  if(!window.Mark || !window.Mark.up) return false;

  return {
    compile: function(template) {
      return function(context) {
        return Mark.up(template,context);
      };
    }
  };
};

$.jsoneditor.templates.mustache = function() {
  if(!window.Mustache) return false;

  return {
    compile: function(template) {
      return function(view) {
        return Mustache.render(template, view);
      }
    }
  };
};
$.jsoneditor.templates.swig = function() {
  return window.swig;
};
$.jsoneditor.templates.underscore = function() {
  if(!window._) return false;

  return {
    compile: function(template) {
      return function(context) {
        return _.template(template, context);
      };
    }
  };
};
// Set the default theme
$.jsoneditor.theme = 'html';

// Set the default template engine based on what libraries are loaded
$.each($.jsoneditor.templates, function(key, template) {
  // If this template is supported
  if(template()) {
    $.jsoneditor.template = key;
    return false;
  }
});

// Set the default resolvers
$.jsoneditor.resolvers.unshift(function(schema) {
  return schema.type;
});
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});


})(jQuery);
