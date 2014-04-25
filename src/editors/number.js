JSONEditor.defaults.editors.number = JSONEditor.defaults.editors.string.extend({
  getDefault: function() {
    return this.schema.default || 0;
  },
  sanitize: function(value) {
    return (value+"").replace(/[^0-9\.\-]/g,'');
  },
  getNumColumns: function() {
    return 2;
  },
  getValue: function() {
    return this.value*1;
  }
});
