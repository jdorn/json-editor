JSONEditor.defaults.editors["null"] = JSONEditor.AbstractEditor.extend({
  getValue: function() {
    if (!this.dependenciesFulfilled) {
      return undefined;
    }
    return null;
  },
  setValue: function() {
    this.onChange();
  },
  getNumColumns: function() {
    return 2;
  }
});
