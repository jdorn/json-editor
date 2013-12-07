  /**
   * Editor for schemas of type 'object'
   * { type: "object", properties: {} }
   */
  $.jsoneditor.editors.object = $.jsoneditor.AbstractEditor.extend({
    default: {},
    init: function(options) {
      if(options.table_row) options.tag = 'tr';
      this._super(options);
    },
    initialize: function() {
      var self = this;
      this.value = {};

      // If this should be rendered as a table row
      if(this.options.table_row) {
        this.editor_holder = this.div;
      }
      // If it should be rendered as a div
      else {
        this.theme.indentDiv(this.div);


        // Add a title and placeholder for action buttons
        this.title = this.theme.getTitle(this.schema.title || this.schema.id || this.key).appendTo(this.div);
        this.title_controls = this.theme.getTitleControls().appendTo(this.title);

        // Add toggle button to collapse/expand object
        this.toggle_button = this.theme.getButton('Toggle').addClass('toggle').appendTo(this.title_controls).attr('data-toggle','shown').css({marginLeft: 20}).on('click',function(e) {
          if($(this).attr('data-toggle')==='hidden') {
            $(this).attr('data-toggle','shown');
            self.editor_holder.show(300);
          }
          else {
            $(this).attr('data-toggle','hidden');
            self.editor_holder.hide(300);
          }

          e.stopPropagation();
          e.preventDefault();
          return false;
        });

        // Put all child editors within a well
        this.editor_holder = this.theme.getChildEditorHolder().appendTo(this.div);
      }

      // Add child editors
      this.editors = {};
      $.each(this.schema.properties,function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: self.editor_holder,
          path: self.path+'.'+key,
          parent: self,
          tag: (self.options.table_row? 'td' : 'div')
        });
      });

      // If a child editor changes, update this one's value
      self.editor_holder.on('change',function() {
        self.refresh();
      });

      this.refresh();

      if(this.options.collapsed && this.toggle_button) this.toggle_button.trigger('click');
    },
    /**
     * Re-calculate value from child editors
     */
    refresh: function() {
      var self = this;
      this.value = {};
      $.each(this.editors,function(key,editor) {
        self.value[key] = editor.getValue();
      });
    },
    setValue: function(value) {
      value = value || {};
      $.each(this.editors,function(key,editor) {
        if(typeof value[key] !== "undefined") {
          editor.setValue(value[key]);
        }
      });
      this.refresh();
    },
    getValue: function() {
      return $.extend({},this.value);
    },
    destroy: function() {
      var self = this;
      $.each(this.editors,function(i,editor) {
        editor.destroy();
        self.editors[i] = null;
      });
      self.editors = null;

      this._super();
    }
  });
