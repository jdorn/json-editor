$.jsoneditor.themes.jqueryui = $.jsoneditor.AbstractTheme.extend({
  getTable: function() {
    return $("<table>").attr('cellpadding',5).attr('cellspacing',0);
  },
  getTableHeaderCell: function() {
    return $("<th>").addClass('ui-state-active').css({
      fontWeight: 'bold'
    });
  },
  getTableCell: function() {
    return $("<td>").addClass('ui-widget-content');
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      marginLeft: 10,
      fontSize: '.6em',
      display: 'inline-block'
    });
  },
  getFormInputDescription: function(text) {
    return this.getDescription(text).css({
      display: 'inline-block',
      marginLeft: 10
    });
  },
  getDescription: function(text) {
    return $("<p>").css({
      fontSize: '.8em',
      fontStyle: 'italic'
    }).text(text);
  },
  getButtonHolder: function() {
    return $("<div>").addClass('ui-buttonset').css({
      fontSize: '.7em'
    });
  },
  getFormInputLabel: function(text) {
    return $("<label>").text(text).css({
      marginRight: '5px'
    });
  },
  getButton: function(text) {
    return $("<button>").addClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only').append(
      $("<span>").addClass('ui-button-text').text(text)
    );
  },
  setButtonText: function(button,text) {
    $(".ui-button-text",button).text(text);
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('ui-widget-content ui-corner-all').css({
      padding: '1em 1.4em'
    });
  }
});
