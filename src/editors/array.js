  /**
   * Editor for schemas of type 'array'
   * { type: "array", items: {} }
   *
   * Only supports arrays where every element has the same schema (specified in the 'items' property)
   */
  $.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
    default: [],
    initialize: function() {
      var self = this;
      this.value = [];

      this.title = this.theme.getTitle(this.schema.title || this.schema.id || this.key).addClass('title').appendTo(this.div);
      this.title_controls = this.theme.getTitleControls().appendTo(this.title);

      // If rendering the editor as an editable html table
      if(this.options.table_format) {
        this.table = this.theme.getTable().appendTo(this.div);

        var headers = [];        
        $.each(this.schema.items.properties,function(key,prop) {
          headers.push(prop.title||prop.id||key);
        });
        headers.push('actions');

        this.theme.addTableHeader(this.table, headers);
        this.row_holder = this.theme.addTableBody(this.table);
      }
      else {
        // Indent the editor so it's easy to see the nested relationships
        this.theme.indentChildEditor(this.div);

        this.row_holder = $("<div>").appendTo(this.div);
      }

      this.controls = this.theme.getControls().appendTo(this.div);

      // If a child editor changes, update this one's value
      this.row_holder.on('change',function() {
        self.refresh();
      });

      this.rows = [];

      this.addControls();
      this.refresh();

      if(this.options.collapsed) {
        self.toggle_button.trigger('click');
      }


    },
    addControls: function() {
      var self = this;
      this.toggle_button = this.theme.getButton('Toggle All').appendTo(this.title_controls).css({marginLeft: 20}).addClass('toggle-all').attr('data-toggle','shown').on('click',function(e) {
        if($(this).attr('data-toggle')==='shown') {
          $(this).attr('data-toggle','hidden');

          // For table editor, hide the table
          if(self.options.table_format) {
            self.row_holder.hide();
            self.controls.hide();
          }
          // For array editor, toggle each element
          else {
            $('.toggle[data-toggle="shown"]',self.row_holder).trigger('click');
          }
        }
        else {
          $(this).attr('data-toggle','shown');

          // For table editor, show the table
          if(self.options.table_format) {
            self.row_holder.show();
            self.controls.show();
          }
          // For array editor, show each element
          else {
            $('.toggle[data-toggle="hidden"]',self.row_holder).trigger('click');
          }
        }

        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      // Add "new row" and "delete last" buttons below editor
      this.add_row_button = this.theme.getButton('Add '+(this.schema.items.title || this.schema.items.id || this.schema.title || this.schema.id || this.key))
        .on('click',function() {
          self.addRow();
          self.refresh();
          self.div.trigger('change');
        })
        .appendTo(self.controls);

      this.delete_last_row_button = this.theme.getButton('Delete Last '+(this.schema.items.title || this.schema.items.id || this.schema.title || this.schema.id || this.key))
        .on('click',function() {
          var rows = self.getValue();
          rows.pop();
          self.setValue(rows);
          self.div.trigger('change');
        })
        .appendTo(self.controls);

      this.remove_all_rows_button = this.theme.getButton('Delete All Rows')
        .on('click',function() {
          self.setValue([]);
          self.div.trigger('change');
        })
        .appendTo(self.controls);

      // Make rows sortable
      this.row_holder
        .on('sortupdate',function(e,ui) {
          var oldi = ui.oldindex;
          var newi = ui.item.index();

          e.stopPropagation();
          e.preventDefault();

          if(oldi == newi) return;

          // Get the new value for the array
          var value = self.getValue();
          var newval = [];
          var row = value[oldi];
          var before = oldi>newi;
          $.each(value,function(i,el) {
            if(i===oldi) return;

            if(before) {
              if(i===newi) newval.push(row);
              newval.push(el);
            }
            else {
              newval.push(el);
              if(i===newi) newval.push(row);
            }
          });

          // Move the element back to where it was
          ui.item.detach();
          if(oldi) {
            self.row_holder.children().eq(oldi-1).after(ui.item);
          }
          else {
            self.row_holder.children().eq(0).before(ui.item);
          }

          self.setValue(newval);
          self.div.trigger('change');
        })
    },
    destroy: function() {
      this.empty();
      this.rows = null;

      this._super();
    },
    addRow: function(value) {
      var self = this;
      var i = this.rows.length;

      var schema_copy = $.extend({},self.schema.items);
      schema_copy.title = (schema_copy.title || schema_copy.id || self.schema.title || self.schema.id || self.key)+' '+i;

      var editor = $.jsoneditor.getEditorClass(schema_copy, self.jsoneditor);

      self.rows[i] = new editor({
        jsoneditor: self.jsoneditor,
        schema: schema_copy,
        container: self.row_holder,
        path: self.path+'.'+i,
        parent: self,
        table_row: self.options.table_format
      });

      // Buttons to delete row, move row up, and move row down
      self.rows[i].delete_button = this.theme.getButton('Delete '+(self.schema.items.title||self.schema.items.id||self.schema.title||self.schema.id||self.key))
        .addClass('delete')
        .data('i',i)
        .on('click',function() {
          var i = $(this).data('i');

          var value = self.getValue();

          var newval = [];
          $.each(value,function(j,row) {
            if(j===i) return; // If this is the one we're deleting
            newval.push(row);
          });
          self.setValue(newval);
          self.div.trigger('change');
        });
      self.rows[i].moveup_button = this.theme.getButton('Move up')
        .data('i',i)
        .addClass('moveup')
        .on('click',function() {
          var i = $(this).data('i');

          if(i<=0) return;
          var rows = self.getValue();
          var tmp = rows[i-1];
          rows[i-1] = rows[i];
          rows[i] = tmp;

          self.setValue(rows);
          self.div.trigger('change');
        });
      self.rows[i].movedown_button = this.theme.getButton('Move down')
        .addClass('movedown')
        .data('i',i)
        .on('click',function() {
          var i = $(this).data('i');

          var rows = self.getValue();
          if(i>=rows.length-1) return;
          var tmp = rows[i+1];
          rows[i+1] = rows[i];
          rows[i] = tmp;

          self.setValue(rows);
          self.div.trigger('change');
        });

      var controls_holder;

      // In the table format, action buttons go in a column to the far right
      if(this.options.table_format) {
        controls_holder = this.theme.getControls().appendTo(this.theme.getTableCell().appendTo(self.rows[i].div));
      }
      // In the div layout, buttons go next to the title
      else {
        controls_holder = self.rows[i].title_controls;
      }

      controls_holder.append(self.rows[i].delete_button);
      if(i) controls_holder.append(self.rows[i].moveup_button);
      controls_holder.append(self.rows[i].movedown_button);

      // Make child editors compact within the table format
      if(this.options.table_format) {
        var row = this.rows[this.rows.length-1];

        // Hide labels, headers, wells, make inputs shorter
        // TODO: use theme
        $('label,h1,h2,h3,h4,h5,h6',row.div).remove();
        $('.well',row.div).removeClass('well').css({
          marginLeft: 0,
          paddingLeft: 0
        });

        // Make inputs small and remove bottom margins
        // TODO: use theme
        $('.input-xxlarge',row.div).removeClass('input-xxlarge').css('margin-bottom',0);
        $('select',row.div).css('margin-bottom',0);
      }

      if(value) self.rows[i].setValue(value);
    },

    /**
     * Re-calculate the value for this editor
     */
    refresh: function() {
      var self = this;
      this.value = [];

      // If we currently have minItems items in the array
      var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;

      $.each(this.rows,function(i,editor) {
        // Hide the move down button for the last row
        if(i === self.rows.length - 1) {
          editor.movedown_button.hide();
        }
        else {
          editor.movedown_button.show();
        }

        // Hide the delete button if we have minItems items
        if(minItems) {
          editor.delete_button.hide();
        }
        else {
          editor.delete_button.show();
        }

        // Get the value for this editor
        self.value[i] = editor.getValue();
      });
      
      if(!this.value.length) {
        this.delete_last_row_button.hide();
        this.remove_all_rows_button.hide();
      }
      else if(this.value.length === 1) {      
        this.remove_all_rows_button.hide();  

        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems) {
          this.delete_last_row_button.hide();
        }
        else {
          this.delete_last_row_button.show();
        }
      }
      else {
        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems) {
          this.delete_last_row_button.hide();
          this.delete_last_row_button.hide();
        }
        else {
          this.delete_last_row_button.show();
          this.remove_all_rows_button.show();
        }
      }

      // If there are maxItems in the array, hide the add button beneath the rows
      if(this.schema.maxItems && this.schema.maxItems <= this.rows.length) {
        this.add_row_button.hide();
      }
      else {
        this.add_row_button.show();
      }

      if(this.table) {
        if(this.value.length) this.table.show();
        else this.table.hide();
      }
    },
    /**
     * Destroy editors for all rows
     */
    empty: function() {
      var self = this;
      $.each(this.rows,function(i,row) {
        row.destroy();
        self.rows[i] = null;
      });
      self.rows = [];
    },
    setValue: function(value) {
      // Update the array's value, adding/removing rows when necessary
      value = value || [];

      // Make sure value has between minItems and maxItems items in it
      if(this.schema.minItems) {
        while(value.length < this.schema.minItems) {
          value.push({});
        }
      }
      if(this.schema.maxItems && value.length > this.schema.maxItems) {
        value = value.slice(0,this.schema.maxItems);
      }

      var self = this;
      $.each(value,function(i,val) {
        if(self.rows[i]) {
          // TODO: don't set the row's value if it hasn't changed
          self.rows[i].setValue(val);
        }
        else {
          self.addRow(val);
        }
      });

      for(var j=value.length; j<self.rows.length; j++) {
        self.rows[j].destroy();
        self.rows[j] = null;
      }
      self.rows = self.rows.slice(0,value.length);

      self.refresh();

      if($.fn.sortable) {
        self.row_holder.sortable('destroy');
        if(self.options.table_format) {
          self.row_holder.sortable({
            items: 'tr',
            placeholder: '<tr>'+self.theme.getTableCell().html('&nbsp;')+'</tr>',
            forcePlaceholderSize: true
          });
        }
      }
    }
  });
