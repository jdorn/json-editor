// Base Foundation theme
$.jsoneditor.themes.foundation = $.jsoneditor.AbstractTheme.extend({
  getChildEditorHolder: function() {
    return $("<div>").css({
      marginBottom: 15
    });
  }, 
  getSelectInput: function(options) {
    return this._super(options).css({
      width: 'auto',
      minWidth: 'none',
      padding: 5,
      marginTop: 3
    });
  },
  afterInputReady: function(input) {
    if(input.closest('.compact').length) {
      input.css('margin-bottom',0);
    }
  },
  getFormInputDescription: function(text) {
    return $("<p></p>").text(text).css({
      marginTop: -10,
      fontStyle: 'italic'
    });
  },
  getIndentedPanel: function() {
    return $("<div>").addClass('panel');
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder().css({
      display: 'inline-block',
      marginLeft: 10,
      verticalAlign: 'middle'
    });
  },
  getButtonHolder: function() {
    return $("<div>").addClass('button-group');
  },
  getButton: function(text) {
    return $("<button>").addClass('small button').text(text);
  },
  addInputError: function(input,text) {
    var group = input.closest('.form-control').addClass('error');
    var errmsg = $('.errormsg',group);
    if(!errmsg.length) errmsg = $("<small class='errormsg'>").insertAfter(input);
    errmsg.text(text);
  },
  removeInputError: function(input) {
    $('.errormsg',input.closest('.form-control').removeClass('error')).remove();
  }
});

// Foundation 3 Specific Theme
$.jsoneditor.themes.foundation3 = $.jsoneditor.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    return this._super().css({
      fontSize: '.6em'
    });
  }
});

// Foundation 4 Specific Theme
$.jsoneditor.themes.foundation4 = $.jsoneditor.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    return this._super().css({
      fontSize: '.6em'
    });
  },
  getFormInputDescription: function(text) {
    return this._super(text).css({
      fontSize: '.8rem'
    });
  }
});

// Foundation 5 Specific Theme
$.jsoneditor.themes.foundation5 = $.jsoneditor.themes.foundation.extend({
  getFormInputDescription: function(text) {
    return this._super(text).css({
      fontSize: '.8rem'
    });
  },
  getButton: function(text) {
    return $("<button>").addClass('tiny button').text(text);
  }
});
