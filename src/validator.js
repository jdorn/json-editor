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
    schema = $extend({},schema);

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
          schema = $extend({},schema,self.refs[ref],schema);
          callback(schema);
        });
      }
      // If this reference has already been loaded
      else if(self.refs[ref]) {
        schema = $extend({},schema,self.refs[ref],schema);
        callback(schema);
      }
      // Otherwise, it needs to be loaded via ajax
      else {
        if(!self.options.ajax) throw "Must set ajax option to true to load external url "+ref;
      
        var r = new XMLHttpRequest(); 
        r.open("GET", ref, true);
        r.onreadystatechange = function () {
          if (r.readyState != 4) return; 
          if(r.status === 200) {
            var response = JSON.parse(r.responseText);
            self.refs[ref] = [];

            // Recursively expand this schema
            self._getRefs(response, function(ref_schema) {
              var list = self.refs[ref];
              self.refs[ref] = ref_schema;
              schema = $extend({},schema,self.refs[ref],schema);
              callback(schema);

              // If anything is waiting on this to load
              $.each(list,function(i,v) {
                v();
              });
            });
            return;
          }
          
          // Request failed
          throw "Failed to fetch ref via ajax- "+ref;
        };
        r.send();
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
    schema = $extend({},schema);

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
      var tmp = $extend({},extended);
      delete tmp.oneOf;
      for(i=0; i<schema.oneOf.length; i++) {
        extended.oneOf[i] = this.extend(this.expandSchema(schema.oneOf[i]),tmp);
      }
    }

    return extended;
  },
  extend: function(obj1, obj2) {
    obj1 = $extend({},obj1);
    obj2 = $extend({},obj2);

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
