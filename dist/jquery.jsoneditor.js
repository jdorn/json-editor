/*! JSON Editor v0.4.2 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2013-12-30
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
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before getting/setting the value";

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
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before destroying";
    d.schema = null;
    d.options = null;
    d.root.destroy();
    d = null;
    $this.data('jsoneditor',null);
    $this.empty();

    return this;
  }
  // Validate
  else if(options === 'validate') {
    d = $this.data('jsoneditor');
    if(!d) throw "JSON Editor must be instantiated before trying to validate";
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before running validation";
    
    return d.validator.validate(d.root.getValue());
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
    refs: {},
    theme: new theme_class(),
    template: options.template,
    ready: false
  };
  $this.data('jsoneditor',d);

  d.root_container = d.theme.getContainer().appendTo($this);

  // Stop all change events before the editor is ready
  d.root_container.on('change',function(e) {
    if(!d.ready) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  var load = function(synchronous) {
    if(d.ready) return;
    
    d.root = new editor_class({
      jsoneditor: $this,
      schema: schema,
      container: d.root_container,
      required: true
    });
    
    d.validator = new $.jsoneditor.Validator(schema);

    // Starting data
    if(data) d.root.setValue(data);
    
    d.ready = true;
    
    if(synchronous) {
      window.setTimeout(function() {
        $this.trigger('ready');
        $this.trigger('change');
      });
    }
    else {
      $this.trigger('ready');
      $this.trigger('change');
    }
  }

  // Recursively look for $ref urls in the schema and load them before building the editor
  var waiting = 0;
  var finished = 0;
  var getRefs = function(schema) {
    $.each(schema, function(i,value) {
      // If this is an external url we need to load
      if(i === "$ref" && value.match(/^http/) && !d.refs[value]) {
        d.refs[value] = 'loading';
        waiting++;
        $.getJSON(value,function(json) {
          d.refs[value] = json;
          
          // Check this external schema for further $refs
          getRefs(json);
          
          finished++;
          
          // If we're done
          if(finished >= waiting) {
            load();
          }
        }).fail(function() {
          throw "Failed to load ref - "+value;
        });
      }
      else if(typeof value == "object" && value) {
        getRefs(value);
      }
    });    
  };
  getRefs(d.schema);
  if(!waiting) load(true);

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
    // Work on a deep copy of the schema
    schema = $.extend(true,{},schema);
    
    // Schema has a reference to another schema
    if(schema['$ref']) {
      // Reference to local schema or external url (previously loaded and cached)
      if(schema['$ref'].match(/^(#\/definitions\/|http)/)) {
        var refs = editor.data('jsoneditor').refs;
        if(!refs[schema['$ref']]) throw "Schema definition not found - "+schema['$ref'];

        return $.extend(true,{},refs[schema['$ref']],schema);
      }
      else {
        throw "Unsupported $ref - "+schema['$ref'];
      }
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


$.jsoneditor.Validator = Class.extend({
  init: function(schema, editor) {
    this.schema = schema;
    this.editor = editor;
  },
  validate: function(value) {
    return this._validateSchema(this.schema, value);
  },
  _validateSchema: function(schema,value,path) {
    var errors = [];
    var valid, i;
    var stringified = JSON.stringify(value);
    
    path = path || 'root';
    
    // Expand out any `$ref` properties
    schema = $.jsoneditor.expandSchema(schema,this.editor);
    
    /*
     * Type Agnostic Validation
     */
     
    // Version 3 `required`
    if(schema.required && schema.required === true) {
      if(typeof value === "undefined") {
        errors.push({
          path: path,
          property: 'required',
          message: 'Property must be set'
        });
        
        // Can't do any more validation at this point
        return errors;
      }
    }
    else if(!schema.required && typeof value === "undefined") {
      // Not required and not defined, no further validation needed
      return errors;
    }
    
    // `enum`
    if(schema.enum) {
      valid = false;
      for(i=0; i<schema.enum.length; i++) {
        if(stringified === JSON.stringify(schema.enum[i])) valid = true;
      }
      if(!valid) {
        errors.push({
          path: path,
          property: 'enum',
          message: 'Value must be one of the enumerated values'
        });
      }
    }
    
    // `extends` (version 3)
    if(schema.extends) {
      for(i=0; i<schema.extends.length; i++) {
        errors = errors.concat(this._validateSchema(schema.extends[i],value,path));
      }
    }
    
    // `allOf`
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        errors = errors.concat(this._validateSchema(schema.allOf[i],value,path));
      }
    }
    
    // `anyOf`
    if(schema.anyOf) {
      valid = false;
      for(i=0; i<schema.anyOf.length; i++) {
        if(!this._validateSchema(schema.anyOf[i],value,path).length) {
          valid = true;
          break;
        }
      }
      if(!valid) {
        errors.push({
          path: path,
          property: 'anyOf',
          message: 'Value must validate against at least one of the provided schemas'
        });
      }
    }
    
    // `oneOf`
    if(schema.oneOf) {
      valid = 0;
      for(i=0; i<schema.oneOf.length; i++) {
        if(!this._validateSchema(schema.oneOf[i],value,path).length) {
          valid++;
        }
      }
      if(valid !== 1) {
        errors.push({
          path: path,
          property: 'oneOf',
          message: 'Value must validate against exactly one of the provided schemas. '+
            'It currently validates against '+valid+' of the schemas.'
        });
      }
    }
    
    // `not`
    if(schema.not) {
      if(!this._validateSchema(schema.not,value,path).length) {
        errors.push({
          path: path,
          property: 'not',
          message: 'Value must not validate against the provided schema'
        });
      }
    }
    
    // `type` (both Version 3 and Version 4 support)
    if(schema.type) {
      // Union type
      if(schema.type instanceof Array) {
        valid = false;
        for(i=0;i<schema.type.length;i++) {
          if(this._checkType(schema.type[i], value)) {
            valid = true;
            break;
          }
        }
        if(!valid) {
          errors.push({
            path: path,
            property: 'type',
            message: 'Value must be one of the provided types'
          });
        }
      }
      // Simple type
      else {
        if(!this._checkType(schema.type, value)) {
          errors.push({
            path: path,
            property: 'type',
            message: 'Value must be of type '+schema.type
          });
        }
      }
    }


    // `disallow` (version 3)
    if(schema.disallow) {
      // Union type
      if(schema.disallow instanceof Array) {
        valid = true;
        for(i=0;i<schema.disallow.length;i++) {
          if(this._checkType(schema.disallow[i], value)) {
            valid = false;
            break;
          }
        }
        if(!valid) {
          errors.push({
            path: path,
            property: 'disallow',
            message: 'Value must not be one of the provided disallowed types'
          });
        }
      }
      // Simple type
      else {
        if(this._checkType(schema.disallow, value)) {
          errors.push({
            path: path,
            property: 'disallow',
            message: 'Value must not be of type '+schema.disallow
          });
        }
      }
    }
    
    /*
     * Type Specific Validation
     */
    
    // `multipleOf` and `divisibleBy`
    if(schema.multipleOf || schema.divisibleBy) {
      valid = value / (schema.multipleOf || schema.divisibleBy);
      if(valid !== Math.floor(valid)) {
        errors.push({
          path: path,
          property: schema.multipleOf? 'multipleOf' : 'divisibleBy',
          message: 'Value must be a multiple of '+(schema.multipleOf || schema.divisibleBy)
        });
      }
    }
    
    // `maximum`
    if(schema.maximum) {
      if(schema.exclusiveMaximum && value >= schema.maximum) {
        errors.push({
          path: path,
          property: 'maximum',
          message: 'Value must be less than '+schema.maximum
        });
      }
      else if(!schema.exclusiveMaximum && value > schema.maximum) {
        errors.push({
          path: path,
          property: 'maximum',
          message: 'Value must be at most '+schema.maximum
        });
      }
    }
    
    // `minimum`
    if(schema.minimum) {
      if(schema.exclusiveMinimum && value <= schema.minimum) {
        errors.push({
          path: path,
          property: 'minimum',
          message: 'Value must be greater than '+schema.minimum
        });
      }
      else if(!schema.exclusiveMinimum && value < schema.minimum) {
        errors.push({
          path: path,
          property: 'minimum',
          message: 'Value must be at least '+schema.minimum
        });
      }
    }
    
    // `maxLength`
    if(schema.maxLength) {
      if((value+"").length > schema.maxLength) {
        errors.push({
          path: path,
          property: 'maxLength',
          message: 'Value must be at most '+schema.maxLength+' characters long'
        });
      }
    }
    
    // `minLength`
    if(schema.minLength) {
      if((value+"").length < schema.minLength) {
        errors.push({
          path: path,
          property: 'minLength',
          message: 'Value must be at least '+schema.minLength+' characters long'
        });
      }
    }
    
    // `pattern`
    if(schema.pattern) {
      if(!(new RegExp(schema.pattern)).test(value)) {
        errors.push({
          path: path,
          property: 'pattern',
          message: 'Value must match the provided pattern'
        });
      }
    }
    
    if(value instanceof Array) {    
      // `items` and `additionalItems`
      if(schema.items) {
        // `items` is an array
        if(schema.items instanceof Array) {
          for(i=0; i<value.length; i++) {
            // If this item has a specific schema tied to it
            // Validate against it
            if(schema.items[i]) {
              errors = errors.concat(this._validateSchema(schema.items[i],value[i],path+'.'+i));
            }
            // If all additional items are allowed
            else if(schema.additionalItems === true) {
              break;
            }
            // If additional items is a schema
            // TODO: Incompatibility between version 3 and 4 of the spec
            else if(schema.additionalItems) {
              errors = errors.concat(this._validateSchema(schema.additionalItems,value[i],path+'.'+i));
            }
            // If no additional items are allowed
            else if(schema.additionalItems === false) {
              errors.push({
                path: path,
                property: 'additionalItems',
                message: 'No additional items allowed in this array'
              });
              break;
            }
            // Default for `additionalItems` is an empty schema
            else {
              break;
            }
          }
        }
        // `items` is a schema
        else {
          // Each item in the array must validate against the schema
          for(i=0; i<value.length; i++) {
            errors = errors.concat(this._validateSchema(schema.items,value[i],path+'.'+i));
          }
        }
      }
      
      // `maxItems`
      if(schema.maxItems) {
        if(value.length > schema.maxItems) {
          errors.push({
            path: path,
            property: 'maxItems',
            message: 'Value must have at most '+schema.maxItems+' items'
          });
        }
      }
      
      // `minItems`
      if(schema.minItems) {
        if(value.length < schema.minItems) {
          errors.push({
            path: path,
            property: 'minItems',
            message: 'Value must have at least '+schema.minItems+' items'
          });
        }
      }
      
      // `uniqueItems`
      if(schema.uniqueItems) {
        var seen = {};
        for(i=0; i<value.length; i++) {
          valid = JSON.stringify(value[i]);
          if(seen[valid]) {
            errors.push({
              path: path,
              property: 'uniqueItems',
              message: 'Array must have unique items'
            });
            break;
          }
          seen[valid] = true;
        }
      }
    }
    
    if(typeof value === "object" && value !== null && !(value instanceof Array)) {
      // `maxProperties`
      if(schema.maxProperties) {
        valid = 0;
        for(var i in value) {
          if(!value.hasOwnProperty(i)) continue;
          valid++;
        }
        if(valid > schema.maxProperties) {
          errors.push({
            path: path,
            property: 'maxProperties',
            message: 'Object must have at most '+schema.maxProperties+' properties'
          });
        }
      }
      
      // `minProperties`
      if(schema.minProperties) {
        valid = 0;
        for(i in value) {
          if(!value.hasOwnProperty(i)) continue;
          valid++;
        }
        if(valid < schema.minProperties) {
          errors.push({
            path: path,
            property: 'minProperties',
            message: 'Object must have at least '+schema.minProperties+' properties'
          });
        }
      }
      
      // Version 4 `required`
      if(schema.required && schema.required instanceof Array) {
        valid = true;
        for(i=0; i<schema.required.length; i++) {
          if(typeof value[schema.required[i]] === "undefined") {
            errors.push({
              path: path,
              property: 'required',
              message: 'Object is missing the required property '+schema.required[i]
            });
          }
        }
      }
      
      // `properties`
      var validated_properties = {};
      if(schema.properties) {
        for(i in schema.properties) {
          if(!schema.properties.hasOwnProperty(i)) continue;
          validated_properties[i] = true;
          errors = errors.concat(this._validateSchema(schema.properties[i],value[i],path+'.'+i));
        }
      }
      
      // `patternProperties`
      if(schema.patternProperties) {
        for(i in schema.patternProperties) {
          if(!schema.patternProperties.hasOwnProperty(i)) continue;
          
          var regex = new RegExp(i);
          
          // Check which properties match
          for(var j in value) {
            if(!value.hasOwnProperty(j)) continue;
            if(regex.test(j)) {
              validated_properties[j] = true;
              errors = errors.concat(this._validateSchema(schema.patternProperties[i],value[j],path+'.'+j));
            }
          }
        }
      }
      
      // `additionalProperties`
      if(typeof schema.additionalProperties !== "undefined") {
        for(i in value) {
          if(!value.hasOwnProperty(i)) continue;
          if(!validated_properties[i]) {
            // No extra properties allowed
            if(!schema.additionalProperties) {
              errors.push({
                path: path,
                property: 'additionalProperties',
                message: 'No additional properties allowed, but property '+i+' is set'
              });
              break;
            }
            // Allowed
            else if(schema.additionalProperties === true) {
              break;
            }
            // Must match schema
            // TODO: incompatibility between version 3 and 4 of the spec
            else {
              errors = errors.concat(this._validateSchema(schema.additionalProperties,value[i],path+'.'+i));
            }
          }
        }
      }
      
      // `dependencies`
      if(schema.dependencies) {
        for(i in schema.dependencies) {
          if(!schema.dependencies.hasOwnProperty(i)) continue;
          
          // Doesn't need to meet the dependency
          if(typeof value[i] === "undefined") continue;
          
          // Property dependency
          if(schema.dependencies[i] instanceof Array) {
            for(var j=0; j<schema.dependencies[i].length; j++) {
              if(typeof value[schema.dependencies[i][j]] === "undefined") {
                errors.push({
                  path: path,
                  property: 'dependencies',
                  message: 'Must have property '+schema.dependencies[i][j]
                });
              }
            }
          }
          // Schema dependency
          else {
            errors = errors.concat(this._validateSchema(schema.dependencies[i],value,path));
          }
        }
      }
    }
    
    return errors;
  },
  _checkType: function(type, value) {
    // Simple types
    if(typeof type === "string") {
      if(type==="string") return typeof value === "string";
      else if(type==="number") return typeof value === "number";
      else if(type==="integer") return typeof value === "number" && value === Math.floor(value);
      else if(type==="boolean") return typeof value === "boolean";
      else if(type==="array") return value instanceof Array;
      else if(type === "object") return value !== null && !(value instanceof Array) && typeof value === "object";
      else if(type === "null") return value === null;
      else return true;
    }
    // Schema
    else {
      return !this._validateSchema(type,value).length;
    }
  }
});

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

    // Store schema definitions for root node
    if(!options.path && this.schema.definitions) {
      var refs = this.jsoneditor.data('jsoneditor').refs;
      $.each(this.schema.definitions,function(key,schema) {
        refs['#/definitions/'+key] = schema;
      });
    }

    this.options = $.extend(true, {}, (this.options || {}), (this.schema.options || {}), options);

    if(!options.path && !this.schema.id) this.schema.id = 'root';
    this.path = options.path || 'root';
    if(this.schema.id) this.container.attr('data-schemaid',this.schema.id);
    this.container.data('editor',this);

    this.key = this.path.split('.').pop();
    this.parent = options.parent;
    
    // If not required, add an add/remove property link
    if(!this.isRequired() && !this.options.compact) {
      this.title_links = this.theme.getFloatRightLinkHolder().appendTo(this.container);

      this.addremove = this.theme.getLink('remove '+this.getTitle()).appendTo(this.title_links);
      
      var self = this;
      this.addremove.on('click',function() {
        if(self.property_removed) {
          self.addProperty();
        }
        else {
          self.removeProperty();
        }
      
        self.container.trigger('change');
        return false;
      });
    }

    this.build();

    this.setValue(this.getDefault(), true);
  },
  addProperty: function() {
    this.property_removed = false;
    this.addremove.text('remove '+this.getTitle());
  },
  removeProperty: function() {
    this.property_removed = true;
    this.addremove.text('add '+this.getTitle());
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
  isRequired: function() {
    return this.options.required || this.schema.required;
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
    return this.schema.title || this.key;
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

$.jsoneditor.editors.null = $.jsoneditor.AbstractEditor({
  getValue: function() {
    return null;
  }
});

$.jsoneditor.editors.string = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || '';
  },
  setValue: function(value,initial,from_template) {
    value = value || '';

    // Sanitize value before setting it
    var sanitized = this.sanitize(value);
    if(this.schema.enum && this.schema.enum.indexOf(sanitized) < 0) {
      sanitized = this.schema.enum[0];
    }

    this.input.val(sanitized);

    this.refreshValue();

    if(this.getValue() !== value || from_template) this.input.trigger('change');
    this.input.trigger('set');
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
        var path_parts;
        if(path instanceof Array) {
          path_parts = [path[0]].concat(path[1].split('.'));
        }
        else {
          path_parts = path.split('.'); 
          if(!self.container.closest('[data-schemaid="'+path_parts[0]+'"]').length) path_parts.unshift('#');
        }
        var first = path_parts.shift();
        
        if(first === '#') first = self.jsoneditor.data('jsoneditor').schema.id || 'root';

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
        root.on('change set','[data-schemapath="'+adjusted_path+'"]',self.var_listener);
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
      this.setValue(this.template(vars),false,true);
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
  }
});

$.jsoneditor.editors.integer = $.jsoneditor.editors.number.extend({
  sanitize: function(value) {
    value = value + "";
    return value.replace(/[^0-9\-]/g,'');
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
    }
    // If the object should be rendered as a div
    else {
      this.title = this.getTheme().getHeader(this.getTitle()).appendTo(this.container);
      
      this.editjson_holder = this.theme.getTextareaInput().appendTo(this.container).hide().css({
        height: 100,
        width: '100%'
      });
      
      if(this.schema.description) this.description = this.getTheme().getDescription(this.schema.description).appendTo(this.container);
      this.editor_holder = this.getTheme().getIndentedPanel().appendTo(this.container);

      $.each(this.schema.properties, function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getChildEditorHolder().appendTo(self.editor_holder);

        // If the property is required
        var required = false;
        if(self.schema.required && self.schema.required.indexOf(key) >= 0) required = true;

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
      this.editing_json = false
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

    this.editors = null;
    this.editor_holder.remove();
    this.editor_holder = null;

    this._super();
  },
  refreshValue: function() {
    this.value = {};
    var self = this;
    $.each(this.editors, function(i,editor) {
      if(editor.property_removed) return;
      self.value[i] = editor.getValue();
    });
    
    if(!this.editing_json && this.editjson_holder) this.editjson_holder.val(JSON.stringify(this.value,null,2));
  },
  setValue: function(value, initial) {
    value = value || {};
    var self = this;
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
  }
});

$.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  addProperty: function() {
    this._super();
    this.row_holder.show(500);
    this.controls.show(500);
    this.title_controls.show(500);
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.row_holder.hide(500);
    this.controls.hide(500);
    this.title_controls.hide(500);
    this.theme.disableHeader(this.title);
  },
  build: function() {
    this.rows = [];
    var self = this;

    this.schema.items = this.schema.items || [];

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
    this.item_title = this.schema.items.title || 'item';
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
      parent: this,
      required: true
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
    this.toggle_button = this.theme.getButton('Collapse').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.row_holder.show(300);
        self.controls.show(300);
        self.theme.setButtonText($(this),'Collapse');
      }
      else {
        self.collapsed = true;
        self.row_holder.hide(300);
        self.controls.hide(300);
        self.theme.setButtonText($(this),'Expand');
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
  addProperty: function() {
    this._super();
    if(this.value.length) this.table.show(500);
  },
  removeProperty: function() {
    this._super();
    this.table.hide(500);
  },
  build: function() {
    this.rows = [];
    var self = this;

    this.schema.items = this.schema.items || [];

    this.table = this.theme.getTable();
    this.thead = this.theme.getTableHead().appendTo(this.table);
    this.header_row = this.theme.getTableRow().appendTo(this.thead);
    this.row_holder = this.theme.getTableBody().appendTo(this.table);

    // Determine the default value of array element
    var tmp = this.getElementEditor(0);
    this.item_default = tmp.getDefault();
    this.item_title = this.schema.items.title || 'row';

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
    this.toggle_button = this.theme.getButton('Collapse').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.controls.show(300);
        self.row_holder.show(300);
        self.theme.setButtonText($(this),'Collapse');
      }
      else {
        self.collapsed = true;
        self.controls.hide(300);
        self.row_holder.hide(300);
        self.theme.setButtonText($(this),'Expand');
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


// Multiple Editor (for when `type` is an array)
$.jsoneditor.editors.multiple = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return null;
  },
  build: function() {
    var self = this;
    var container = this.getContainer();

    this.types = [];
    if(!this.schema.type || this.schema.type === "any") {
      this.types = ['string','number','integer','boolean','object','array','null'];
    }
    else if(this.schema.type instanceof Array) {
      this.types = this.schema.type;
    }
    else if(typeof this.schema.type === "string") {
      this.types = [this.schema.type];
    }
    else {
      throw "Invalid type: "+(typeof this.schema.type);
    }

    this.switcher = this.theme.getSelectInput(this.types)
      .appendTo(container)
      .on('change',function() {
        self.type = $(this).val();

        var current_value = self.getValue();

        $.each(self.editors,function(type,editor) {
          if(self.type === type) {
            editor.setValue(current_value);
            editor.container.show();
          }
          else editor.container.hide();
        });

        self.container.trigger('change');
      })
      .css({
        marginBottom: 0,
        float: 'right'
      });

    this.editor_holder = this.theme.getIndentedPanel().appendTo(container);
    this.type = this.types[0];

    this.editors = {};
    $.each(this.types,function(i,type) {
      var holder = self.theme.getChildEditorHolder().appendTo(self.editor_holder);

      var schema = $.extend(true,{},self.schema);
      schema.type = type;

      var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);

      self.editors[type] = new editor({
        jsoneditor: self.jsoneditor,
        schema: schema,
        container: holder,
        path: self.path,
        parent: self.parent,
        required: true
      });

      if(type !== self.type) holder.hide();
    });

    this.editor_holder.on('change set',function() {
      self.refreshValue();
    });

    this.switcher.val(this.type);
  },
  refreshValue: function() {
    this.value = this.editors[this.type].getValue();
  },
  setValue: function(val,initial) {
    this.editors[this.type].setValue(val,initial);

    this.refreshValue();
  },
  destroy: function() {
    this.editor_holder.remove();
    this.switcher.remove();
    this._super();
  }
});

$.jsoneditor.AbstractTheme = Class.extend({
  getContainer: function() {
    return $("<div>");
  },
  getFloatRightLinkHolder: function() {
    return $("<div>").css({
      float: 'right',
      marginLeft: '10px'
    });
  },
  getLink: function(text) {
    return $("<a href='#'>").text(text);
  },
  disableHeader: function(header) {
    header.css({
      color: "#ccc"
    });
  },
  disableLabel: function(label) {
    label.css({
      color: "#ccc"
    });
  },
  enableHeader: function(header) {
    header.css({
      color: ''
    });
  },
  enableLabel: function(label) {
    label.css({
      color: ''
    });
  },
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

$.jsoneditor.templates.default = function() {
  return {
    compile: function(template) {
      return function (vars) {
        var ret = template+"";
        // Only supports basic {{var}} macro replacement
        $.each(vars,function(key,value) {
          ret = ret.replace(new RegExp('\{\{\\s*'+key+'\\s*\}\}','g'),value);
        });
        return ret;
      };
    }
  };
};

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

// Set the default template engine
$.jsoneditor.template = 'default';

// Set the default resolvers
$.jsoneditor.resolvers.unshift(function(schema) {
  // TODO: handle schemas with no type set
  // TODO: handle schemas with the type set to a schema
  return "string";
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema is a simple type
  if(typeof schema.type === "string") return schema.type;
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema can be of any type or an enumerated list of types
  if(schema.type === "any" || schema.type && schema.type instanceof Array) {
    return "multiple";
  }
});
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});


})(jQuery);
