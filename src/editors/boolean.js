
  // Boolean Editor (simple checkbox)
  $.jsoneditor.editors.boolean = $.jsoneditor.AbstractEditor.extend({
    default: false,
    initialize: function() {
      var self = this;

      this.value = false;

      this.input_holder = $("<div></div>").css({
        padding: '10px 0'
      }).appendTo(this.div);
      
      this.label = this.theme.getFormInputLabel(this.schema.title || this.schema.id || this.key);
      this.input = this.theme.getFormInputField('checkbox');
      
      this.theme.addFormInputControl(this.input_holder,this.label,this.input);

      this.input
        // data-schemapath is used by other editors to listen to changes
        .attr('data-schemapath',this.path)
        // data-schematype can be used to style different editors based on the string editor
        .attr('data-schematype',this.schema.type)
        //update the editor's value when it is changed
        .on('change',function(e) {
          self.updateValue();
        });
    },
    updateValue: function() {
      this.value = this.input.prop('checked');
    },
    setValue: function(val) {
      if(val) this.input.prop('checked',true);
      else this.input.prop('checked',false);

      this.updateValue();
    }
  });
