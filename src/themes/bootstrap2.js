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
  getButton: function(text, icon, title) {
    return this._super(text, icon, title).addClass('btn btn-default');
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
  },
  getTabHolder: function() {
    return $("<div class='tabbable tabs-left'><ul class='nav nav-tabs'></ul><div class='tab-content'></div></div>");
  },
  getTab: function(text) {
    return $("<li></li>").append($("<a href='#'>").append(text));
  },
  getTabContentHolder: function(tab_holder) {
    return $("> .tab-content",tab_holder)
  },
  getTabContent: function() {
    return $("<div class='tab-pane active'></div>");
  },
  markTabActive: function(tab) {
    tab.addClass('active');
  },
  markTabInactive: function(tab) {
    tab.removeClass('active');
  },
  addTab: function(holder, tab) {
    $("> .nav-tabs",holder).append(tab);
  }
});
