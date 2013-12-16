$.jsoneditor.editors.number = $.jsoneditor.editors.string.extend({
  getDefault: function() {
    return 0;
  },
  sanitize: function(value) {
    return (value+"").replace(/[^0-9\.\-]/g,'');
  },
  getValue: function() {
    return this.value*1;
  }
});
