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
