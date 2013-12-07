  $.jsoneditor.themes.jqueryui = $.jsoneditor.AbstractTheme.extend({
    addTableHeader: function(table, cols) {
      var header = this._super(table, cols);
      $("th",header).addClass('ui-state-default').css({
        fontWeight: 'bold'
      });
      return header;
    },
    getTableCell: function() {
      return this._super().addClass('ui-widget-content');
    },
    getTitleControls: function() {
      return this._super().addClass('ui-buttonset').css({
        fontSize: '.45em'
      });
    },
    getFormInputLabel: function(text) {
      return this._super(text).css({
        marginRight: '5px'
      });
    },
    getControls: function() {
      return this._super().addClass('ui-buttonset');
    },
    getButton: function(text) {
      return $("<button>").addClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only').append(
        $("<span>").addClass('ui-button-text').text(text)
      );
    },
    getChildEditorHolder: function() {
      return $("<div>").addClass('ui-widget-content ui-corner-all').css({
        padding: '1em 1.4em'
      });
    }
  });
