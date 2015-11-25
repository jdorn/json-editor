JSONEditor.defaults.editors.number = JSONEditor.defaults.editors.string.extend({
  build: function() {
    this._super();

    if (typeof this.schema.minimum !== "undefined") {
      var minimum = this.schema.minimum;

      if (typeof this.schema.exclusiveMinimum !== "undefined") {
        minimum += 1;
      }

      this.input.setAttribute("min", minimum);
    }

    if (typeof this.schema.maximum !== "undefined") {
      var maximum = this.schema.maximum;

      if (typeof this.schema.exclusiveMaximum !== "undefined") {
        maximum -= 1;
      }

      this.input.setAttribute("max", maximum);
    }
  },
  sanitize: function(value) {
    return (value+"").replace(/[^0-9\.\-eE]/g,'');
  },
  getNumColumns: function() {
    return 2;
  },
  getValue: function() {
    return this.value*1;
  }
});
