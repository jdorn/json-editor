/**
 * All editors should extend from this class
 */
$.jsoneditor.AbstractEditor = Class.extend({
  init: function(options) {
    this.container = options.container;
    this.jsoneditor = options.jsoneditor;
    this.schema = options.schema;
    this.schema = $.jsoneditor.expandSchema(this.schema,this.jsoneditor);

    this.theme = this.jsoneditor.data('jsoneditor').theme;
    this.template_engine = this.jsoneditor.data('jsoneditor').template;

    // Store schema definitions for root node
    if(!options.path && this.schema.definitions) {
      var refs = this.jsoneditor.data('jsoneditor').refs;
      $.each(this.schema.definitions,function(key,schema) {
        refs['#/definitions/'+key] = schema;
      });
    }

    this.options = $.extend(true, {}, (this.options || {}), (this.schema.options || {}), options);

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
    return this.options.required;
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
  }
});
