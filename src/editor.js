  /**
   * All editors should extend from this class
   */
  $.jsoneditor.AbstractEditor = Class.extend({
    default: null,
    init: function(options) {
      this.container = options.container;
      this.jsoneditor = options.jsoneditor;
      this.schema = options.schema;
      this.schema = $.jsoneditor.expandSchema(this.schema,this.jsoneditor);
      
      this.theme = this.jsoneditor.data('jsoneditor').theme;

      // Store schema definitions
      if(this.schema.definitions) {
        var definitions = this.jsoneditor.data('jsoneditor').definitions;
        $.each(this.schema.definitions,function(key,schema) {
          definitions[key] = schema;
        });
      }

      this.options = $.extend(true, {}, (this.options || {}), (this.schema.options || {}), options);

      if(!options.path && !this.schema.id) this.schema.id = 'root';
      this.path = options.path || this.schema.id;

      this.key = this.path.split('.').pop();
      this.parent = options.parent;

      this.value = null;

      var tag = options.tag || 'div';
      if(tag === 'td') {
        this.div = this.theme.getTableCell();
      }
      else {
        this.div = $("<"+tag+">");
      }

      this.div.appendTo(this.container);

      // Show field's description as a tooltip
      if(this.schema.description) this.div.attr('title',this.schema.description);

      this.div.data('editor',this);
      this.div.attr('data-schematype',this.schema.type);

      if(this.schema.id) {
        this.div.attr('data-schemaid',this.schema.id);
      }

      this.initialize();

      // If this field has a default value
      this.setValue(this.schema.default || this.default);
    },
    /**
     * Called after constructor
     * Should be overridden
     */
    initialize: function() {

    },
    /**
     * Gets the value from the editor
     * Can be overridden
     * @return The editor's value
     */
    getValue: function() {
      return this.value;
    },
    /**
     * Sets the value of the editor
     * Should be overridden
     * @param value The value to set
     */
    setValue: function(value) {
      this.value = value;
    },
    /**
     * Destroys the editor
     * Child classes should extend this method
     */
    destroy: function() {
      this.div.remove();
      this.value = null;
      this.container = null;
      this.jsoneditor = null;
      this.schema = null;
      this.path = null;
      this.key = null;
      this.parent = null;
      this.div = null;
    }
  });
