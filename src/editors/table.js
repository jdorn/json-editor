  // Compact version of array editor that uses table rows instead of divs
  // This works best when none of the array elements' properties have children
  $.jsoneditor.editors.table = $.jsoneditor.editors.array.extend({
    initialize: function() {
      this.options.table_format = true;
      this._super();
    }
  });
