  /**
   * Turn an element into a schema editor
   * @param options Options (must contain at least a `schema` property)
   *
   * Constructor:
   * $("#container").jsoneditor({
   *   schema: {...}
   * });
   *
   * Set Value:
   * $("#container").jsoneditor('value',{...})
   *
   * Get Value:
   * var value = $("#container").jsoneditor('value');
   *
   * Destroy:
   * $("#container").jsoneditor('destroy');
   */
  $.fn.jsoneditor = function(options) {
    var $this = $(this), d;

    // Get/Set value
    if(options === 'value') {
      d = $this.data('jsoneditor');
      if(!d) return {};

      // Setting value
      if(arguments.length > 1) {
        d.root.setValue(arguments[1]);
        return this;
      }
      // Getting value
      else {
        return d.root.getValue();
      }
    }
    // Destroy editor
    else if(options === 'destroy') {
      d = $this.data('jsoneditor');
      if(!d) return this;
      d.schema = null;
      d.options = null;
      d.root.destroy();
      d = null;
      $this.data('jsoneditor',null);

      return this;
    }

    options = options || {};

    var schema = options.schema;
    var data = options.startval;

    var editor_class = $.jsoneditor.getEditorClass(schema);

    // Store info about the jsoneditor in the element
    var d = {
      schema: schema,
      options: options,
      definitions: {},
      theme: new $.jsoneditor.themes[options.theme || 'bootstrap2']()
    };
    $this.data('jsoneditor',d);

    d.root = new editor_class({
      jsoneditor: $this,
      schema: schema,
      container: $this
    });

    // Starting data
    if(data) d.root.setValue(data);

    return this;
  };

  $.jsoneditor = {
    template: window.swig,
    editors: {},
    themes: {},
    expandSchema: function(schema, editor) {
      if(schema['$ref']) {
        if(!schema['$ref'].match(/^#\/definitions\//g)) {
          throw "JSON Editor only supports local references to schema definitions defined for the root node";
        }
        var key = schema['$ref'].substr(14);
        var definitions = editor.data('jsoneditor').definitions;
        if(!definitions[key]) throw "Schema definition not found - "+schema['$ref'];

        return $.extend(true,{},definitions[key]);
      }
      return schema;
    },
    getEditorClass: function(schema, editor) {
      schema = $.jsoneditor.expandSchema(schema, editor);

      var editor = schema.editor || schema.type;
      if(!$.jsoneditor.editors[editor]) throw "Unknown editor "+editor;
      return $.jsoneditor.editors[editor];
    }
  };
  
