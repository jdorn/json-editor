// Multiple Editor (for when `type` is an array)
$.jsoneditor.editors.multiple = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return null;
  },
  build: function() {
    var self = this;
    var container = this.getContainer();

    this.types = [];
    
    if(this.schema.oneOf) {
      this.types = this.schema.oneOf;
      delete this.schema.oneOf;
    }
    else {
      if(!this.schema.type || this.schema.type === "any") {
        this.types = ['string','number','integer','boolean','object','array','null'];
      }
      else if(this.schema.type instanceof Array) {
        this.types = this.schema.type;
      }
      else {
        this.types = [this.schema.type];
      }
      delete this.schema.type;
    }
    
    this.display_text = this.getDisplayText(this.types);

    this.switcher = this.theme.getSelectInput(this.display_text)
      .appendTo(container)
      .on('change',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        self.type = self.display_text.indexOf($(this).val());

        var current_value = self.getValue();

        $.each(self.editors,function(type,editor) {
          if(self.type === type) {
            editor.setValue(current_value,true);
            editor.container.show();
          }
          else editor.container.hide();
        });

        self.container.trigger('change');
        
        return false;
      })
      .css({
        marginBottom: 0,
        float: 'right'
      });

    this.editor_holder = this.theme.getIndentedPanel().appendTo(container);
    this.type = 0;

    this.editors = [];
    $.each(this.types,function(i,type) {
      var holder = self.theme.getChildEditorHolder().appendTo(self.editor_holder);

      var schema;
      
      if(typeof type === "string") {
        schema = $.extend(true,{},self.schema);
        schema.type = type;
      }
      else {
        schema = $.extend(true,{},self.schema,type);
      }

      var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);

      self.editors[i] = new editor({
        jsoneditor: self.jsoneditor,
        schema: schema,
        container: holder,
        path: self.path,
        parent: self.parent,
        required: true
      });

      if(i !== self.type) holder.hide();
    });

    this.editor_holder.on('change set',function() {
      self.refreshValue();
    });

    this.switcher.val(this.display_text[this.type]);
  },
  refreshValue: function() {
    this.value = this.editors[this.type].getValue();
  },
  setValue: function(val,initial) {
    this.editors[this.type].setValue(val,initial);

    this.refreshValue();
    this.container.trigger('set');
  },
  destroy: function() {
    $.each(this.editors, function(type,editor) {
      editor.destroy();
    });
    this.editor_holder.remove();
    this.switcher.remove();
    this._super();
  }
});
