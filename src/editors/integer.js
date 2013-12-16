$.jsoneditor.editors.integer = $.jsoneditor.editors.number.extend({
  sanitize: function(value) {
    value = value + "";
    return value.replace(/[^0-9\-]/g,'');
  }
});
