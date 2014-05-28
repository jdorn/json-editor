/*globals $extend, $each, requestAnimationFrame*/
/*jslint vars:true, nomen: true, plusplus: true, white: true*/

var JSONEditor = (function () {'use strict';

function JSONEditor (element,options) {
  options = $extend({},JSONEditor.defaults.options,options||{});
  this.element = element;
  this.options = options;
  this.init();
}

JSONEditor.prototype = {
  init: function() {
    var self = this;
    
    this.ready = false;

    var ThemeClass = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
    if(!ThemeClass) {throw "Unknown theme " + (this.options.theme || JSONEditor.defaults.theme);}
    
    this.schema = this.options.schema;
    this.theme = new ThemeClass();
    this.template = this.options.template;
    this.uuid = 0;
    this.__data = {};
    
    var IconClass = JSONEditor.defaults.iconlibs[this.options.iconlib || JSONEditor.defaults.iconlib];
    if(IconClass) {this.iconlib = new IconClass();}

    this.root_container = this.theme.getContainer();
    this.element.appendChild(this.root_container);

    this.validator = new JSONEditor.Validator(this.schema,{
      ajax: this.options.ajax,
      refs: this.options.refs,
      no_additional_properties: this.options.no_additional_properties,
      required_by_default: this.options.required_by_default
    });
    
    this.validator.ready(function(expanded) {
      if(self.ready) {return;}
      
      self.schema = expanded;
      
      // Create the root editor
      var EditorClass = self.getEditorClass(self.schema);
      self.root = self.createEditor(EditorClass, {
        jsoneditor: self,
        schema: self.schema,
        container: self.root_container,
        required: true
      });

      // Starting data
      if(self.options.startval) {self.root.setValue(self.options.startval);}

      self.ready = true;

      // Fire ready event asynchronously
      requestAnimationFrame(function() {
        self.validation_results = self.validator.validate(self.root.getValue());
        self.root.showValidationErrors(self.validation_results);
        self.trigger('ready');
        self.trigger('change');
      });
    });
  },
  getValue: function() {
    if(!this.ready) {throw "JSON Editor not ready yet.  Listen for 'ready' event before getting the value";}

    return this.root.getValue();
  },
  setValue: function(value) {
    if(!this.ready) {throw "JSON Editor not ready yet.  Listen for 'ready' event before setting the value";}

    this.root.setValue(value);
    return this;
  },
  validate: function(value) {
    if(!this.ready) {throw "JSON Editor not ready yet.  Listen for 'ready' event before validating";}
    
    // Custom value
    if(arguments.length === 1) {
      return this.validator.validate(value);
    }
    // Current value (use cached result)
    return this.validation_results;
  },
  destroy: function() {
    if(this.destroyed) {return;}
    if(!this.ready) {return;}
    
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
  on: function(event, callback) {
    this.callbacks = this.callbacks || {};
    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push(callback);
  },
  off: function(event, callback) {
    // Specific callback
    if(event && callback) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = this.callbacks[event] || [];
      var newcallbacks = [];
      var i;
      for(i=0; i<this.callbacks[event].length; i++) {
        if(this.callbacks[event][i]!==callback) {
          newcallbacks.push(this.callbacks[event][i]);
        }
      }
      this.callbacks[event] = newcallbacks;
    }
    // All callbacks for a specific event
    else if(event) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = [];
    }
    // All callbacks for all events
    else {
      this.callbacks = {};
    }
  },
  trigger: function(event) {
    if(this.callbacks && this.callbacks[event] && this.callbacks[event].length) {
      var i;
      for(i=0; i<this.callbacks[event].length; i++) {
        this.callbacks[event][i]();
      }
    }
  },
  getEditorClass: function(schema) { // , editor
    var classname;

    $each(JSONEditor.defaults.resolvers,function(i,resolver) {
      var tmp = resolver(schema);
      if(tmp) {
        if(JSONEditor.defaults.editors[tmp]) {
          classname = tmp;
          return false;
        }
      }
    });

    if(!classname) {throw "Unknown editor for schema "+JSON.stringify(schema);}
    if(!JSONEditor.defaults.editors[classname]) {throw "Unknown editor "+classname;}

    return JSONEditor.defaults.editors[classname];
  },
  createEditor: function(EditorClass, options) {
    options = $extend({},EditorClass.options||{},options);
    return new EditorClass(options);
  },
  onChange: function() {
    if(!this.ready) {return;}
    
    if(this.firing_change) {return;}
    this.firing_change = true;
    
    var self = this;
    
    requestAnimationFrame(function() {
      self.firing_change = false;
      
      // Validate and cache results
      self.validation_results = self.validator.validate(self.root.getValue());
      self.root.showValidationErrors(self.validation_results);
      
      // Fire change event
      self.trigger('change');
    });
  },
  compileTemplate: function(template, name) {
    name = name || JSONEditor.defaults.template;

    var engine;

    // Specifying a preset engine
    if(typeof name === 'string') {
      if(!JSONEditor.defaults.templates[name]) {throw "Unknown template engine "+name;}
      engine = JSONEditor.defaults.templates[name]();

      if(!engine) {throw "Template engine "+name+" missing required library.";}
    }
    // Specifying a custom engine
    else {
      engine = name;
    }

    if(!engine) {throw "No template engine set";}
    if(!engine.compile) {throw "Invalid template engine set";}

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
      if(!el.hasAttribute('data-jsoneditor-'+key)) {return null;}
      
      return this.__data[el.getAttribute('data-jsoneditor-'+key)];
    }
  },
  registerEditor: function(editor) {
    this.editors = this.editors || {};
    this.editors[editor.path] = editor;
    return this;
  },
  unregisterEditor: function(editor) {
    this.editors = this.editors || {};
    this.editors[editor.path] = null;
    return this;
  },
  getEditor: function(path) {
    if(!this.editors) {return;}
    return this.editors[path];
  },
  watch: function(path,callback) {
    this.watchlist = this.watchlist || {};
    this.watchlist[path] = this.watchlist[path] || [];
    this.watchlist[path].push(callback);
    
    return this;
  },
  unwatch: function(path,callback) {
    if(!this.watchlist || !this.watchlist[path]) {return this;}
    // If removing all callbacks for a path
    if(!callback) {
      this.watchlist[path] = null;
      return this;
    }
    
    var newlist = [];
    var i;
    for(i=0; i<this.watchlist[path].length; i++) {
      if(this.watchlist[path][i] !== callback) {
        newlist.push(this.watchlist[path][i]);
      }
    }
    this.watchlist[path] = newlist.length? newlist : null;
    return this;
  },
  notifyWatchers: function(path) {
    if(!this.watchlist || !this.watchlist[path]) {return this;}
    var i;
    for(i=0; i<this.watchlist[path].length; i++) {
      this.watchlist[path][i]();
    }
  },
  isEnabled: function() {
    return !this.root || this.root.isEnabled();
  },
  enable: function() {
    this.root.enable();
  },
  disable: function() {
    this.root.disable();
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
return JSONEditor;

}());
