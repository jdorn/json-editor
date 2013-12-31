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
    
    // `allOf`
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        errors.concat(this._validateSchema(schema.allOf[i],value,path));
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
      if(schema.type instanceOf Array) {
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
    
    // `maxium`
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
          message: 'Value must be at least '+schema.maxLength+' characters long'
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
    
    // `items` and `additionalItems`
    if(schema.items) {
      // TODO: implement
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
        valid = JSON.Stringify(value[i]);
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
    if(schema.required && schema.required instanceOf Array) {
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
    
    // `properties`, `additionalProperties`, and `patternProperties`
    if(schema.properties) {
      // TODO: implement
    }
    
    // `dependencies`
    if(schema.dependencies) {
      // TODO: implement
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
      else if(type==="array") return value instanceOf Array;
      else if(type === "object") return value !== null && !(value instanceOf Array) && typeof value === "object";
      else if(type === "null") return value === null;
      else return true;
    }
    // Schema
    else {
      return !this._validateSchema(type,value).length;
    }
  }
});
