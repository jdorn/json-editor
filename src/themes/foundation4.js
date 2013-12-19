$.jsoneditor.themes.foundation4 = $.jsoneditor.AbstractTheme.extend({
  getChildEditorHolder: function() {
    return $("<div>").css({
      marginBottom: 15
    });
  },
  getSelectInput: function(options) {
    var select = $("<select>").css({
      width: 'auto',
      minWidth: 'none',
      padding: 5,
      marginTop: 3
    });
    $.each(options, function(i,val) {
      select.append($("<option>").attr('value',val).text(val));
    });
    return select;
  },
  afterInputReady: function(input) {
    if(input.closest('.compact').length) {
      input.css('margin-bottom',0);
    }
  },
  getFormInputDescription: function(text) {
    return $("<p></p>").text(text).css({
      marginTop: -10,
      fontStyle: 'italic',
      fontSize: '.8rem'
    });
  },
  getFormControl: function(label, input, description) {
    return $("<div>")
      .append(label)
      .append(input)
      .append(description)
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('panel');
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      display: 'inline-block',
      marginLeft: 10,
      verticalAlign: 'middle',
      fontSize: '.6em'
    });
  },
  getButtonHolder: function() {
    return $("<div>").addClass('button-group');
  },
  getButton: function(text) {
    return $("<button>").addClass('small button').text(text);
  }
});
