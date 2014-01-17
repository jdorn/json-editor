$.jsoneditor.themes.bootstrap3 = $.jsoneditor.AbstractTheme.extend({
  getSelectInput: function(options) {
    return this._super(options).addClass('form-control').css({
      width: 'auto'
    });
  },
  getTextareaInput: function() {
    return $("<textarea>").addClass('form-control');
  },
  getRangeInput: function(min, max, step) {
    // TODO: use better slider
    return this._super();
  },
  getFormInputField: function(type) {
    return this._super(type).addClass('form-control');
  },
  getFormControl: function(label, input, description) {
    var group = $("<div></div>");

    if(label && input.attr('type') === 'checkbox') {
      group.addClass('checkbox');
      label.append(input).appendTo(group);
    } 
    else {
      group.addClass('form-group');
      if(label) label.appendTo(group).addClass('control-label');
      input.appendTo(group);
    }

    if(description) group.append(description);

    return group;
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('well well-sm');
  },
  getFormInputDescription: function(text) {
    return $("<p>").addClass('help-block').text(text);
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      marginLeft: 10
    });
  },
  getButtonHolder: function() {
    return $("<div>").addClass('btn-group');
  },
  getButton: function(text) {
    return $("<button>").addClass('btn btn-default').text(text);
  },
  getTable: function() {
    return $("<table>").addClass("table table-bordered").css({
      width: 'auto',
      maxWidth: 'none'
    });
  },
  addInputError: function(input,text) {
    var group = input.closest('.form-group').addClass('has-error');
    var errmsg = $('.errormsg',group);
    if(!errmsg.length) errmsg = $("<p class='help-block errormsg'>").appendTo(group);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.form-group').removeClass('has-error')).remove();
  }
});
