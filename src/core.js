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
    if(!d) throw "JSON Editor must be instantiated before getting or setting the value";
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before getting/setting the value";

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
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before destroying";
    d.schema = null;
    d.options = null;
    d.root.destroy();
    d = null;
    $this.data('jsoneditor',null);

    return this;
  }
  // Validate
  else if(options === 'validate') {
    d = $this.data('jsoneditor');
    if(!d) throw "JSON Editor must be instantiated before trying to validate";
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before running validation";
    
    d.root.isValid(arguments[1]);
    
    return this;
  }

  options = options || {};

  var schema = options.schema;
  var data = options.startval;

  var editor_class = $.jsoneditor.getEditorClass(schema);

  var theme_class = $.jsoneditor.themes[options.theme || $.jsoneditor.theme];

  if(!theme_class) throw "Unknown theme " + (options.theme || $.jsoneditor.theme);

  // Store info about the jsoneditor in the element
  var d = {
    schema: schema,
    options: options,
    refs: {},
    theme: new theme_class(),
    template: options.template,
    ready: false
  };
  $this.data('jsoneditor',d);

  var load = function() {
    if(d.ready) return;
    
    d.root = new editor_class({
      jsoneditor: $this,
      schema: schema,
      container: $this
    });

    // Starting data
    if(data) d.root.setValue(data);
    
    d.ready = true;
    $this.trigger('ready');
  }

  // Recursively look for $ref urls in the schema and load them before building the editor
  var waiting = 0;
  var finished = 0;
  var getRefs = function(schema) {
    $.each(schema, function(i,value) {
      // If this is an external url we need to load
      if(i === "$ref" && value.match(/^http/) && !d.refs[value]) {
        d.refs[value] = 'loading';
        waiting++;
        $.getJSON(value,function(json) {
          d.refs[value] = json;
          
          // Check this external schema for further $refs
          getRefs(json);
          
          finished++;
          
          // If we're done
          if(finished >= waiting) {
            load();
          }
        }).fail(function() {
          throw "Failed to load ref - "+value;
        });
      }
      else if(typeof value == "object") {
        getRefs(value);
      }
    });    
  };
  getRefs(d.schema);
  if(!waiting) load();

  return this;
};

$.jsoneditor = {
  template: null,
  theme:null,
  editors: {},
  templates: {},
  themes: {},
  resolvers: [],

  // Helper functions
  expandSchema: function(schema, editor) {
    // Schema has a reference to another schema
    if(schema['$ref']) {
      // Reference to local schema or external url (previously loaded and cached)
      if(schema['$ref'].match(/^(#\/definitions\/|http)/)) {
        var refs = editor.data('jsoneditor').refs;
        if(!refs[schema['$ref']]) throw "Schema definition not found - "+schema['$ref'];

        return $.extend(true,{},refs[schema['$ref']],schema);
      }
      else {
        throw "Unsupported $ref - "+schema['$ref'];
      }
    }
    return schema;
  },
  getEditorClass: function(schema, editor) {
    schema = $.jsoneditor.expandSchema(schema, editor);

    var classname;

    if(schema.editor) classname = schema.editor;
    else {
      $.each($.jsoneditor.resolvers,function(i,resolver) {
        var tmp;
        if(tmp = resolver(schema)) {
          if($.jsoneditor.editors[tmp]) {
            classname = tmp;
            return false;
          }
        }
      });
    }

    if(!classname) throw "Unknown editor for schema "+JSON.stringify(schema);
    if(!$.jsoneditor.editors[classname]) throw "Unknown editor "+classname;

    return $.jsoneditor.editors[classname];
  },
  compileTemplate: function(template, name) {
    name = name || $.jsoneditor.template;

    var engine;

    // Specifying a preset engine
    if(typeof name === 'string') {
      if(!$.jsoneditor.templates[name]) throw "Unknown template engine "+name;
      engine = $.jsoneditor.templates[name]();

      if(!engine) throw "Template engine "+name+" missing required library.";
    }
    // Specifying a custom engine
    else {
      engine = name;
    }

    if(!engine) throw "No template engine set";
    if(!engine.compile) throw "Invalid template engine set";

    return engine.compile(template);
  }
};

