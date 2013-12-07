  $.jsoneditor.themes.bootstrap3 = $.jsoneditor.AbstractTheme.extend({
    addFormInputControl: function(div,label,field) {
      if(field.attr('type')==='checkbox') {
        label.append(field);
        div.addClass('checkbox').append(label);
      }
      else {
        div.addClass('form-group').append(label).append(field);
      }
    },
    getSelectInput: function() {
      return $("<select>").addClass('form-control');
    },
    getTable: function() {
      return this._super().addClass('table table-bordered').css({
        maxWidth: 'none',
        width: 'auto'
      });
    },
    getFormOutput: function() {
      return $("<output></output>").css({
        paddingLeft: '10px',
        display: 'inline-block'
      });
    },
    getFormInputField: function(type) {
      var field = this._super(type);
      
      if(type === 'range') {
        field.css('margin-left','5px').css('margin-top','5px');
      }
      else if(type === 'color') {
        field.css('margin-left','5px')
      }
      else if(type === 'checkbox') {
        field.css('margin-left','5px')
      }
      else {
        field.addClass('form-control');
      }
      
      return field;
    },
    getControls: function() {
      return this._super().addClass('btn-group');
    },
    getTitleControls: function() {
      return this._super().addClass('btn-group');
    },
    getButton: function(text) {
      return this._super(text).addClass('btn btn-default');
    },
    getChildEditorHolder: function() {
      return $("<div>").addClass('well well-small');
    }
  });
