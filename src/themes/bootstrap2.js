  $.jsoneditor.themes.bootstrap2 = $.jsoneditor.AbstractTheme.extend({
    getFormInputField: function(type) {
      var field = this._super(type);
      
      // Some input formats should use a large input field
      if(['email','url','text'].indexOf(this.input_type) >= 0) {
        this.input.addClass('input-xxlarge')
      }
      
      return field;
    },
    addFormInputControl: function(div,label,field) {
      if(field.attr('type')==='checkbox') {
        label.addClass('checkbox');
        label.append(field);
        div.append(label);
      }
      else {
        this._super(div, label, field);
      }
    },
    getTable: function() {
      return this._super().addClass('table table-bordered').css({
        maxWidth: 'none',
        width: 'auto'
      });
    },
    getControls: function() {
      return this._super().addClass('btn-group');
    },
    getTitleControls: function() {
      return this._super().addClass('btn-group');
    },
    getButton: function(text) {
      return this._super(text).addClass('btn');
    },
    getChildEditorHolder: function() {
      return $("<div>").addClass('well well-small');
    }
  });
