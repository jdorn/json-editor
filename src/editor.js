/**
 * All editors should extend from this class
 */
$.jsoneditor.AbstractEditor = Class.extend({
  init: function(options) {
    this.container = options.container;
    this.jsoneditor = options.jsoneditor;

    this.theme = this.jsoneditor.data('jsoneditor').theme;
    this.template_engine = this.jsoneditor.data('jsoneditor').template;

    this.options = $.extend(true, {}, (this.options || {}), (options.schema.options || {}), options);
    this.schema = this.options.schema;

    if(!options.path && !this.schema.id) this.schema.id = 'root';
    this.path = options.path || 'root';
    if(this.schema.id) this.container.attr('data-schemaid',this.schema.id);
    this.container.attr('data-schemapath',this.path);
    this.container.data('editor',this);

    this.key = this.path.split('.').pop();
    this.parent = options.parent;
    
    // If not required, add an add/remove property link
    if(!this.isRequired() && !this.options.compact) {
      this.title_links = this.theme.getFloatRightLinkHolder().appendTo(this.container);

      this.addremove = this.theme.getLink('remove '+this.getTitle()).appendTo(this.title_links);
      
      var self = this;
      this.addremove.on('click',function() {
        if(self.property_removed) {
          self.addProperty();
        }
        else {
          self.removeProperty();
        }
      
        self.container.trigger('change');
        return false;
      });
    }
    
    // Watched fields
    this.watched = {};
    if(this.schema.vars) this.schema.watch = this.schema.vars;
    this.watched_values = {};
    if(this.schema.watch) {
      this.watch_listener = function() {
        if(self.refreshWatchedFieldValues()) {
          self.onWatchedFieldChange();
        }
      };
      $.each(this.schema.watch, function(name, path) {
        var path_parts;
        if(path instanceof Array) {
          path_parts = [path[0]].concat(path[1].split('.'));
        }
        else {
          path_parts = path.split('.'); 
          if(!self.container.closest('[data-schemaid="'+path_parts[0]+'"]').length) path_parts.unshift('#');
        }
        var first = path_parts.shift();

        if(first === '#') first = self.jsoneditor.data('jsoneditor').schema.id || 'root';

        // Find the root node for this template variable
        var root = self.container.closest('[data-schemaid="'+first+'"]');
        if(!root.length) throw "Could not find ancestor node with id "+first;

        // Keep track of the root node and path for use when rendering the template
        var adjusted_path = root.data('editor').path + '.' + path_parts.join('.');
        self.watched[name] = {
          root: root,
          path: path_parts,
          adjusted_path: adjusted_path
        };

        // Listen for changes to the variable field
        root.on('change',self.watch_listener);
        root.on('set',self.watch_listener);
      });
    }

    this.build();
    
    this.setValue(this.getDefault(), true);

    if(this.watch_listener) {
      this.watch_listener();
    }
  },
  refreshWatchedFieldValues: function() {
    var watched = {};
    var changed = false;
    var self = this;
    $.each(this.watched,function(name,attr) {
      var obj = attr.root.data('editor').getValue();
      var current_part = -1;
      var val = null;
      // Use "path.to.property" to get root['path']['to']['property']
      while(1) {
        current_part++;
        if(current_part >= attr.path.length) {
          val = obj;
          break;
        }

        if(!obj || typeof obj[attr.path[current_part]] === "undefined") {
          break;
        }

        obj = obj[attr.path[current_part]];
      }
      if(self.watched_values[name] !== val) changed = true;
      watched[name] = val;
    });
    this.watched_values = watched;
    
    return changed;
  },
  getWatchedFieldValues: function() {
    return this.watched_values;
  },
  onWatchedFieldChange: function() {
    
  },
  addProperty: function() {
    this.property_removed = false;
    this.addremove.text('remove '+this.getTitle());
  },
  removeProperty: function() {
    this.property_removed = true;
    this.addremove.text('add '+this.getTitle());
  },
  build: function() {

  },
  isValid: function(callback) {
    callback();
  },
  setValue: function(value) {
    this.value = value;
  },
  getValue: function() {
    return this.value;
  },
  refreshValue: function() {

  },
  getChildEditors: function() {
    return false;
  },
  destroy: function() {
    var self = this;
    $.each(this.watched,function(name,attr) {
      attr.root.off('change',self.watch_listener);
      attr.root.off('set',self.watch_listener);
    });
    this.watched = null;
    this.watched_values = null;
    this.watch_listener = null;
    this.value = null;
    this.container = null;
    this.jsoneditor = null;
    this.schema = null;
    this.path = null;
    this.key = null;
    this.parent = null;
  },
  isRequired: function() {
    if(typeof this.options.required !== "undefined") {
      return this.options.required;
    }
    else if(typeof this.schema.required === "boolean") {
      return this.schema.required;
    }
    else if(this.jsoneditor.data('jsoneditor').options.required_by_default) {
      return true
    }
    else {
      return false;
    }
  },
  getDefault: function() {
    return this.schema.default || null;
  },

  getTheme: function() {
    return this.theme;
  },
  getSchema: function() {
    return this.schema;
  },
  getContainer: function() {
    return this.container;
  },
  getTitle: function() {
    return this.schema.title || this.key;
  },
  getPath: function() {
    return this.path;
  },
  getParent: function() {
    return this.parent;
  },
  getOption: function(key, def) {
    if(typeof this.options[key] !== 'undefined') return this.options[key];
    else return def;
  },
  getDisplayText: function(arr) {
    var disp = [];
    var used = {};
    
    // Determine display text for each element of the array
    $.each(arr,function(i,el)  {
      var name;
      
      // If it's a simple string
      if(typeof el === "string") name = el;
      // Object
      else if(el.title && !used[el.title]) name = el.title;
      else if(el.format && !used[el.format]) name = el.format;
      else if(el.description && !used[el.description]) name = el.descripton;
      else if(el.type && !used[el.type]) name = el.type;
      else if(el.title) name = el.title;
      else if(el.format) name = el.format;
      else if(el.description) name = el.description;
      else if(el.type) name = el.type;
      else if(JSON.stringify(el).length < 50) name = JSON.stringify(el);
      else name = "type";
      
      used[name] = used[name] || 0;
      used[name]++;
      
      disp.push(name);
    });
    
    // Replace identical display text with "text 1", "text 2", etc.
    var inc = {};
    $.each(disp,function(i,name) {
      inc[name] = inc[name] || 0;
      inc[name]++;
      
      if(used[name] > 1) disp[i] = name + " " + inc[name];
    });
    
    return disp;
  },
  showValidationErrors: function(errors) {

  }
});
