/*! JSON Editor v0.4.40 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2014-02-12
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

    // Custom value to validate
    if(arguments.length > 1) {
      return d.validator.validate(arguments[1]);
    }
    // Current value (use cached result)
    else {
      return d.validation_results;
    }
  }

  options = options || {};

  var schema = options.schema;
  var data = options.startval;

  var theme_class = $.jsoneditor.themes[options.theme || $.jsoneditor.theme];

  if(!theme_class) throw "Unknown theme " + (options.theme || $.jsoneditor.theme);
  

  // Store info about the jsoneditor in the element
  d = {
    schema: schema,
    options: options,
    refs: {},
    theme: new theme_class(),
    template: options.template,
    ready: false
  };
  
  var icon_class = $.jsoneditor.iconlibs[options.iconlib || $.jsoneditor.iconlib];
  if(icon_class) d.iconlib = new icon_class();
  
  $this.data('jsoneditor',d);

  d.root_container = d.theme.getContainer().appendTo($this);

  // Stop all change events before the editor is ready
  d.root_container.on('change',function(e) {
    if(!d.ready) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Validate and cache results
    d.validation_results = d.validator.validate(d.root.getValue());
    d.root.showValidationErrors(d.validation_results);
  });

  // Let the validator resolve references in the schema asynchronously
  d.validator = new $.jsoneditor.Validator(schema,{
    ajax: options.ajax,
    refs: options.refs,
    no_additional_properties: options.no_additional_properties,
    required_by_default: options.required_by_default
  });
  d.validator.ready(function(expanded) {
    if(d.ready) return;
    
    d.schema = expanded;
    
    var editor_class = $.jsoneditor.getEditorClass(d.schema);
    d.root = new editor_class({
      jsoneditor: $this,
      schema: d.schema,
      container: d.root_container,
      required: true
    });

    // Starting data
    if(data) d.root.setValue(data);

    d.validation_results = d.validator.validate(d.root.getValue());
    d.root.showValidationErrors(d.validation_results);

    d.ready = true;

    // Fire ready event asynchronously
    window.setTimeout(function() {
      $this.trigger('ready');
      $this.trigger('change');
    });
  });

  return this;
};

$.jsoneditor = {
  template: null,
  theme:null,
  iconlib: null,
  editors: {},
  templates: {},
  themes: {},
  iconlibs: {},
  resolvers: [],
  custom_validators: [],

  getEditorClass: function(schema, editor) {
    var classname;

    $.each($.jsoneditor.resolvers,function(i,resolver) {
      var tmp;
      if(tmp = resolver(schema)) {
        if($.jsoneditor.editors[tmp]) {
          classname = tmp;
          return false;
        }
      }
    });

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
  init: function(schema, options) {
    this.original_schema = schema;
    this.options = options || {};
    this.refs = this.options.refs || {};

    // Store any $ref and definitions
    this.ready_callbacks = [];

    if(this.options.ready) this.ready(this.options.ready);
    this.getRefs();
  },
  ready: function(callback) {
    if(this.is_ready) callback.apply(self,[this.expanded]);
    else {
      this.ready_callbacks.push(callback);
    }

    return this;
  },
  getRefs: function() {
    var self = this;
    this._getRefs(this.original_schema, function(schema) {
      self.schema = schema;
      self.expanded = self.expandSchema(self.schema);

      self.is_ready = true;
      $.each(self.ready_callbacks,function(i,callback) {
        callback.apply(self,[self.expanded]);
      });
    });
  },
  _getRefs: function(schema,callback) {
    var self = this;
    var is_root = schema === this.original_schema;

    var waiting, finished, check_if_finished, called;

    // Work on a deep copy of the schema
    schema = $.extend(true,{},schema);

    // First expand out any definition in the root node
    if(is_root && schema.definitions) {
      var defs = schema.definitions;
      delete schema.definitions;

      waiting = finished = 0;
      check_if_finished = function(schema) {
        if(finished >= waiting) {
          if(called) return;
          called = true;
          self._getRefs(schema,callback);
        }
      };

      $.each(defs,function() {
        waiting++;
      });

      if(waiting) {
        $.each(defs,function(i,definition) {
          // Expand the definition recursively
          self._getRefs(definition,function(def_schema) {
            self.refs['#/definitions/'+i] = def_schema;
            finished++;
            check_if_finished(schema);
          });
        });
      }
      else {
        check_if_finished(schema);
      }
    }
    // Expand out any references
    else if(schema['$ref']) {
      var ref = schema['$ref'];
      delete schema['$ref'];

      // If we're currently loading this external reference, wait for it to be done
      if(self.refs[ref] && self.refs[ref] instanceof Array) {
        self.refs[ref].push(function() {
          schema = $.extend(true,{},self.refs[ref],schema);
          callback(schema);
        });
      }
      // If this reference has already been loaded
      else if(self.refs[ref]) {
        schema = $.extend(true,{},self.refs[ref],schema);
        callback(schema);
      }
      // Otherwise, it needs to be loaded via ajax
      else {
        if(!self.options.ajax) throw "Must set ajax option to true to load external url "+ref;

        $.getJSON(ref,function(response) {
          self.refs[ref] = [];

          // Recursively expand this schema
          self._getRefs(response, function(ref_schema) {
            var list = self.refs[ref];
            self.refs[ref] = ref_schema;
            schema = $.extend(true,{},self.refs[ref],schema);
            callback(schema);

            // If anything is waiting on this to load
            $.each(list,function(i,v) {
              v();
            });
          });
        })
          .fail(function() {
            throw "Failed to fetch ref via ajax- "+ref;
          })
      }
    }
    // Expand out any subschemas
    else {
      waiting = finished = 0;
      check_if_finished = function(schema) {
        if(finished >= waiting) {
          if(called) return;
          called = true;

          callback(schema);
        }
      };

      $.each(schema, function(key, value) {
        // Arrays that need to be expanded
        if(typeof value === "object" && value && value instanceof Array) {
          $.each(value,function(j,item) {
            if(typeof item === "object" && item && !(item instanceof Array)) {
              waiting++;
            }
          });
        }
        // Objects that need to be expanded
        else if(typeof value === "object" && value) {
          waiting++;
        }
      });

      if(waiting) {
        $.each(schema, function(key, value) {
          // Arrays that need to be expanded
          if(typeof value === "object" && value && value instanceof Array) {
            $.each(value,function(j,item) {
              if(typeof item === "object" && item && !(item instanceof Array)) {
                self._getRefs(item,function(expanded) {
                  schema[key][j] = expanded;

                  finished++;
                  check_if_finished(schema);
                });
              }
            });
          }
          // Objects that need to be expanded
          else if(typeof value === "object" && value) {
            self._getRefs(value,function(expanded) {
              schema[key] = expanded;

              finished++;
              check_if_finished(schema);
            });
          }
        });
      }
      else {
        check_if_finished(schema);
      }
    }
  },
  validate: function(value) {
    return this._validateSchema(this.schema, value);
  },
  _validateSchema: function(schema,value,path) {
    var errors = [];
    var valid, i, j;
    var stringified = JSON.stringify(value);

    path = path || 'root';

    // Work on a copy of the schema
    schema = $.extend(true,{},schema);

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
    // Value not defined
    else if(typeof value === "undefined") {
      // If required_by_default is set, all fields are required
      if(this.options.required_by_default) {
        errors.push({
          path: path,
          property: 'required',
          message: 'Property must be set'
        });
      }
      // Not required, no further validation needed
      else {
        return errors;
      }
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
      var oneof_errors = [];
      for(i=0; i<schema.oneOf.length; i++) {
        // Set the error paths to be path.oneOf[i].rest.of.path
        var tmp = this._validateSchema(schema.oneOf[i],value,path);
        if(!tmp.length) {
          valid++;
        }

        for(var j=0; j<tmp.length; j++) {
          tmp[j].path = path+'.oneOf['+i+']'+tmp[j].path.substr(path.length);
        }
        oneof_errors = oneof_errors.concat(tmp);

      }
      if(valid !== 1) {
        errors.push({
          path: path,
          property: 'oneOf',
          message: 'Value must validate against exactly one of the provided schemas. '+
            'It currently validates against '+valid+' of the schemas.'
        });
        errors = errors.concat(oneof_errors);
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

    // Number Specific Validation
    if(typeof value === "number") {
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
    }
    // String specific validation
    else if(typeof value === "string") {
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
    }
    // Array specific validation
    else if(typeof value === "object" && value !== null && value instanceof Array) {
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
    // Object specific validation
    else if(typeof value === "object" && value !== null) {
      // `maxProperties`
      if(schema.maxProperties) {
        valid = 0;
        for(i in value) {
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
          for(j in value) {
            if(!value.hasOwnProperty(j)) continue;
            if(regex.test(j)) {
              validated_properties[j] = true;
              errors = errors.concat(this._validateSchema(schema.patternProperties[i],value[j],path+'.'+j));
            }
          }
        }
      }

      // The no_additional_properties option currently doesn't work with extended schemas that use oneOf or anyOf
      if(typeof schema.additionalProperties === "undefined" && this.options.no_additional_properties && !schema.oneOf && !schema.anyOf) {
        schema.additionalProperties = false;
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
            for(j=0; j<schema.dependencies[i].length; j++) {
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

    // Custom type validation
    $.each($.jsoneditor.custom_validators,function(i,validator) {
      errors = errors.concat(validator(schema,value,path));
    });

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
  },
  expandSchema: function(schema) {
    var self = this;
    var extended = schema;
    var i;

    // Version 3 `type`
    if(typeof schema.type === 'object') {
      // Array of types
      if(schema.type instanceof Array) {
        $.each(schema.type, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.type[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.type = self.expandSchema(schema.type);
      }
    }
    // Version 3 `disallow`
    if(typeof schema.disallow === 'object') {
      // Array of types
      if(schema.disallow instanceof Array) {
        $.each(schema.disallow, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.disallow[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.disallow = self.expandSchema(schema.disallow);
      }
    }
    // Version 4 `anyOf`
    if(schema.anyOf) {
      $.each(schema.anyOf, function(key,value) {
        schema.anyOf[key] = self.expandSchema(value);
      })
    }
    // Version 4 `dependencies` (schema dependencies)
    if(schema.dependencies) {
      $.each(schema.dependencies,function(key,value) {
        if(typeof value === "object" && !(value instanceof Array)) {
          schema.dependencies[key] = self.expandSchema(value);
        }
      });
    }
    // `items`
    if(schema.items) {
      // Array of items
      if(schema.items instanceof Array) {
        $.each(schema.items, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.items[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.items = self.expandSchema(schema.items);
      }
    }
    // `properties`
    if(schema.properties) {
      $.each(schema.properties,function(key,value) {
        if(typeof value === "object" && !(value instanceof Array)) {
          schema.properties[key] = self.expandSchema(value);
        }
      });
    }
    // `patternProperties`
    if(schema.patternProperties) {
      $.each(schema.patternProperties,function(key,value) {
        if(typeof value === "object" && !(value instanceof Array)) {
          schema.patternProperties[key] = self.expandSchema(value);
        }
      });
    }
    // Version 4 `not`
    if(schema.not) {
      schema.not = this.expandSchema(schema.not);
    }
    // `additionalProperties`
    if(schema.additionalProperties && typeof schema.additionalProperties === "object") {
      schema.additionalProperties = self.expandSchema(schema.additionalProperties);
    }
    // `additionalItems`
    if(schema.additionalItems && typeof schema.additionalItems === "object") {
      schema.additionalItems = self.expandSchema(schema.additionalItems);
    }

    // allOf schemas should be merged into the parent
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        extended = this.extend(extended,this.expandSchema(schema.allOf[i]));
      }
      delete extended.allOf;
    }
    // extends schemas should be merged into parent
    if(schema.extends) {
      // If extends is a schema
      if(!(schema.extends instanceof Array)) {
        extended = this.extend(extended,this.expandSchema(schema.extends));
      }
      // If extends is an array of schemas
      else {
        for(i=0; i<schema.extends.length; i++) {
          extended = this.extend(extended,this.expandSchema(schema.extends[i]));
        }
      }
      delete extended.extends;
    }
    // parent should be merged into oneOf schemas
    if(schema.oneOf) {
      var tmp = $.extend(true,{},extended);
      delete tmp.oneOf;
      for(i=0; i<schema.oneOf.length; i++) {
        extended.oneOf[i] = this.extend(this.expandSchema(schema.oneOf[i]),tmp);
      }
    }

    return extended;
  },
  extend: function(obj1, obj2) {
    obj1 = $.extend(true,{},obj1);
    obj2 = $.extend(true,{},obj2);

    var self = this;
    var extended = {};
    $.each(obj1, function(prop,val) {
      // If this key is also defined in obj2, merge them
      if(typeof obj2[prop] !== "undefined") {
        // Required arrays should be unioned together
        if(prop === 'required' && typeof val === "object" && val instanceof Array) {
          // Union arrays and unique
          extended.required = val.concat(obj2[prop]).reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
          }, []);
        }
        // Type should be intersected and is either an array or string
        else if(prop === 'type') {
          // Make sure we're dealing with arrays
          if(typeof val !== "object") val = [val];
          if(typeof obj2.type !== "object") obj2.type = [obj2.type];


          extended.type = val.filter(function(n) {
            return obj2.type.indexOf(n) !== -1
          });

          // If there's only 1 type and it's a primitive, use a string instead of array
          if(extended.type.length === 1 && typeof extended.type[0] === "string") {
            extended.type = extended.type[0];
          }
        }
        // All other arrays should be intersected (enum, etc.)
        else if(typeof val === "object" && val instanceof Array){
          extended[prop] = val.filter(function(n) {
            return obj2[prop].indexOf(n) !== -1
          });
        }
        // Objects should be recursively merged
        else if(typeof val === "object" && val !== null) {
          extended[prop] = self.extend(val,obj2[prop]);
        }
        // Otherwise, use the first value
        else {
          extended[prop] = val;
        }
      }
      // Otherwise, just use the one in obj1
      else {
        extended[prop] = val;
      }
    });
    // Properties in obj2 that aren't in obj1
    $.each(obj2, function(prop,val) {
      if(typeof obj1[prop] === "undefined") {
        extended[prop] = val;
      }
    });

    return extended;
  }
});

/**
 * All editors should extend from this class
 */
$.jsoneditor.AbstractEditor = Class.extend({
  init: function(options) {
    var self = this;
    this.container = options.container;
    this.jsoneditor = options.jsoneditor;

    this.theme = this.jsoneditor.data('jsoneditor').theme;
    this.template_engine = this.jsoneditor.data('jsoneditor').template;
    this.iconlib = this.jsoneditor.data('jsoneditor').iconlib;

    this.options = $.extend(true, {}, (this.options || {}), (options.schema.options || {}), options);
    this.schema = this.options.schema;

    if(!options.path && !this.schema.id) this.schema.id = 'root';
    this.path = options.path || 'root';
    if(this.schema.id) this.container.attr('data-schemaid',this.schema.id);
    if(this.schema.type && typeof this.schema.type === "string") this.container.attr('data-schematype',this.schema.type);
    this.container.attr('data-schemapath',this.path);
    this.container.data('editor',this);

    this.key = this.path.split('.').pop();
    this.parent = options.parent;
    
    // If not required, add an add/remove property link
    if(!this.isRequired() && !this.options.compact) {
      this.title_links = this.theme.getFloatRightLinkHolder().appendTo(this.container);

      this.addremove = this.theme.getLink('remove '+this.getTitle()).appendTo(this.title_links);

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
    
    // Watched fields
    this.watched = {};
    if(this.schema.vars) this.schema.watch = this.schema.vars;
    this.watched_values = {};
    if(this.schema.watch) {
      self.watch_listener_timer = 0;
      this.watch_listener = function() {
        window.clearTimeout(self.watch_listener_timer);
        self.watch_listener_timer = window.setTimeout(function() {
          if(!self.watched) return;
          if(self.refreshWatchedFieldValues()) {
            self.onWatchedFieldChange();
          }
        });
      };
      $.each(this.schema.watch, function(name, path) {
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
        if(!root.length) throw "Could not find ancestor node with id "+first;

        // Keep track of the root node and path for use when rendering the template
        var adjusted_path = root.data('editor').path + '.' + path_parts.join('.');
        self.watched[name] = {
          root: root,
          path: path_parts,
          adjusted_path: adjusted_path
        };

        // Listen for changes to the variable field
        root.on('change',self.watch_listener);
        root.on('set',self.watch_listener);
      });
    }

    this.build();
    
    this.setValue(this.getDefault(), true);

    if(this.watch_listener) {
      this.watch_listener();
    }
  },
  getButton: function(text, icon, title) {
    if(!this.iconlib) icon = null;
    else icon = this.iconlib.getIcon(icon);
    
    if(!icon && title) {
      text = title;
      title = null;
    }
    
    return this.theme.getButton(text, icon, title);
  },
  setButtonText: function(button, text, icon, title) {
    if(!this.iconlib) icon = null;
    else icon = this.iconlib.getIcon(icon);
    
    if(!icon && title) {
      text = title;
      title = null;
    }
    
    return this.theme.setButtonText(button, text, icon, title);
  },
  refreshWatchedFieldValues: function() {
    var watched = {};
    var changed = false;
    var self = this;
    $.each(this.watched,function(name,attr) {
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
      if(self.watched_values[name] !== val) changed = true;
      watched[name] = val;
    });
    
    this.watched_values = watched;
    
    return changed;
  },
  getWatchedFieldValues: function() {
    return this.watched_values;
  },
  onWatchedFieldChange: function() {
    
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
    var self = this;
    $.each(this.watched,function(name,attr) {
      attr.root.off('change',self.watch_listener);
      attr.root.off('set',self.watch_listener);
    });
    this.watched = null;
    this.watched_values = null;
    this.watch_listener = null;
    this.value = null;
    this.container = null;
    this.jsoneditor = null;
    this.schema = null;
    this.path = null;
    this.key = null;
    this.parent = null;
  },
  isRequired: function() {
    if(typeof this.options.required !== "undefined") {
      return this.options.required;
    }
    else if(typeof this.schema.required === "boolean") {
      return this.schema.required;
    }
    else if(this.jsoneditor.data('jsoneditor').options.required_by_default) {
      return true
    }
    else {
      return false;
    }
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
  },
  getDisplayText: function(arr) {
    var disp = [];
    var used = {};
    
    // Determine display text for each element of the array
    $.each(arr,function(i,el)  {
      var name;
      
      // If it's a simple string
      if(typeof el === "string") name = el;
      // Object
      else if(el.title && !used[el.title]) name = el.title;
      else if(el.format && !used[el.format]) name = el.format;
      else if(el.description && !used[el.description]) name = el.descripton;
      else if(el.type && !used[el.type]) name = el.type;
      else if(el.title) name = el.title;
      else if(el.format) name = el.format;
      else if(el.description) name = el.description;
      else if(el.type) name = el.type;
      else if(JSON.stringify(el).length < 50) name = JSON.stringify(el);
      else name = "type";
      
      used[name] = used[name] || 0;
      used[name]++;
      
      disp.push(name);
    });
    
    // Replace identical display text with "text 1", "text 2", etc.
    var inc = {};
    $.each(disp,function(i,name) {
      inc[name] = inc[name] || 0;
      inc[name]++;
      
      if(used[name] > 1) disp[i] = name + " " + inc[name];
    });
    
    return disp;
  },
  showValidationErrors: function(errors) {

  }
});

$.jsoneditor.editors.null = $.jsoneditor.AbstractEditor.extend({
  getValue: function() {
    return null;
  },
  setValue: function() {
    this.container.trigger('set');
  }
});

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
    if(!this.getOption('compact',false)) this.label = this.theme.getFormInputLabel(this.getTitle());
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

      // If it should start collapsed
      if(this.options.collapsed) {
        this.toggle_button.trigger('click');
      }
      
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

$.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  addProperty: function() {
    this._super();
    this.row_holder.show(500);
    if(this.tabs_holder) this.tabs_holder.show(500);
    this.controls.show(500);
    this.title_controls.show(500);
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.row_holder.hide(500);
    if(this.tabs_holder) this.tabs_holder.hide(500);
    this.controls.hide(500);
    this.title_controls.hide(500);
    this.theme.disableHeader(this.title);
  },
  build: function() {
    this.rows = [];
    var self = this;

    if(!this.getOption('compact',false)) {
      this.title = this.theme.getHeader(this.getTitle()).appendTo(this.container);
      this.title_controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
      if(this.schema.description) this.description = this.theme.getDescription(this.schema.description).appendTo(this.container);
      this.error_holder = $("<div></div>").appendTo(this.container);

      if(this.schema.format === 'tabs') {
        this.controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
        this.tabs_holder = this.theme.getTabHolder().appendTo(this.container);
        this.row_holder = this.theme.getTabContentHolder(this.tabs_holder);

        this.active_tab = null;
      }
      else {
        this.panel = this.theme.getIndentedPanel().appendTo(this.container);
        this.row_holder = $("<div>").appendTo(this.panel);
        this.controls = this.theme.getButtonHolder().appendTo(this.panel);
      }
    }
    else {
      this.panel = this.theme.getIndentedPanel().appendTo(this.container);
      this.controls = this.theme.getButtonHolder().appendTo(this.panel);
      this.row_holder = $("<div>").appendTo(this.panel);
    }

    this.row_holder.on('change',function() {
      self.refreshValue();
    });
    
    // Add controls
    this.addControls();
  },
  getItemTitle: function() {
    return (this.schema.items && this.schema.items.title) || 'item';
  },
  getItemSchema: function(i) {
    if(this.schema.items instanceof Array) {
      if(i >= this.schema.items.length) {
        if(this.schema.additionalItems===true) {
          return {};
        }
        else if(this.schema.additionalItems) {
          return $.extend(true,{},this.schema.additionalItems);
        }
      }
      else {
        return $.extend(true,{},this.schema.items[i]);
      }
    }
    else if(this.schema.items) {
      return $.extend(true,{},this.schema.items);
    }
    else {
      return {};
    }
  },
  getItemInfo: function(i) {
    // Get the schema for this item
    var schema = this.getItemSchema(i);
    
    // Check if it's cached
    this.item_info = this.item_info || {};
    var stringified = JSON.stringify(schema);
    if(typeof this.item_info[stringified] !== "undefined") return this.item_info[stringified];
    
    // Create a temporary editor with this schema and get info
    var tmp = $("<div>").appendTo(this.container);
    
    // Ignore events on this temporary editor
    tmp.on('change set',function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    var editor = $.jsoneditor.getEditorClass(schema, this.jsoneditor);
    editor = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: tmp,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });
    this.item_info[stringified] = {
      child_editors: editor.getChildEditors()? true : false,
      title: schema.title || 'item',
      default: editor.getDefault()
    };
    editor.destroy();
    tmp.remove();
    
    return this.item_info[stringified];
  },
  getElementEditor: function(i) {
    var item_info = this.getItemInfo(i);
    var schema = this.getItemSchema(i);
    schema.title = item_info.title+' '+i;

    var editor = $.jsoneditor.getEditorClass(schema, this.jsoneditor);

    var holder;
    if(this.tabs_holder) {
      holder = this.theme.getTabContent();
    }
    else if(item_info.child_editors) {
      holder = this.theme.getChildEditorHolder();
    }
    else {
      holder = this.theme.getIndentedPanel();
    }

    holder.appendTo(this.row_holder);

    var ret = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });

    if(!ret.title_controls) {
      ret.array_controls = this.theme.getButtonHolder().appendTo(holder);
    }
    
    return ret;
  },
  destroy: function() {
    this.empty();
    if(this.title) this.title.remove();
    if(this.description) this.description.remove();
    if(this.row_holder) this.row_holder.remove();
    if(this.controls) this.controls.remove();
    if(this.panel) this.panel.remove();
    
    this.rows = this.title = this.description = this.row_holder = this.panel = this.controls = null;

    this._super();
  },
  empty: function() {
    if(!this.rows) return;
    var self = this;
    $.each(this.rows,function(i,row) {
      self.destroyRow(row);
      self.rows[i] = null;
    });
    self.rows = [];

  },
  destroyRow: function(row) {
    var holder = row.container;
    if(row.tab) row.tab.remove();
    row.destroy();
    holder.remove();
  },
  getMax: function() {
    if((this.schema.items instanceof Array) && this.schema.additionalItems == false) {
      return Math.min(this.schema.items.length,this.schema.maxItems || Infinity);
    }
    else {
      return this.schema.maxItems || Infinity;
    }
  },
  refreshTabs: function() {
    var self = this;
    $.each(this.rows, function(i,row) {
      if(!row.tab) return;

      if(row.tab === self.active_tab) {
        self.theme.markTabActive(row.tab);
        row.container.show();
      }
      else {
        self.theme.markTabInactive(row.tab);
        row.container.hide();
      }
    });
  },
  setValue: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];
    
    if(!(value instanceof Array)) value = [value];

    // Make sure value has between minItems and maxItems items in it
    if(this.schema.minItems) {
      while(value.length < this.schema.minItems) {
        value.push(this.getItemInfo(value.length).default);
      }
    }
    if(this.getMax() && value.length > this.getMax()) {
      value = value.slice(0,this.getMax());
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
      self.destroyRow(self.rows[j]);
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    // Set the active tab
    var new_active_tab = null;
    $.each(self.rows, function(i,row) {
      if(row.tab === self.active_tab) {
        new_active_tab = row.tab;
        return false;
      }
    });
    if(!new_active_tab && self.rows.length) new_active_tab = self.rows[0].tab;

    self.active_tab = new_active_tab;

    self.refreshValue();
    self.refreshTabs();
    
    self.container.trigger('set');
    
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
    if(this.getMax() && this.getMax() <= this.rows.length) {
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

    if(self.tabs_holder) {
      self.rows[i].tab = self.theme.getTab(this.getItemInfo(i).title+" "+i)
        .on('click', function() {
          self.active_tab = self.rows[i].tab;
          self.refreshTabs();
          return false;
        });

      self.theme.addTab(self.tabs_holder, self.rows[i].tab);
    }
    
    // Buttons to delete row, move row up, and move row down
    self.rows[i].delete_button = this.getButton(self.getItemTitle(),'delete','Delete '+self.getItemTitle())
      .addClass('delete')
      .data('i',i)
      .on('click',function() {
        var i = $(this).data('i');

        var value = self.getValue();

        var newval = [];
        var new_active_tab = null;
        $.each(value,function(j,row) {
          if(j===i) {
            // If the one we're deleting is the active tab
            if(self.rows[j].tab === self.active_tab) {
              // Make the next tab active if there is one
              if(self.rows[j+1]) new_active_tab = self.rows[j+1].tab;
              // Otherwise, make the previous tab active if there is one
              else if(j) new_active_tab = self.rows[j-1].tab;
            }
            
            return; // If this is the one we're deleting
          }
          newval.push(row);
        });
        self.setValue(newval);
        if(new_active_tab) {
          self.active_tab = new_active_tab;
          self.refreshTabs();
        }
        
        self.container.trigger('change');
      });
    self.rows[i].moveup_button = this.getButton('','moveup','Move up')
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
        self.active_tab = self.rows[i-1].tab;
        self.refreshTabs();

        self.container.trigger('change');
      });
    self.rows[i].movedown_button = this.getButton('','movedown','Move down')
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
        self.active_tab = self.rows[i+1].tab;
        self.refreshTabs();
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
    this.toggle_button = this.getButton('','collapse','Collapse').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.row_holder.show(300);
        if(self.tabs_holder) self.tabs_holder.show(300);
        self.controls.show(300);
        self.setButtonText($(this),'','collapse','Collapse');
      }
      else {
        self.collapsed = true;
        self.row_holder.hide(300);
        if(self.tabs_holder) self.tabs_holder.hide(300);
        self.controls.hide(300);
        self.setButtonText($(this),'','expand','Expand');
      }
    });

    // If it should start collapsed
    if(this.options.collapsed) {
      this.toggle_button.trigger('click');
    }
    
    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle())
      .on('click',function() {
        self.addRow();
        self.active_tab = self.rows[self.rows.length-1].tab;
        self.refreshTabs();
        self.refreshValue();
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.delete_last_row_button = this.getButton('Last '+this.getItemTitle(),'delete','Delete Last '+this.getItemTitle())
      .on('click',function() {
        var rows = self.getValue();
        
        var new_active_tab = null;
        if(self.rows.length > 1 && self.rows[self.rows.length-1].tab === self.active_tab) new_active_tab = self.rows[self.rows.length-2].tab;
        
        rows.pop();
        self.setValue(rows);
        if(new_active_tab) {
          self.active_tab = new_active_tab;
          self.refreshTabs();
        }
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.remove_all_rows_button = this.getButton('All','delete','Delete All')
      .on('click',function() {
        self.setValue([]);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    if(self.tabs) {
      this.add_row_button.css({
        width: '100%',
        textAlign: 'left',
        marginBottom: 3
      });
      this.delete_last_row_button.css({
        width: '100%',
        textAlign: 'left',
        marginBottom: 3
      });
      this.remove_all_rows_button.css({
        width: '100%',
        textAlign: 'left',
        marginBottom: 3
      });

      // Make rows sortable
      this.tabs
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

    // Show errors for child editors
    $.each(this.rows, function(i,row) {
      row.showValidationErrors(other_errors);
    });
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

    this.table = this.theme.getTable().appendTo(this.container);
    this.thead = this.theme.getTableHead().appendTo(this.table);
    this.header_row = this.theme.getTableRow().appendTo(this.thead);
    this.row_holder = this.theme.getTableBody().appendTo(this.table);

    // Determine the default value of array element
    var tmp = this.getElementEditor(0,true);
    this.item_default = tmp.getDefault();
    this.item_title = this.schema.items.title || 'row';

    // Build header row for table
    if(tmp.getChildEditors()) {
      this.item_has_child_editors = true;      
    }
    
    if(!this.getOption('compact',false)) {
      this.title = this.theme.getHeader(this.getTitle()).appendTo(this.container);
      this.title_controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
      this.panel = this.theme.getIndentedPanel().appendTo(this.container);
      if(this.schema.description) this.description = this.theme.getDescription(this.schema.description).appendTo(this.panel);
      this.error_holder = $("<div></div>").appendTo(this.panel);
    }
    else {
      this.panel = $("<div>").appendTo(this.container);
    }

    this.table.appendTo(this.panel);
    this.controls = this.theme.getButtonHolder().appendTo(this.panel);

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
  getElementEditor: function(i,ignore) {
    var schema_copy = $.extend({},this.schema.items);
    var editor = $.jsoneditor.getEditorClass(schema_copy, this.jsoneditor);
    var row = this.theme.getTableRow().appendTo(this.row_holder);
    var holder = this.item_has_child_editors? row : this.theme.getTableCell().appendTo(row);

    if(ignore) {
      holder.on('change set',function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }

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
    ret.table_controls = this.theme.getButtonHolder().appendTo(ret.controls_cell).css({
      margin: 0,
      padding: 0
    });

    return ret;
  },
  destroy: function() {
    this.empty();
    if(this.title) this.title.remove();
    if(this.description) this.description.remove();
    if(this.row_holder) this.row_holder.remove();
    this.table.remove();
    if(this.panel) this.panel.remove();

    this.rows = this.title = this.description = this.row_holder = this.table = this.panel = null;

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
    
    self.container.trigger('set');

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
    self.rows[i].delete_button = this.getButton('','delete','Delete')
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
    self.rows[i].moveup_button = this.getButton('','moveup','Move up')
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
    self.rows[i].movedown_button = this.getButton('','movedown','Move down')
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
    this.toggle_button = this.getButton('','collapse','Collapse').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.panel.show(300);
        self.setButtonText($(this),'','collapse','Collapse');
      }
      else {
        self.collapsed = true;
        self.panel.hide(300);
        self.setButtonText($(this),'','expand','Expand');
      }
    });

    // If it should start collapsed
    if(this.options.collapsed) {
      this.toggle_button.trigger('click');
    }

    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle())
      .on('click',function() {
        self.addRow();
        self.refreshValue();
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.delete_last_row_button = this.getButton('Last '+this.getItemTitle(),'delete','Delete Last '+this.getItemTitle())
      .on('click',function() {
        var rows = self.getValue();
        rows.pop();
        self.setValue(rows);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.remove_all_rows_button = this.getButton('All','delete','Delete All')
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

// Enum Editor (used for objects and arrays with enumerated values)
$.jsoneditor.editors.enum = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.enum[0];
  },
  addProperty: function() {
    this._super();
    this.display_area.show(500);
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.display_area.hide(500);
    this.theme.disableHeader(this.title);
  },
  build: function() {
    var container = this.getContainer();
    this.title = this.getTheme().getHeader(this.getTitle()).appendTo(this.container);

    this.options.enum_titles = this.options.enum_titles || [];

    this.enum = this.schema.enum;
    this.selected = 0;
    this.select_options = [];
    this.html_values = [];

    var self = this;
    for(var i=0; i<this.enum.length; i++) {
      this.select_options[i] = this.options.enum_titles[i] || "Value "+(i+1);
      this.html_values[i] = this.getHTML(this.enum[i]);
    }

    // Switcher
    this.switcher = this.theme.getSelectInput(this.select_options).appendTo(this.container).css({
      float: 'right',
      marginBottom: 0
    });

    // Display area
    this.display_area = this.theme.getIndentedPanel().appendTo(this.container);

    this.switcher.on('change',function() {
      self.selected = self.select_options.indexOf($(this).val());
      self.value = self.enum[self.selected];
      self.refreshValue();
      self.container.trigger('change');
    });
    this.value = this.enum[0];
    this.refreshValue();

    if(this.enum.length === 1) this.switcher.hide();
  },
  refreshValue: function() {
    var self = this;
    self.selected = -1;
    var stringified = JSON.stringify(this.value);
    $.each(this.enum, function(i, el) {
      if(stringified === JSON.stringify(el)) {
        self.selected = i;
        return false;
      }
    });

    if(self.selected<0) {
      self.setValue(self.enum[0]);
      return;
    }

    this.switcher.val(this.select_options[this.selected]);
    this.display_area.empty().append(this.html_values[this.selected]);
  },
  getHTML: function(el) {
    var self = this;

    if(el === null) {
      return '<em>null</em>';
    }
    // Array or Object
    else if(typeof el === "object") {
      // TODO: use theme
      var ret;
      if(el instanceof Array) ret = $("<ol></ol>");
      else ret = $("<ul></ul>");

      $.each(el,function(i,child) {
        var html = self.getHTML(child);

        // Add the keys to object children
        if(!(el instanceof Array)) {
          // TODO: use theme
          html = $("<div></div>").append($("<strong></strong>").text(i)).append(': ').append(html);
        }

        // TODO: use theme
        ret.append($("<li></li>").append(html));
      });

      return ret;
    }
    // Boolean
    else if(typeof el === "boolean") {
      return el? 'true' : 'false';
    }
    // String or Number
    else {
      return el;
    }
  },
  setValue: function(val) {
    this.value = val;
    this.refreshValue();

    this.container.trigger('change set');
  },
  destroy: function() {
    this.display_area.remove();
    this.title.remove();
    this.switcher.remove();

    this._super();
  }
});

$.jsoneditor.editors.select = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || '';
  },
  setValue: function(value,initial) {
    value = this.typecast(value||'');

    // Sanitize value before setting it
    var sanitized = value;
    if(this.enum_values.indexOf(sanitized) < 0) {
      sanitized = this.enum_values[0];
    }

    this.input.val(this.enum_options[this.enum_values.indexOf(sanitized)]);
    this.value = sanitized;

    if(sanitized !== value) this.input.trigger('change');

    this.input.trigger('set');
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

    this.input_type = 'select';
    this.enum_options = [];
    this.enum_values = [];

    // Enum options enumerated
    if(this.schema.enum) {
      $.each(this.schema.enum,function(i,option) {
        self.enum_options[i] = ""+option;
        self.enum_values[i] = self.typecast(option);
      });
    }
    // Boolean
    else if(this.schema.type === "boolean") {
      self.enum_options = ['true','false'];
      self.enum_values = [true,false];
    }
    // Other, not supported
    else {
      throw "'select' editor requires the enum property to be set."
    }

    if(this.getOption('compact')) this.container.addClass('compact');

    this.input = this.theme.getSelectInput(this.enum_options);

    if(this.schema.readOnly || this.schema.readonly) this.input.prop('disabled',true);

    this.input
      .attr('data-schemapath',this.path)
      .attr('data-schematype',this.schema.type)
      .on('change keyup',function(e) {
        var val = $(this).val();

        var sanitized = val;
        if(self.enum_options.indexOf(val) === -1) {
          sanitized = self.enum_options[0];
        }

        self.value = self.enum_values[self.enum_options.indexOf(val)];
      });

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description).appendTo(this.container);

    this.value = this.enum_values[0];

    // If the Select2 library is loaded use it when we have lots of items
    if($.fn.select2 && this.enum_options.length > 2) {
      this.input.select2();
    }

    self.theme.afterInputReady(self.input);
  },
  destroy: function() {
    if(this.label) this.label.remove();
    if(this.description) this.description.remove();
    this.input.remove();

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
    if(options) this.setSelectOptions(select, options);
    return select;
  },
  setSelectOptions: function(select, options) {
    select.empty();
    $.each(options, function(i,val) {
      select.append($("<option>").attr('value',val).text(val));
    });
  },
  getTextareaInput: function() {
    return $("<textarea>").css({
      width: '100%',
      height: 300,
      boxSizing: 'border-box'
    });
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
    return $("<div>").addClass('form-control')
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
  getButton: function(text, icon, title) {    
    var button = $("<button>").text(text);
    if(icon) button.prepend(' ').prepend(icon);
    if(title) button.attr('title',title);
    
    return button;
  },
  setButtonText: function(button, text, icon, title) {
    button.text(text);
    if(icon) button.prepend(' ').prepend(icon);
    if(title) button.attr('title',title);
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
  },
  getErrorMessage: function(text) {
    return $("<p style='color: red;'></p>").text(text);
  },
  addInputError: function(input, text) {
  },
  removeInputError: function(input) {
  },
  addTableRowError: function(row) {
  },
  removeTableRowError: function(row) {
  },
  getTabHolder: function() {
    return $("<div><div style='float: left; width: 130px;' class='tabs'></div><div class='content' style='margin-left: 130px;'></div></div>").append($("<div>").css('clear','both'));
  },
  getTab: function(text) {
    return $("<div></div>")
      .text(text)
      .css({
        border: '1px solid #ccc',
        borderWidth: '1px 0 1px 1px',
        textAlign: 'center',
        lineHeight: '30px',
        borderRadius: 5,
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
        fontWeight: 'bold',
        cursor: 'pointer'
      });
  },
  getTabContentHolder: function(tab_holder) {
    return $("> .content",tab_holder)
  },
  getTabControls: function(holder) {
    return $("> .controls",holder);
  },
  getTabContent: function() {
    return this.getIndentedPanel();
  },
  markTabActive: function(tab) {
    tab.css({
      opacity: 1,
      background: 'white'
    });
  },
  markTabInactive: function(tab) {
    tab.css({
      opacity:.5,
      background: ''
    });
  },
  addTab: function(holder, tab) {
    $("> .tabs",holder).append(tab);
  },
  addTabControls: function(tab_holder, controls) {
    tab_holder.append(controls);
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
  getButton: function(text, icon, title) {
    return this._super(text, icon, title).addClass('btn btn-default');
  },
  getTable: function() {
    return $("<table></table>").addClass('table table-bordered').css({
      width: 'auto',
      maxWidth: 'none'
    });
  },
  addInputError: function(input,text) {
    var controls = $('.controls',input.closest('.control-group').addClass('error'));
    var errmsg = $('.errormsg',controls);
    if(!errmsg.length) errmsg = $("<p class='help-block errormsg'>").appendTo(controls);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.control-group').removeClass('error')).remove();
  },
  getTabHolder: function() {
    return $("<div class='tabbable tabs-left'><ul class='nav nav-tabs'></ul><div class='tab-content'></div></div>");
  },
  getTab: function(text) {
    return $("<li><a href='#'>"+text+"</a></li>");
  },
  getTabContentHolder: function(tab_holder) {
    return $("> .tab-content",tab_holder)
  },
  getTabContent: function() {
    return $("<div class='tab-pane active'></div>");
  },
  markTabActive: function(tab) {
    tab.addClass('active');
  },
  markTabInactive: function(tab) {
    tab.removeClass('active');
  },
  addTab: function(holder, tab) {
    $("> .nav-tabs",holder).append(tab);
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
    return this._super(type).addClass('form-control');
  },
  getFormControl: function(label, input, description) {
    var group = $("<div></div>");

    if(label && input.attr('type') === 'checkbox') {
      group.addClass('checkbox');
      label.append(input).appendTo(group);
    } 
    else {
      group.addClass('form-group');
      if(label) label.appendTo(group).addClass('control-label');
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
  getButton: function(text, icon, title) {
    return this._super(text, icon, title).addClass('btn btn-default');
  },
  getTable: function() {
    return $("<table>").addClass("table table-bordered").css({
      width: 'auto',
      maxWidth: 'none'
    });
  },
  addInputError: function(input,text) {
    var group = input.closest('.form-group').addClass('has-error');
    var errmsg = $('.errormsg',group);
    if(!errmsg.length) errmsg = $("<p class='help-block errormsg'>").appendTo(group);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.form-group').removeClass('has-error')).remove();
  },
  getTabHolder: function() {
    var holder = this._super();
    $("> .tabs",holder).addClass('list-group');
    return holder;
  },
  getTab: function(text) {
    return $("<a href='#' class='list-group-item'>").text(text);
  },
  markTabActive: function(tab) {
    tab.addClass('active');
  },
  markTabInactive: function(tab) {
    tab.removeClass('active');
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
    return this._super(options).css({
      width: 'auto',
      minWidth: 'none',
      padding: 5,
      marginTop: 3
    });
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
  getButton: function(text, icon, title) {
    return this._super(text, icon, title).addClass('small button');
  },
  addInputError: function(input,text) {
    var group = input.closest('.form-control').addClass('error');
    var errmsg = $('.errormsg',group);
    if(!errmsg.length) errmsg = $("<small class='errormsg'>").insertAfter(input);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.form-control').removeClass('error')).remove();
  }
});

// Foundation 3 Specific Theme
$.jsoneditor.themes.foundation3 = $.jsoneditor.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    return this._super().css({
      fontSize: '.6em'
    });
  },
  getTabHolder: function() {
    return $("<div class='row'><dl class='tabs vertical two columns'></dl><div class='tabs-content ten columns'></div></div>");
  },
  getTab: function(text) {
    return $("<dd><a href='#'>"+text+"</a></dd>");
  },
  getTabContentHolder: function(tab_holder) {
    return $("> .tabs-content",tab_holder)
  },
  getTabContent: function() {
    return $("<div class='content active'></div>").css({
      paddingLeft: 5
    });
  },
  markTabActive: function(tab) {
    tab.addClass('active');
  },
  markTabInactive: function(tab) {
    tab.removeClass('active');
  },
  addTab: function(holder, tab) {
    $("> .tabs",holder).append(tab);
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
    return this._super(text).css({
      fontSize: '.8rem'
    });
  }
});

// Foundation 5 Specific Theme
$.jsoneditor.themes.foundation5 = $.jsoneditor.themes.foundation.extend({
  getFormInputDescription: function(text) {
    return this._super(text).css({
      fontSize: '.8rem'
    });
  },
  getButton: function(text, icon, title) {
    return this._super(text, icon, title).removeClass('small').addClass('tiny');
  },
  getTabHolder: function() {
    return $("<div><dl class='tabs vertical'></dl><div class='tabs-content'></div></div>");
  },
  getTab: function(text) {
    return $("<dd><a href='#'>"+text+"</a></dd>");
  },
  getTabContentHolder: function(tab_holder) {
    return $("> .tabs-content",tab_holder)
  },
  getTabContent: function() {
    return $("<div class='content active'></div>").css({
      paddingLeft: 5
    });
  },
  markTabActive: function(tab) {
    tab.addClass('active');
  },
  markTabInactive: function(tab) {
    tab.removeClass('active');
  },
  addTab: function(holder, tab) {
    $("> .tabs",holder).append(tab);
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
  },
  addInputError: function(input, text) {
    input.css({
      borderColor: 'red'
    });
    var group = input.closest('.form-control');
    var errmsg = $('.errmsg',group);
    if(!errmsg.length) errmsg = $("<div style='color: red;' class='errmsg'>").appendTo(group);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    input.css({
      borderColor: ''
    });
    $('.errmsg',input.closest('.form-control')).remove();
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
  getFormControl: function(label, input, description) {
    return $("<div>").addClass('form-control')
      .css({
        padding: '8px 0'
      })
      .append(label)
      .append(input)
      .append(description)
  },
  getDescription: function(text) {
    return $("<span>").css({
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
  getButton: function(text, icon, title) {
    var button = $("<button>")
      .addClass('ui-button ui-widget ui-state-default ui-corner-all');
      
    // Icon only
    if(icon && !text) {
      button
        .addClass('ui-button-icon-only')
        .append(icon.addClass('ui-button-icon-primary ui-icon-primary'));
    }
    // Icon and Text
    else if(icon) {
      button
        .addClass('ui-button-text-icon-primary')
        .append(icon.addClass('ui-button-icon-primary ui-icon-primary'));
    }
    // Text only
    else {
      button
        .addClass('ui-button-text-only')
    }
    
    button.append(
      $("<span>").addClass('ui-button-text').text(text||title||".")
    );
    
    button.attr('title',title);
    
    return button;
  },
  setButtonText: function(button,text, icon, title) {
    button.empty();
    
    // Icon only
    if(icon && !text) {
      button
        .removeClass('ui-button-text-icon-primary')
        .removeClass('ui-button-text-only')
        .addClass('ui-button-icon-only')
        .append(icon.addClass('ui-button-icon-primary ui-icon-primary'));
    }
    // Icon and Text
    else if(icon) {
      button
        .removeClass('ui-button-icon-only')
        .removeClass('ui-button-text-only')
        .addClass('ui-button-text-icon-primary')
        .append(icon.addClass('ui-button-icon-primary ui-icon-primary'))
    }
    // Text only
    else {
      button
        .removeClass('ui-button-icon-only')
        .removeClass('ui-button-text-icon-primary')
        .addClass('ui-button-text-only')
    }
    
    button.append(
      $("<span>").addClass('ui-button-text').text(text||title||'.')
    );

    button.attr('title',title);
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('ui-widget-content ui-corner-all').css({
      padding: '1em 1.4em'
    });
  },
  addInputError: function(input,text) {
    var group = input.closest('.form-control');
    var errmsg = $('.errormsg',group);
    if(!errmsg.length) errmsg = $("<div class='errormsg ui-state-error'>").appendTo(group);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.form-control')).remove();
  },
  markTabActive: function(tab) {
    tab.removeClass('ui-widget-header').addClass('ui-state-active');
  },
  markTabInactive: function(tab) {
    tab.removeClass('ui-state-active').addClass('ui-widget-header');
  }
});

$.jsoneditor.AbstractIconLib = Class.extend({
  mapping: {
    collapse: '',
    expand: '',
    delete: '',
    edit: '',
    add: '',
    cancel: '',
    save: '',
    moveup: '',
    movedown: ''
  },
  icon_prefix: '',
  getIconClass: function(key) {
    if(this.mapping[key]) return this.icon_prefix+this.mapping[key];
    else return null;
  },
  getIcon: function(key) {
    var iconclass = this.getIconClass(key);
    
    if(!iconclass) return null;
    else return $("<i>").addClass(iconclass);
  }
});

$.jsoneditor.iconlibs.bootstrap2 = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-up',
    delete: 'trash',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban-circle',
    save: 'ok',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'icon-'
});

$.jsoneditor.iconlibs.bootstrap3 = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-right',
    delete: 'remove',
    edit: 'pencil',
    add: 'plus',
    cancel: 'floppy-remove',
    save: 'floppy-saved',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'glyphicon glyphicon-'
});

$.jsoneditor.iconlibs.fontawesome3 = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-right',
    delete: 'remove',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban-circle',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'icon-'
});

$.jsoneditor.iconlibs.fontawesome4 = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'caret-square-o-down',
    expand: 'caret-square-o-right',
    delete: 'times',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'fa fa-'
});

$.jsoneditor.iconlibs.foundation2 = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'minus',
    expand: 'plus',
    delete: 'remove',
    edit: 'edit',
    add: 'add-doc',
    cancel: 'error',
    save: 'checkmark',
    moveup: 'up-arrow',
    movedown: 'down-arrow'
  },
  icon_prefix: 'foundicon-'
});

$.jsoneditor.iconlibs.foundation3 = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'minus',
    expand: 'plus',
    delete: 'x',
    edit: 'pencil',
    add: 'page-add',
    cancel: 'x-circle',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'fi-'
});

$.jsoneditor.iconlibs.jqueryui = $.jsoneditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'triangle-1-s',
    expand: 'triangle-1-e',
    delete: 'trash',
    edit: 'pencil',
    add: 'plusthick',
    cancel: 'closethick',
    save: 'disk',
    moveup: 'arrowthick-1-n',
    movedown: 'arrowthick-1-s'
  },
  icon_prefix: 'ui-icon ui-icon-'
});

$.jsoneditor.templates.default = function() {
  var expandVars = function(vars) {
    var expanded = {};
    $.each(vars, function(i,el) {
      if(typeof el === "object" && el !== null) {
        var tmp = {};
        $.each(el, function(j,item) {
          tmp[i+'.'+j] = item;
        });
        $.extend(expanded,expandVars(tmp));
      }
      else {
        expanded[i] = el;
      }
    });
    return expanded;
  };
  
  return {
    compile: function(template) {
      return function (vars) {
        var expanded = expandVars(vars);
        
        var ret = template+"";
        // Only supports basic {{var}} macro replacement
        $.each(expanded,function(key,value) {
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
// Use "multiple" as a fall back for everything
$.jsoneditor.resolvers.unshift(function(schema) {
  // Unknown or compound type
  return "multiple";
});
// If the type is set and it's a basic type, use the primitive editor
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema is a simple type
  if(typeof schema.type === "string") return schema.type;
});
// Use the select editor for all boolean values
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.type === 'boolean') {
    return "select";
  }
});
// Use the multiple editor for schemas where the `type` is set to "any"
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema can be of any type
  if(schema.type === "any") return "multiple";
});
// Use the table editor for arrays with the format set to `table`
$.jsoneditor.resolvers.unshift(function(schema) {
  // Type `array` with format set to `table`
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});
// Use the `enum` or `select` editors for schemas with enumerated properties
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.enum) {
    if(schema.type === "array" || schema.type === "object") {
      return "enum";
    }
    else if(schema.type === "number" || schema.type === "integer" || schema.type === "string") {
      return "select";
    }
  }
});
// Use the multiple editor for schemas with `oneOf` set
$.jsoneditor.resolvers.unshift(function(schema) {
  // If this schema uses `oneOf`
  if(schema.oneOf) return "multiple";
});


})(jQuery);
