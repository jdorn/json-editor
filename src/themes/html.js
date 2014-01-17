$.jsoneditor.themes.html = $.jsoneditor.AbstractTheme.extend({
  getFormInputLabel: function(text) {
    return this._super(text).css({
      display: "block",
      marginBottom: 3
    });
  },
  getFormInputDescription: function(text) {
    return this._super(text).css({
      fontSize: '.8em',
      margin: 0,
      display: 'inline-block',
      fontStyle: 'italic'
    });
  },
  getIndentedPanel: function() {
    return $("<div>").css({
      border: '1px solid #ddd',
      padding: 5,
      margin: 5,
      borderRadius: 3
    });
  },
  getChildEditorHolder: function() {
    return $("<div>").css({
      marginBottom: 8
    });
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      display: 'inline-block',
      marginLeft: 10,
      fontSize: '.8em',
      verticalAlign: 'middle'
    });
  },
  getTable: function() {
    return $("<table>").css({
      borderBottom: '1px solid #ccc',
      marginBottom: 5
    });
  },
  addInputError: function(input, text) {
    input.css({
      borderColor: 'red'
    });
    var group = input.closest('.form-control');
    var errmsg = $('.errmsg',group);
    if(!errmsg.length) errmsg = $("<div style='color: red;' class='errmsg'>").appendTo(group);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    input.css({
      borderColor: ''
    });
    $('.errmsg',input.closest('.form-control')).remove();
  },
});
