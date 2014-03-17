$.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  addProperty: function() {
    this._super();
    this.row_holder.style.display = '';
    if(this.tabs_holder) this.tabs_holder.style.display = '';
    this.controls.style.display = '';
    this.title_controls.style.display = '';
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.row_holder.style.display = 'none';
    if(this.tabs_holder) this.tabs_holder.style.display = 'none';
    this.controls.style.display = 'none';
    this.title_controls.style.display = 'none';
    this.theme.disableHeader(this.title);
  },
  build: function() {
    this.rows = [];
    this.row_cache = [];
    var self = this;

    if(!this.getOption('compact',false)) {
      this.title = this.theme.getHeader(this.getTitle())
      this.container.appendChild(this.title);
      this.title_controls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description)
        this.container.appendChild(this.description);
      }
      this.error_holder = document.createElement('div');
      this.container.appendChild(this.error_holder);

      if(this.schema.format === 'tabs') {
        this.controls = this.theme.getHeaderButtonHolder();
        this.title.appendChild(this.controls);
        this.tabs_holder = this.theme.getTabHolder();
        this.container.appendChild(this.tabs_holder);
        this.row_holder = this.theme.getTabContentHolder(this.tabs_holder);
        this.tabs_holder.appendChild(this.row_holder);

        this.active_tab = null;
      }
      else {
        this.panel = this.theme.getIndentedPanel();
        this.container.appendChild(this.panel);
        this.row_holder = document.createElement('div');
        this.panel.appendChild(this.row_holder);
        this.controls = this.theme.getButtonHolder();
        this.panel.appendChild(this.controls);
      }
    }
    else {
        this.panel = this.theme.getIndentedPanel();
        this.container.appendChild(this.panel);
        this.controls = this.theme.getButtonHolder();
        this.panel.appendChild(this.controls);
        this.row_holder = document.createElement('div');
        this.panel.appendChild(this.row_holder);
    }

    this.row_holder.addEventListener('change',function() {
      self.refreshValue();
    });
    this.row_holder.addEventListener('change_header_text',function() {
      self.refreshTabs(true);
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
          return $extend({},this.schema.additionalItems);
        }
      }
      else {
        return $extend({},this.schema.items[i]);
      }
    }
    else if(this.schema.items) {
      return $extend({},this.schema.items);
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
    var tmp = document.createElement('div');
    this.container.appendChild(tmp);
    
    // Ignore events on this temporary editor
    tmp.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
    tmp.addEventListener('set',function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
    tmp.addEventListener('change_header_text',function(e) {
      e.preventDefault();
      e.stopPropagation();
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

    this.row_holder.appendChild(holder);

    var ret = new editor({
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });

    if(!ret.title_controls) {
      ret.array_controls = this.theme.getButtonHolder();
      holder.appendChild(ret.array_controls);
    }
    
    return ret;
  },
  destroy: function() {
    this.empty(true);
    if(this.title) this.title.parentNode.removeChild(this.title);
    if(this.description) this.description.parentNode.removeChild(this.description);
    if(this.row_holder) this.row_holder.parentNode.removeChild(this.row_holder);
    if(this.controls) this.controls.parentNode.removeChild(this.controls);
    if(this.panel) this.panel.parentNode.removeChild(this.panel);
    
    this.rows = this.row_cache = this.title = this.description = this.row_holder = this.panel = this.controls = null;

    this._super();
  },
  empty: function(hard) {
    if(!this.rows) return;
    var self = this;
    $each(this.rows,function(i,row) {
      if(hard) {
        if(row.tab) row.tab.parentNode.removeChild(row.tab);
        self.destroyRow(row,true);
        self.row_cache[i] = null;
      }
      self.rows[i] = null;
    });
    self.rows = [];
    if(hard) self.row_cache = [];
  },
  destroyRow: function(row,hard) {
    var holder = row.container;
    if(hard) {
      row.destroy();
      holder.parentNode.removeChild(holder);
      if(row.tab) row.tab.parentNode.removeChild(row.tab);
    }
    else {
      if(row.tab) row.tab.style.display = 'none';
      holder.style.display = 'none';
    }
  },
  getMax: function() {
    if((this.schema.items instanceof Array) && this.schema.additionalItems == false) {
      return Math.min(this.schema.items.length,this.schema.maxItems || Infinity);
    }
    else {
      return this.schema.maxItems || Infinity;
    }
  },
  refreshTabs: function(refresh_headers) {
    var self = this;
    $each(this.rows, function(i,row) {
      if(!row.tab) return;

      if(refresh_headers) {
        row.tab_text.textContent = row.getHeaderText();
      }
      else {
        if(row.tab === self.active_tab) {
          self.theme.markTabActive(row.tab);
          row.container.style.display = '';
        }
        else {
          self.theme.markTabInactive(row.tab);
          row.container.style.display = 'none';
        }
      }
    });
  },
  setValue: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];
    
    if(!(value instanceof Array)) value = [value];
    
    var serialized = JSON.stringify(value);
    if(serialized === this.serialized) return;

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
    $each(value,function(i,val) {
      if(self.rows[i]) {
        // TODO: don't set the row's value if it hasn't changed
        self.rows[i].setValue(val);
      }
      else if(self.row_cache[i]) {
        self.rows[i] = self.row_cache[i];
        self.rows[i].setValue(val);
        self.rows[i].container.style.display = '';
        if(self.rows[i].tab) self.rows[i].tab.style.display = '';
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
    $each(self.rows, function(i,row) {
      if(row.tab === self.active_tab) {
        new_active_tab = row.tab;
        return false;
      }
    });
    if(!new_active_tab && self.rows.length) new_active_tab = self.rows[0].tab;

    self.active_tab = new_active_tab;

    self.refreshValue();
    self.refreshTabs();
    
    $triggerc(self.container,'set');
    
    // TODO: sortable
  },
  refreshValue: function() {
    var self = this;
    var oldi = this.value? this.value.length : 0;
    this.value = [];

    $each(this.rows,function(i,editor) {
      // Get the value for this editor
      self.value[i] = editor.getValue();
    });
    
    if(oldi !== this.value.length) {
      // If we currently have minItems items in the array
      var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;
      
      $each(this.rows,function(i,editor) {
        // Hide the move down button for the last row
        if(i === self.rows.length - 1) {
          editor.movedown_button.style.display = 'none';
        }
        else {
          editor.movedown_button.style.display = '';
        }

        // Hide the delete button if we have minItems items
        if(minItems) {
          editor.delete_button.style.display = 'none';
        }
        else {
          editor.delete_button.style.display = '';
        }

        // Get the value for this editor
        self.value[i] = editor.getValue();
      });
      
      if(!this.value.length) {
        this.delete_last_row_button.style.display = 'none';
        this.remove_all_rows_button.style.display = 'none';
      }
      else if(this.value.length === 1) {      
        this.remove_all_rows_button.style.display = 'none';  

        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems) {
          this.delete_last_row_button.style.display = 'none';
        }
        else {
          this.delete_last_row_button.style.display = '';
        }
      }
      else {
        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems) {
          this.delete_last_row_button.style.display = 'none';
          this.delete_last_row_button.style.display = 'none';
        }
        else {
          this.delete_last_row_button.style.display = '';
          this.remove_all_rows_button.style.display = '';
        }
      }

      // If there are maxItems in the array, hide the add button beneath the rows
      if(this.getMax() && this.getMax() <= this.rows.length) {
        this.add_row_button.style.display = 'none';
      }
      else {
        this.add_row_button.style.display = '';
      } 
    }
  },
  addRow: function(value) {
    var self = this;
    var i = this.rows.length;
    
    self.rows[i] = this.getElementEditor(i);
    self.row_cache[i] = self.rows[i];

    if(self.tabs_holder) {
      self.rows[i].tab_text = document.createElement('span');
      self.rows[i].tab_text.textContent = self.rows[i].getHeaderText();
      self.rows[i].tab = self.theme.getTab(self.rows[i].tab_text);
      self.rows[i].tab.addEventListener('click', function(e) {
        self.active_tab = self.rows[i].tab;
        self.refreshTabs();
        e.preventDefault();
        e.stopPropagation();
      });

      self.theme.addTab(self.tabs_holder, self.rows[i].tab);
    }
    
    // Buttons to delete row, move row up, and move row down
    self.rows[i].delete_button = this.getButton(self.getItemTitle(),'delete','Delete '+self.getItemTitle());
    
    self.rows[i].delete_button.className += ' delete';
    self.rows[i].delete_button.setAttribute('data-i',i);
    self.rows[i].delete_button.addEventListener('click',function() {
      var i = this.getAttribute('data-i')*1;

      var value = self.getValue();

      var newval = [];
      var new_active_tab = null;
      $each(value,function(j,row) {
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
      
      self.fireChangeEvent();
    });
    self.rows[i].moveup_button = this.getButton('','moveup','Move up');
    self.rows[i].moveup_button.className += ' moveup';
    self.rows[i].moveup_button.setAttribute('data-i',i);
    self.rows[i].moveup_button.addEventListener('click',function() {
      var i = this.getAttribute('data-i')*1;

      if(i<=0) return;
      var rows = self.getValue();
      var tmp = rows[i-1];
      rows[i-1] = rows[i];
      rows[i] = tmp;

      self.setValue(rows);
      self.active_tab = self.rows[i-1].tab;
      self.refreshTabs();

      self.fireChangeEvent();
    });
    self.rows[i].movedown_button = this.getButton('','movedown','Move down');
    self.rows[i].movedown_button.className += ' movedown';
    self.rows[i].movedown_button.setAttribute('data-i',i);
    self.rows[i].movedown_button.addEventListener('click',function() {
      var i = this.getAttribute('data-i')*1;

      var rows = self.getValue();
      if(i>=rows.length-1) return;
      var tmp = rows[i+1];
      rows[i+1] = rows[i];
      rows[i] = tmp;

      self.setValue(rows);
      self.active_tab = self.rows[i+1].tab;
      self.refreshTabs();
      self.fireChangeEvent();
    });

    var controls_holder = self.rows[i].title_controls || self.rows[i].array_controls;
    if(controls_holder) {
      controls_holder.appendChild(self.rows[i].delete_button);
      if(i) controls_holder.appendChild(self.rows[i].moveup_button);
      controls_holder.appendChild(self.rows[i].movedown_button);
    }

    if(value) self.rows[i].setValue(value);
    self.refreshTabs();
  },
  addControls: function() {
    var self = this;
    
    this.collapsed = false;
    this.toggle_button = this.getButton('','collapse','Collapse');
    this.title_controls.appendChild(this.toggle_button)
    this.title_controls.addEventListener('click',function() {
      if(self.collapsed) {
        self.collapsed = false;
        self.row_holder.style.display = '';
        if(self.tabs_holder) self.tabs_holder.style.display = '';
        self.controls.style.display = '';
        self.setButtonText(this,'','collapse','Collapse');
      }
      else {
        self.collapsed = true;
        self.row_holder.style.display = 'none';
        if(self.tabs_holder) self.tabs_holder.style.display = 'none';
        self.controls.style.display = 'none';
        self.setButtonText(this,'','expand','Expand');
      }
    });

    // If it should start collapsed
    if(this.options.collapsed) {
      $trigger(this.toggle_button.trigger,'click');
    }
    
    // Add "new row" and "delete last" buttons below editor
    this.add_row_button = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle());
    
    this.add_row_button.addEventListener('click',function() {
      var i = self.rows.length;
      if(self.row_cache[i]) {
        self.rows[i] = self.row_cache[i];
        self.rows[i].container.style.display = '';
        if(self.rows[i].tab) self.rows[i].tab.style.display = '';
      }
      else {
        self.addRow();
      }
      self.active_tab = self.rows[i].tab;
      self.refreshTabs();
      self.refreshValue();
      self.fireChangeEvent();
    });
    self.controls.appendChild(this.add_row_button);

    this.delete_last_row_button = this.getButton('Last '+this.getItemTitle(),'delete','Delete Last '+this.getItemTitle());
    this.delete_last_row_button.addEventListener('click',function() {
      var rows = self.getValue();
      
      var new_active_tab = null;
      if(self.rows.length > 1 && self.rows[self.rows.length-1].tab === self.active_tab) new_active_tab = self.rows[self.rows.length-2].tab;
      
      rows.pop();
      self.setValue(rows);
      if(new_active_tab) {
        self.active_tab = new_active_tab;
        self.refreshTabs();
      }
      self.fireChangeEvent();
    })
    self.controls.appendChild(this.delete_last_row_button);

    this.remove_all_rows_button = this.getButton('All','delete','Delete All');
    this.remove_all_rows_button.addEventListener('click',function() {
      self.setValue([]);
      self.fireChangeEvent();
    })
    self.controls.appendChild(this.remove_all_rows_button);

    if(self.tabs) {
      this.add_row_button.style.width = '100%';
      this.add_row_button.style.textAlign = 'left';
      this.add_row_button.style.marginBottom = '3px';
      
      this.delete_last_row_button.style.width = '100%';
      this.delete_last_row_button.style.textAlign = 'left';
      this.delete_last_row_button.style.marginBottom = '3px';
      
      this.remove_all_rows_button.style.width = '100%';
      this.remove_all_rows_button.style.textAlign = 'left';
      this.remove_all_rows_button.style.marginBottom = '3px';
    }
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $each(errors, function(i,error) {
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
        this.error_holder.innerHTML = '';
        this.error_holder.style.display = '';
        $each(my_errors, function(i,error) {
          self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.style.display = 'none';
      }
    }

    // Show errors for child editors
    $each(this.rows, function(i,row) {
      row.showValidationErrors(other_errors);
    });
  }
});
