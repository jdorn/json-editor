$.jsoneditor.editors.null = $.jsoneditor.AbstractEditor.extend({
  getValue: function() {
    return null;
  },
  setValue: function() {
    this.fireSetEvent();
  }
});
