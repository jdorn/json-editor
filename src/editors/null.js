JSONEditor.defaults.editors["null"] = JSONEditor.AbstractEditor.extend({
  getValue: function() {
    return null;
  },
  setValue: function() {
    this.onChange();
  },
  getNumColumns: function() {
    return 2;
  }
});
