var JSONEditor = function(element,options) {
  options = options || {};
  this.element = element;
  this.options = options;
  this.init();
};
JSONEditor.prototype = {
  init: function() {
    var self = this;
    
    this.ready = false;

    var theme_class = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
    if(!theme_class) throw "Unknown theme " + (this.options.theme || JSONEditor.defaults.theme);
    
    this.schema = this.options.schema;
    this.theme = new theme_class();
    this.template = this.options.template;
    this.uuid = 0;
    this.__data = {};
    
    var icon_class = JSONEditor.defaults.iconlibs[this.options.iconlib || JSONEditor.defaults.iconlib];
    if(icon_class) this.iconlib = new icon_class();

    this.root_container = this.theme.getContainer();
    this.element.appendChild(this.root_container);

    // Stop all change/set events while the editor is initializing
    var change_blocker = function(e) {
      if(!self.ready) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    this.root_container.addEventListener('change',change_blocker);
    
    // Re-run and cache validation when anything changes
    var validate_cache = function() {
      if(!self.ready) return;
      
      // Validate and cache results
      self.validation_results = self.validator.validate(self.root.getValue());
      self.root.showValidationErrors(self.validation_results);
    }
    this.root_container.addEventListener('change',validate_cache);
    this.root_container.addEventListener('set',validate_cache);

    this.validator = new JSONEditor.Validator(this.schema,{
      ajax: this.options.ajax,
      refs: this.options.refs,
      no_additional_properties: this.options.no_additional_properties,
      required_by_default: this.options.required_by_default
    });
    
    this.validator.ready(function(expanded) {
      if(self.ready) return;
      
      self.schema = expanded;
      
      // Create the root editor
      var editor_class = self.getEditorClass(self.schema);
      self.root = new editor_class({
        jsoneditor: self,
        schema: self.schema,
        container: self.root_container,
        required: true
      });

      // Starting data
      if(self.options.startval) self.root.setValue(self.options.startval);

      self.validation_results = self.validator.validate(self.root.getValue());
      self.root.showValidationErrors(self.validation_results);

      self.ready = true;

      // Fire ready event asynchronously
      _raf(function() {
        $triggerc(self.element,'ready');
        $trigger(self.element,'change');
      });
    });
  },
  getValue: function() {
    if(!this.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before getting the value";

    return this.root.getValue();
  },
  setValue: function(value) {
    if(!this.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before setting the value";

    this.root.setValue(value);
    return this;
  },
  validate: function(value) {
    if(!this.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before validating";
    
    // Custom value
    if(arguments.length === 1) {
      return this.validator.validate(arguments[1]);
    }
    // Current value (use cached result)
    else {
      return this.validation_results;
    }
  },
  destroy: function() {
    if(this.destroyed) return;
    if(!this.ready) return;
    
    this.schema = null;
    this.options = null;
    this.root.destroy();
    this.root = null;
    this.root_container = null;
    this.validator = null;
    this.validation_results = null;
    this.theme = null;
    this.iconlib = null;
    this.template = null;
    this.__data = null;
    this.ready = false;
    this.element.innerHTML = '';
    
    this.destroyed = true;
  },
  getEditorClass: function(schema, editor) {
    var classname;

    $each(JSONEditor.defaults.resolvers,function(i,resolver) {
      var tmp;
      if(tmp = resolver(schema)) {
        if(JSONEditor.defaults.editors[tmp]) {
          classname = tmp;
          return false;
        }
      }
    });

    if(!classname) throw "Unknown editor for schema "+JSON.stringify(schema);
    if(!JSONEditor.defaults.editors[classname]) throw "Unknown editor "+classname;

    return JSONEditor.defaults.editors[classname];
  },
  compileTemplate: function(template, name) {
    name = name || JSONEditor.defaults.template;

    var engine;

    // Specifying a preset engine
    if(typeof name === 'string') {
      if(!JSONEditor.defaults.templates[name]) throw "Unknown template engine "+name;
      engine = JSONEditor.defaults.templates[name]();

      if(!engine) throw "Template engine "+name+" missing required library.";
    }
    // Specifying a custom engine
    else {
      engine = name;
    }

    if(!engine) throw "No template engine set";
    if(!engine.compile) throw "Invalid template engine set";

    return engine.compile(template);
  },
  _data: function(el,key,value) {
    // Setting data
    if(arguments.length === 3) {
      var uuid;
      if(el.hasAttribute('data-jsoneditor-'+key)) {
        uuid = el.getAttribute('data-jsoneditor-'+key);
      }
      else {
        uuid = this.uuid++;
        el.setAttribute('data-jsoneditor-'+key,uuid);
      }
    
      this.__data[uuid] = value;
    }
    // Getting data
    else {
      // No data stored
      if(!el.hasAttribute('data-jsoneditor-'+key)) return null;
      
      return this.__data[el.getAttribute('data-jsoneditor-'+key)];
    }
  }
};

JSONEditor.defaults = {
  themes: {},
  templates: {},
  iconlibs: {},
  editors: {},
  resolvers: [],
  custom_validators: []
};
