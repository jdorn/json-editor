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
  getFormControl: function(label, input, description) {
    return $("<div>").addClass('form-control')
      .css({
        padding: '8px 0'
      })
      .append(label)
      .append(input)
      .append(description)
  },
  getDescription: function(text) {
    return $("<span>").css({
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
  },
  addInputError: function(input,text) {
    var group = input.closest('.form-control');
    var errmsg = $('.errormsg',group);
    if(!errmsg.length) errmsg = $("<div class='errormsg ui-state-error'>").appendTo(group);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.form-control')).remove();
  }
});
