$.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  addProperty: function() {
    this._super();
    this.row_holder.show(500);
    if(this.tabs_holder) this.tabs_holder.show(500);
    this.controls.show(500);
    this.title_controls.show(500);
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.row_holder.hide(500);
    if(this.tabs_holder) this.tabs_holder.hide(500);
    this.controls.hide(500);
    this.title_controls.hide(500);
    this.theme.disableHeader(this.title);
  },
  build: function() {
    this.rows = [];
    var self = this;

    if(!this.getOption('compact',false)) {
      this.header = $("<span>").text(this.getTitle());
      this.title = this.theme.getHeader(this.header).appendTo(this.container);
      this.title_controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
      if(this.schema.description) this.description = this.theme.getDescription(this.schema.description).appendTo(this.container);
      this.error_holder = $("<div></div>").appendTo(this.container);

      if(this.schema.format === 'tabs') {
        this.controls = this.theme.getHeaderButtonHolder().appendTo(this.title);
        this.tabs_holder = this.theme.getTabHolder().appendTo(this.container);
        this.row_holder = this.theme.getTabContentHolder(this.tabs_holder);

        this.active_tab = null;
      }
      else {
        this.panel = this.theme.getIndentedPanel().appendTo(this.container);
        this.row_holder = $("<div>").appendTo(this.panel);
        this.controls = this.theme.getButtonHolder().appendTo(this.panel);
      }
    }
    else {
      this.panel = this.theme.getIndentedPanel().appendTo(this.container);
      this.controls = this.theme.getButtonHolder().appendTo(this.panel);
      this.row_holder = $("<div>").appendTo(this.panel);
    }

    this.row_holder.on('change',function() {
      self.refreshValue();
    });
    this.row_holder.on('change.header_text',function() {
      self.refreshTabs();
    });
    
    // Add controls
    this.addControls();
  },
  getItemTitle: function() {
    return (this.schema.items && this.schema.items.title) || 'item';
  },
  getItemSchema: function(i) {
    if(this.schema.items instanceof Array) {
      if(i >= this.schema.items.length) {
        if(this.schema.additionalItems===true) {
          return {};
        }
        else if(this.schema.additionalItems) {
          return $.extend(true,{},this.schema.additionalItems);
        }
      }
      else {
        return $.extend(true,{},this.schema.items[i]);
      }
    }
    else if(this.schema.items) {
      return $.extend(true,{},this.schema.items);
    }
    else {
      return {};
    }
  },
  getItemInfo: function(i) {
    // Get the schema for this item
    var schema = this.getItemSchema(i);
    
    // Check if it's cached
    this.item_info = this.item_info || {};
    var stringified = JSON.stringify(schema);
    if(typeof this.item_info[stringified] !== "undefined") return this.item_info[stringified];
    
    // Create a temporary editor with this schema and get info
    var tmp = $("<div>").appendTo(this.container);
    
    // Ignore events on this temporary editor
    tmp.on('change set',function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    var editor = $.jsoneditor.getEditorClass(schema, this.jsoneditor);
    editor = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: tmp,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });
    this.item_info[stringified] = {
      child_editors: editor.getChildEditors()? true : false,
      title: schema.title || 'item',
      default: editor.getDefault()
    };
    editor.destroy();
    tmp.remove();
    
    return this.item_info[stringified];
  },
  getElementEditor: function(i) {
    var item_info = this.getItemInfo(i);
    var schema = this.getItemSchema(i);
    schema.title = item_info.title+' '+i;

    var editor = $.jsoneditor.getEditorClass(schema, this.jsoneditor);

    var holder;
    if(this.tabs_holder) {
      holder = this.theme.getTabContent();
    }
    else if(item_info.child_editors) {
      holder = this.theme.getChildEditorHolder();
    }
    else {
      holder = this.theme.getIndentedPanel();
    }

    holder.appendTo(this.row_holder);

    var ret = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });

    if(!ret.title_controls) {
      ret.array_controls = this.theme.getButtonHolder().appendTo(holder);
    }
    
    return ret;
  },
  destroy: function() {
    this.empty();
    if(this.title) this.title.remove();
    if(this.description) this.description.remove();
    if(this.row_holder) this.row_holder.remove();
    if(this.controls) this.controls.remove();
    if(this.panel) this.panel.remove();
    
    this.rows = this.title = this.description = this.row_holder = this.panel = this.controls = null;

    this._super();
  },
  empty: function() {
    if(!this.rows) return;
    var self = this;
    $.each(this.rows,function(i,row) {
      self.destroyRow(row);
      self.rows[i] = null;
    });
    self.rows = [];

  },
  destroyRow: function(row) {
    var holder = row.container;
    if(row.tab) row.tab.remove();
    row.destroy();
    holder.remove();
  },
  getMax: function() {
    if((this.schema.items instanceof Array) && this.schema.additionalItems == false) {
      return Math.min(this.schema.items.length,this.schema.maxItems || Infinity);
    }
    else {
      return this.schema.maxItems || Infinity;
    }
  },
  refreshTabs: function() {
    var self = this;
    $.each(this.rows, function(i,row) {
      if(!row.tab) return;

      row.tab_text.text(row.getHeaderText());

      if(row.tab === self.active_tab) {
        self.theme.markTabActive(row.tab);
        row.container.show();
      }
      else {
        self.theme.markTabInactive(row.tab);
        row.container.hide();
      }
    });
  },
  setValue: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];
    
    if(!(value instanceof Array)) value = [value];

    // Make sure value has between minItems and maxItems items in it
    if(this.schema.minItems) {
      while(value.length < this.schema.minItems) {
        value.push(this.getItemInfo(value.length).default);
      }
    }
    if(this.getMax() && value.length > this.getMax()) {
      value = value.slice(0,this.getMax());
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
      self.destroyRow(self.rows[j]);
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    // Set the active tab
    var new_active_tab = null;
    $.each(self.rows, function(i,row) {
      if(row.tab === self.active_tab) {
        new_active_tab = row.tab;
        return false;
      }
    });
    if(!new_active_tab && self.rows.length) new_active_tab = self.rows[0].tab;

    self.active_tab = new_active_tab;

    self.refreshValue();
    self.refreshTabs();
    
    self.container.trigger('set');
    
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
    if(this.getMax() && this.getMax() <= this.rows.length) {
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

    if(self.tabs_holder) {
      self.rows[i].tab_text = $("<span>");
      self.rows[i].tab = self.theme.getTab(self.rows[i].tab_text)
        .on('click', function() {
          self.active_tab = self.rows[i].tab;
          self.refreshTabs();
          return false;
        });

      self.theme.addTab(self.tabs_holder, self.rows[i].tab);
    }
    
    // Buttons to delete row, move row up, and move row down
    self.rows[i].delete_button = this.getButton(self.getItemTitle(),'delete','Delete '+self.getItemTitle())
      .addClass('delete')
      .data('i',i)
      .on('click',function() {
        var i = $(this).data('i');

        var value = self.getValue();

        var newval = [];
        var new_active_tab = null;
        $.each(value,function(j,row) {
          if(j===i) {
            // If the one we're deleting is the active tab
            if(self.rows[j].tab === self.active_tab) {
              // Make the next tab active if there is one
              if(self.rows[j+1]) new_active_tab = self.rows[j+1].tab;
              // Otherwise, make the previous tab active if there is one
              else if(j) new_active_tab = self.rows[j-1].tab;
            }
            
            return; // If this is the one we're deleting
          }
          newval.push(row);
        });
        self.setValue(newval);
        if(new_active_tab) {
          self.active_tab = new_active_tab;
          self.refreshTabs();
        }
        
        self.container.trigger('change');
      });
    self.rows[i].moveup_button = this.getButton('','moveup','Move up')
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
        self.active_tab = self.rows[i-1].tab;
        self.refreshTabs();

        self.container.trigger('change');
      });
    self.rows[i].movedown_button = this.getButton('','movedown','Move down')
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
        self.active_tab = self.rows[i+1].tab;
        self.refreshTabs();
        self.container.trigger('change');
      });

    var controls_holder = self.rows[i].title_controls || self.rows[i].array_controls;
    if(controls_holder) {
      controls_holder.append(self.rows[i].delete_button);
      if(i) controls_holder.append(self.rows[i].moveup_button);
      controls_holder.append(self.rows[i].movedown_button);
    }

    if(value) self.rows[i].setValue(value);
    self.refreshTabs();
  },
  addControls: function() {
    var self = this;
    
    this.collapsed = false;
    this.toggle_button = this.getButton('','collapse','Collapse').appendTo(this.title_controls).on('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.row_holder.show(300);
        if(self.tabs_holder) self.tabs_holder.show(300);
        self.controls.show(300);
        self.setButtonText($(this),'','collapse','Collapse');
      }
      else {
        self.collapsed = true;
        self.row_holder.hide(300);
        if(self.tabs_holder) self.tabs_holder.hide(300);
        self.controls.hide(300);
        self.setButtonText($(this),'','expand','Expand');
      }
    });

    // If it should start collapsed
    if(this.options.collapsed) {
      this.toggle_button.trigger('click');
    }
    
    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle())
      .on('click',function() {
        self.addRow();
        self.active_tab = self.rows[self.rows.length-1].tab;
        self.refreshTabs();
        self.refreshValue();
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.delete_last_row_button = this.getButton('Last '+this.getItemTitle(),'delete','Delete Last '+this.getItemTitle())
      .on('click',function() {
        var rows = self.getValue();
        
        var new_active_tab = null;
        if(self.rows.length > 1 && self.rows[self.rows.length-1].tab === self.active_tab) new_active_tab = self.rows[self.rows.length-2].tab;
        
        rows.pop();
        self.setValue(rows);
        if(new_active_tab) {
          self.active_tab = new_active_tab;
          self.refreshTabs();
        }
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    this.remove_all_rows_button = this.getButton('All','delete','Delete All')
      .on('click',function() {
        self.setValue([]);
        self.container.trigger('change');
      })
      .appendTo(self.controls);

    if(self.tabs) {
      this.add_row_button.css({
        width: '100%',
        textAlign: 'left',
        marginBottom: 3
      });
      this.delete_last_row_button.css({
        width: '100%',
        textAlign: 'left',
        marginBottom: 3
      });
      this.remove_all_rows_button.css({
        width: '100%',
        textAlign: 'left',
        marginBottom: 3
      });

      // Make rows sortable
      this.tabs
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
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $.each(errors, function(i,error) {
      if(error.path === self.path) {
        my_errors.push(error);
      }
      else {
        other_errors.push(error);
      }
    });

    // Show errors for this editor
    if(this.error_holder) {
      if(my_errors.length) {
        var message = [];
        this.error_holder.empty().show();
        $.each(my_errors, function(i,error) {
          self.error_holder.append(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.hide();
      }
    }

    // Show errors for child editors
    $.each(this.rows, function(i,row) {
      row.showValidationErrors(other_errors);
    });
  }
});
