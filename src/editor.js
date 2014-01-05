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

    this.build();

    this.setValue(this.getDefault(), true);
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
    this.value = null;
    this.container = null;
    this.jsoneditor = null;
    this.schema = null;
    this.path = null;
    this.key = null;
    this.parent = null;
  },
  isRequired: function() {
    return this.options.required || this.schema.required===true;
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
  }
});
