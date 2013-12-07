  $.jsoneditor.editors.integer = $.jsoneditor.editors.string.extend({
    sanitize: function(value) {
      value = value + "";
      return value.replace(/[^0-9\-]/g,'');
    },
    getValue: function() {
      return this.value*1;
    }
  });
