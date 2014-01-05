// Boolean Editor (simple checkbox)
$.jsoneditor.editors.boolean = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return false;
  },
  build: function() {
    var container = this.getContainer();
    if(!this.getOption('compact',false)) this.label = this.theme.getCheckboxLabel(this.getTitle());
    this.input = this.theme.getCheckbox();

    if(this.schema.description) this.description = this.theme.getCheckboxDescription(this.schema.description);

    this.input_holder = this.theme.getFormControl(this.label, this.input, this.description).appendTo(container);

    var self = this;

    if(this.getOption('compact')) this.container.addClass('compact');

    this.input
      // data-schemapath is used by other editors to listen to changes
      .attr('data-schemapath',this.getPath())
      // data-schematype can be used to style different editors based on the string editor
      .attr('data-schematype',this.schema.type)
      //update the editor's value when it is changed
      .on('change',function() {
        self.refreshValue();
      });
  },
  refreshValue: function() {
    this.value = this.input.prop('checked');
  },
  setValue: function(val) {
    if(val) this.input.prop('checked',true);
    else this.input.prop('checked',false);
    
    this.input.trigger('set');

    this.refreshValue();
  },
  destroy: function() {
    this.input.remove();
    if(this.label) this.label.remove();
    if(this.description) this.description.remove();
    this.input_holder.remove();
    this.input = this.label = this.description = this.input_holder = null;

    this._super();
  },
  isValid: function(callback) {
    // A boolean field is always valid
    callback();
  }
});
