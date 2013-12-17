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
