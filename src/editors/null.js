JSONEditor.defaults.editors.null = JSONEditor.AbstractEditor.extend({
  getValue: function() {
    return null;
  },
  setValue: function() {
    this.jsoneditor.notifyWatchers(this.path);
  },
  getNumColumns: function() {
    return 2;
  }
});
