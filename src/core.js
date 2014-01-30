/**
 * Turn an element into a schema editor
 * @param options Options (must contain at least a `schema` property)
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
    $this.empty();

    return this;
  }
  // Validate
  else if(options === 'validate') {
    d = $this.data('jsoneditor');
    if(!d) throw "JSON Editor must be instantiated before trying to validate";
    if(!d.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before running validation";

    // Custom value to validate
    if(arguments.length > 1) {
      return d.validator.validate(arguments[1]);
    }
    // Current value (use cached result)
    else {
      return d.validation_results;
    }
  }

  options = options || {};

  var schema = options.schema;
  var data = options.startval;

  var theme_class = $.jsoneditor.themes[options.theme || $.jsoneditor.theme];

  if(!theme_class) throw "Unknown theme " + (options.theme || $.jsoneditor.theme);
  

  // Store info about the jsoneditor in the element
  d = {
    schema: schema,
    options: options,
    refs: {},
    theme: new theme_class(),
    template: options.template,
    ready: false
  };
  
  var icon_class = $.jsoneditor.iconlibs[options.iconlib || $.jsoneditor.iconlib];
  if(icon_class) d.iconlib = new icon_class();
  
  $this.data('jsoneditor',d);

  d.root_container = d.theme.getContainer().appendTo($this);

  // Stop all change events before the editor is ready
  d.root_container.on('change',function(e) {
    if(!d.ready) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Validate and cache results
    d.validation_results = d.validator.validate(d.root.getValue());
    d.root.showValidationErrors(d.validation_results);
  });

  // Let the validator resolve references in the schema asynchronously
  d.validator = new $.jsoneditor.Validator(schema,{
    ajax: options.ajax,
    refs: options.refs
  });
  d.validator.ready(function(expanded) {
    if(d.ready) return;
    
    d.schema = expanded;
    
    var editor_class = $.jsoneditor.getEditorClass(d.schema);
    d.root = new editor_class({
      jsoneditor: $this,
      schema: d.schema,
      container: d.root_container,
      required: true
    });

    // Starting data
    if(data) d.root.setValue(data);

    d.validation_results = d.validator.validate(d.root.getValue());
    d.root.showValidationErrors(d.validation_results);

    d.ready = true;

    // Fire ready event asynchronously
    window.setTimeout(function() {
      $this.trigger('ready');
      $this.trigger('change');
    });
  });

  return this;
};

$.jsoneditor = {
  template: null,
  theme:null,
  iconlib: null,
  editors: {},
  templates: {},
  themes: {},
  iconlibs: {},
  resolvers: [],
  custom_validators: [],

  getEditorClass: function(schema, editor) {
    var classname;

    $.each($.jsoneditor.resolvers,function(i,resolver) {
      var tmp;
      if(tmp = resolver(schema)) {
        if($.jsoneditor.editors[tmp]) {
          classname = tmp;
          return false;
        }
      }
    });

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

