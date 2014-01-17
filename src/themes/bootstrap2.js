$.jsoneditor.themes.bootstrap2 = $.jsoneditor.AbstractTheme.extend({
  getRangeInput: function(min, max, step) {
    // TODO: use bootstrap slider
    return this._super(min, max, step);
  },
  getSelectInput: function(options) {
    return this._super(options).css({
      width: 'auto'
    });
  },
  afterInputReady: function(input) {
    if(input.closest('.compact').length) {
      input.closest('.control-group').removeClass('control-group');
      input.closest('.controls').removeClass('controls');
      input.css('margin-bottom',0);
    }

    // TODO: use bootstrap slider
  },
  getIndentedPanel: function() {
    return $("<div></div>").addClass('well well-small');
  },
  getFormInputDescription: function(text) {
    return $("<p></p>").addClass('help-inline').text(text);
  },
  getFormControl: function(label, input, description) {
    var ret = $("<div></div>").addClass('control-group');

    var controls;

    if(label && input.attr('type') === 'checkbox') {
      controls = $("<div></div>").addClass('controls').appendTo(ret);
      label.addClass('checkbox').append(input).appendTo(controls);
    }
    else {
      if(label) label.addClass('control-label').appendTo(ret);
      controls = $("<div></div>").addClass('controls').append(input).appendTo(ret);
    }

    if(description) controls.append(description);

    return ret;
  },
  getHeaderButtonHolder: function() {
    return $("<div></div>").addClass('btn-group').css({
      marginLeft: 10
    });
  },
  getButtonHolder: function() {
    return $("<div></div>").addClass('btn-group');
  },
  getButton: function(text) {
    return $("<button></button>").addClass('btn btn-default').text(text);
  },
  getTable: function() {
    return $("<table></table>").addClass('table table-bordered').css({
      width: 'auto',
      maxWidth: 'none'
    });
  },
  addInputError: function(input,text) {
    var controls = $('.controls',input.closest('.control-group').addClass('error'));
    var errmsg = $('.errormsg',controls);
    if(!errmsg.length) errmsg = $("<p class='help-block errormsg'>").appendTo(controls);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.control-group').removeClass('error')).remove();
  }
});
