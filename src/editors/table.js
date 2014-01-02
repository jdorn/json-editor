$.jsoneditor.editors.table = $.jsoneditor.editors.array.extend({
  addProperty: function() {
    this._super();
    if(this.value.length) this.table.show(500);
  },
  removeProperty: function() {
    this._super();
    this.table.hide(500);
  },
  build: function() {
    this.rows = [];
    var self = this;

    this.schema.items = this.schema.items || [];

    this.table = this.theme.getTable();
    this.thead = this.theme.getTableHead().appendTo(this.table);
    this.header_row = this.theme.getTableRow().appendTo(this.thead);
    this.row_holder = this.theme.getTableBody().appendTo(this.table);

    // Determine the default value of array element
    var tmp = this.getElementEditor(0);
    this.item_default = tmp.getDefault();
    this.item_title = this.schema.items.title || 'row';

    // Build header row for table
    if(tmp.getChildEditors()) {
      this.item_has_child_editors = true;

      if(!this.getOption('compact',false)) {
        this.title = this.theme.getHeader(this.getTitle()).appendTo(this.container);
        this.title_controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
        if(this.schema.description) this.description = this.theme.getDescription(this.schema.description).appendTo(this.container);
      }
    }

    this.table.appendTo(this.container);
    this.controls = this.theme.getButtonHolder().appendTo(this.container);

    if(this.item_has_child_editors) {
      $.each(tmp.getChildEditors(), function(i,editor) {
        self.header_row.append(self.theme.getTableHeaderCell().text(editor.getTitle()).attr('title',editor.schema.title));
      });
    }
    else {
      self.header_row.append(self.theme.getTableHeaderCell().text(this.item_title));
    }

    tmp.destroy();
    this.row_holder.empty();

    // Row Controls column
    self.header_row.append(self.theme.getTableHeaderCell().html("&nbsp;"));

    this.row_holder.on('change',function() {
      self.refreshValue();
    });


    // Add controls
    this.addControls();
  },
  getItemDefault: function() {
    return $.extend(true,{},{default:this.item_default}).default;
  },
  getItemTitle: function() {
    return this.item_title;
  },
  getElementEditor: function(i) {
    var schema_copy = $.extend({},this.schema.items);
    var editor = $.jsoneditor.getEditorClass(schema_copy, this.jsoneditor);
    var row = this.theme.getTableRow().appendTo(this.row_holder);
    var holder = this.item_has_child_editors? row : this.theme.getTableCell().appendTo(row);

    var ret = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema_copy,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      compact: true,
      table_row: true
    });

    ret.controls_cell = this.theme.getTableCell().appendTo(row);
    ret.row = row;
    ret.table_controls = this.theme.getButtonHolder().appendTo(ret.controls_cell);

    return ret;
  },
  destroy: function() {
    this.empty();
    if(this.title) this.title.remove();
    if(this.description) this.description.remove();
    if(this.row_holder) this.row_holder.remove();
    this.table.remove();

    this.rows = this.title = this.description = this.row_holder = this.table = null;

    this._super();
  },
  empty: function() {
    if(!this.rows) return;
    var self = this;
    $.each(this.rows,function(i,row) {
      if(!self.item_has_child_editors) {
        row.row.remove();
      }
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
        value.push(this.getItemDefault());
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
      var holder = self.rows[j].container;
      if(!self.item_has_child_editors) {
        self.rows[j].row.remove();
      }
      self.rows[j].destroy();
      holder.remove();
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    self.refreshValue();

    // TODO: sortable
  },
  refreshValue: function() {
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
      this.toggle_button.hide();
      this.table.hide();
    }
    else if(this.value.length === 1) {
      this.table.show();
      this.toggle_button.show();
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
      this.table.show();
      this.toggle_button.show();
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
  },
  addRow: function(value) {
    var self = this;
    var i = this.rows.length;

    self.rows[i] = this.getElementEditor(i);

    // Buttons to delete row, move row up, and move row down
    self.rows[i].delete_button = this.theme.getButton('Delete '+self.getItemTitle())
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
        self.container.trigger('change');
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
        self.container.trigger('change');
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
        self.container.trigger('change');
      });

    var controls_holder = self.rows[i].table_controls;
    controls_holder.append(self.rows[i].delete_button);
    if(i) controls_holder.append(self.rows[i].moveup_button);
    controls_holder.append(self.rows[i].movedown_button);

    if(value) self.rows[i].setValue(value);
  },
  addControls: function() {
    var self = this;

    this.collapsed = false;
    this.toggle_button = this.theme.getButton('Collapse').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.controls.show(300);
        self.row_holder.show(300);
        self.theme.setButtonText($(this),'Collapse');
      }
      else {
        self.collapsed = true;
        self.controls.hide(300);
        self.row_holder.hide(300);
        self.theme.setButtonText($(this),'Expand');
      }
    });

    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.theme.getButton('Add '+this.getItemTitle())
      .on('click',function() {
        self.addRow();
        self.refreshValue();
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.delete_last_row_button = this.theme.getButton('Delete Last '+this.getItemTitle())
      .on('click',function() {
        var rows = self.getValue();
        rows.pop();
        self.setValue(rows);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.remove_all_rows_button = this.theme.getButton('Delete All')
      .on('click',function() {
        self.setValue([]);
        self.container.trigger('change');
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
  }
});

