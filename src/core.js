var JSONEditor = function(element,options) {
  if (!(element instanceof Element)) {
    throw new Error('element should be an instance of Element');
  }
  options = $extend({},JSONEditor.defaults.options,options||{});
  this.element = element;
  this.options = options;
  this.init();
};
JSONEditor.prototype = {
  // necessary since we remove the ctor property by doing a literal assignment. Without this
  // the $isplainobject function will think that this is a plain object.
  constructor: JSONEditor,
  init: function() {
    var self = this;
    
    this.ready = false;

    var theme_class = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
    if(!theme_class) throw "Unknown theme " + (this.options.theme || JSONEditor.defaults.theme);
    
    this.schema = this.options.schema;
    this.theme = new theme_class();
    this.template = this.options.template;
    this.refs = this.options.refs || {};
    this.uuid = 0;
    this.__data = {};
    
    var icon_class = JSONEditor.defaults.iconlibs[this.options.iconlib || JSONEditor.defaults.iconlib];
    if(icon_class) this.iconlib = new icon_class();

    this.root_container = this.theme.getContainer();
    this.element.appendChild(this.root_container);
    
    this.translate = this.options.translate || JSONEditor.defaults.translate;

    // Fetch all external refs via ajax
    this._loadExternalRefs(this.schema, function() {
      self._getDefinitions(self.schema);
      
      // Validator options
      var validator_options = {};
      if(self.options.custom_validators) {
        validator_options.custom_validators = self.options.custom_validators;
      }
      self.validator = new JSONEditor.Validator(self,null,validator_options);
      
      // Create the root editor
      var editor_class = self.getEditorClass(self.schema);
      self.root = self.createEditor(editor_class, {
        jsoneditor: self,
        schema: self.schema,
        required: true,
        container: self.root_container
      });
      
      self.root.preBuild();
      self.root.build();
      self.root.postBuild();

      // Starting data
      if(self.options.startval) self.root.setValue(self.options.startval);

      self.validation_results = self.validator.validate(self.root.getValue());
      self.root.showValidationErrors(self.validation_results);
      self.ready = true;

      // Fire ready event asynchronously
      window.requestAnimationFrame(function() {
        if(!self.ready) return;
        self.validation_results = self.validator.validate(self.root.getValue());
        self.root.showValidationErrors(self.validation_results);
        self.trigger('ready');
        self.trigger('change');
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
      return this.validator.validate(value);
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
  on: function(event, callback) {
    this.callbacks = this.callbacks || {};
    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push(callback);
    
    return this;
  },
  off: function(event, callback) {
    // Specific callback
    if(event && callback) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = this.callbacks[event] || [];
      var newcallbacks = [];
      for(var i=0; i<this.callbacks[event].length; i++) {
        if(this.callbacks[event][i]===callback) continue;
        newcallbacks.push(this.callbacks[event][i]);
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
    
    return this;
  },
  trigger: function(event) {
    if(this.callbacks && this.callbacks[event] && this.callbacks[event].length) {
      for(var i=0; i<this.callbacks[event].length; i++) {
        this.callbacks[event][i]();
      }
    }
    
    return this;
  },
  setOption: function(option, value) {
    if(option === "show_errors") {
      this.options.show_errors = value;
      this.onChange();
    }
    // Only the `show_errors` option is supported for now
    else {
      throw "Option "+option+" must be set during instantiation and cannot be changed later";
    }
    
    return this;
  },
  getEditorClass: function(schema) {
    var classname;

    schema = this.expandSchema(schema);

    $each(JSONEditor.defaults.resolvers,function(i,resolver) {
      var tmp = resolver(schema);
      if(tmp) {
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
  createEditor: function(editor_class, options) {
    options = $extend({},editor_class.options||{},options);
    return new editor_class(options);
  },
  onChange: function() {
    if(!this.ready) return;
    
    if(this.firing_change) return;
    this.firing_change = true;
    
    var self = this;
    
    window.requestAnimationFrame(function() {
      self.firing_change = false;
      if(!self.ready) return;

      // Validate and cache results
      self.validation_results = self.validator.validate(self.root.getValue());
      
      if(self.options.show_errors !== "never") {
        self.root.showValidationErrors(self.validation_results);
      }
      else {
        self.root.showValidationErrors([]);
      }
      
      // Fire change event
      self.trigger('change');
    });
    
    return this;
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
    if(!this.editors) return;
    return this.editors[path];
  },
  watch: function(path,callback) {
    this.watchlist = this.watchlist || {};
    this.watchlist[path] = this.watchlist[path] || [];
    this.watchlist[path].push(callback);
    
    return this;
  },
  unwatch: function(path,callback) {
    if(!this.watchlist || !this.watchlist[path]) return this;
    // If removing all callbacks for a path
    if(!callback) {
      this.watchlist[path] = null;
      return this;
    }
    
    var newlist = [];
    for(var i=0; i<this.watchlist[path].length; i++) {
      if(this.watchlist[path][i] === callback) continue;
      else newlist.push(this.watchlist[path][i]);
    }
    this.watchlist[path] = newlist.length? newlist : null;
    return this;
  },
  notifyWatchers: function(path) {
    if(!this.watchlist || !this.watchlist[path]) return this;
    for(var i=0; i<this.watchlist[path].length; i++) {
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
  },
  _getDefinitions: function(schema,path) {
    path = path || '#/definitions/';
    if(schema.definitions) {
      for(var i in schema.definitions) {
        if(!schema.definitions.hasOwnProperty(i)) continue;
        this.refs[path+i] = schema.definitions[i];
        if(schema.definitions[i].definitions) {
          this._getDefinitions(schema.definitions[i],path+i+'/definitions/');
        }
      }
    }
  },
  _getExternalRefs: function(schema) {
    var refs = {};
    var merge_refs = function(newrefs) {
      for(var i in newrefs) {
        if(newrefs.hasOwnProperty(i)) {
          refs[i] = true;
        }
      }
    };
    
    if(schema.$ref && typeof schema.$ref !== "object" && schema.$ref.substr(0,1) !== "#" && !this.refs[schema.$ref]) {
      refs[schema.$ref] = true;
    }
    
    for(var i in schema) {
      if(!schema.hasOwnProperty(i)) continue;
      if(schema[i] && typeof schema[i] === "object" && Array.isArray(schema[i])) {
        for(var j=0; j<schema[i].length; j++) {
          if(typeof schema[i][j]==="object") {
            merge_refs(this._getExternalRefs(schema[i][j]));
          }
        }
      }
      else if(schema[i] && typeof schema[i] === "object") {
        merge_refs(this._getExternalRefs(schema[i]));
      }
    }
    
    return refs;
  },
  _loadExternalRefs: function(schema, callback) {
    var self = this;
    var refs = this._getExternalRefs(schema);
    
    var done = 0, waiting = 0, callback_fired = false;
    
    $each(refs,function(url) {
      if(self.refs[url]) return;
      if(!self.options.ajax) throw "Must set ajax option to true to load external ref "+url;
      self.refs[url] = 'loading';
      waiting++;

      var r = new XMLHttpRequest(); 
      r.open("GET", url, true);
      r.onreadystatechange = function () {
        if (r.readyState != 4) return; 
        // Request succeeded
        if(r.status === 200) {
          var response;
          try {
            response = JSON.parse(r.responseText);
          }
          catch(e) {
            window.console.log(e);
            throw "Failed to parse external ref "+url;
          }
          if(!response || typeof response !== "object") throw "External ref does not contain a valid schema - "+url;
          
          self.refs[url] = response;
          self._loadExternalRefs(response,function() {
            done++;
            if(done >= waiting && !callback_fired) {
              callback_fired = true;
              callback();
            }
          });
        }
        // Request failed
        else {
          window.console.log(r);
          throw "Failed to fetch ref via ajax- "+url;
        }
      };
      r.send();
    });
    
    if(!waiting) {
      callback();
    }
  },
  expandRefs: function(schema) {
    schema = $extend({},schema);
    
    while (schema.$ref) {
      var ref = schema.$ref;
      delete schema.$ref;
      
      if(!this.refs[ref]) ref = decodeURIComponent(ref);
      
      schema = this.extendSchemas(schema,this.refs[ref]);
    }
    return schema;
  },
  expandSchema: function(schema) {
    var self = this;
    var extended = $extend({},schema);
    var i;

    // Version 3 `type`
    if(typeof schema.type === 'object') {
      // Array of types
      if(Array.isArray(schema.type)) {
        $each(schema.type, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.type[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.type = self.expandSchema(schema.type);
      }
    }
    // Version 3 `disallow`
    if(typeof schema.disallow === 'object') {
      // Array of types
      if(Array.isArray(schema.disallow)) {
        $each(schema.disallow, function(key,value) {
          // Schema
          if(typeof value === 'object') {
            schema.disallow[key] = self.expandSchema(value);
          }
        });
      }
      // Schema
      else {
        schema.disallow = self.expandSchema(schema.disallow);
      }
    }
    // Version 4 `anyOf`
    if(schema.anyOf) {
      $each(schema.anyOf, function(key,value) {
        schema.anyOf[key] = self.expandSchema(value);
      });
    }
    // Version 4 `dependencies` (schema dependencies)
    if(schema.dependencies) {
      $each(schema.dependencies,function(key,value) {
        if(typeof value === "object" && !(Array.isArray(value))) {
          schema.dependencies[key] = self.expandSchema(value);
        }
      });
    }
    // Version 4 `not`
    if(schema.not) {
      schema.not = this.expandSchema(schema.not);
    }
    
    // allOf schemas should be merged into the parent
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        extended = this.extendSchemas(extended,this.expandSchema(schema.allOf[i]));
      }
      delete extended.allOf;
    }
    // extends schemas should be merged into parent
    if(schema["extends"]) {
      // If extends is a schema
      if(!(Array.isArray(schema["extends"]))) {
        extended = this.extendSchemas(extended,this.expandSchema(schema["extends"]));
      }
      // If extends is an array of schemas
      else {
        for(i=0; i<schema["extends"].length; i++) {
          extended = this.extendSchemas(extended,this.expandSchema(schema["extends"][i]));
        }
      }
      delete extended["extends"];
    }
    // parent should be merged into oneOf schemas
    if(schema.oneOf) {
      var tmp = $extend({},extended);
      delete tmp.oneOf;
      for(i=0; i<schema.oneOf.length; i++) {
        extended.oneOf[i] = this.extendSchemas(this.expandSchema(schema.oneOf[i]),tmp);
      }
    }
    
    return this.expandRefs(extended);
  },
  extendSchemas: function(obj1, obj2) {
    obj1 = $extend({},obj1);
    obj2 = $extend({},obj2);

    var self = this;
    var extended = {};
    $each(obj1, function(prop,val) {
      // If this key is also defined in obj2, merge them
      if(typeof obj2[prop] !== "undefined") {
        // Required arrays should be unioned together
        if(prop === 'required' && typeof val === "object" && Array.isArray(val)) {
          // Union arrays and unique
          extended.required = val.concat(obj2[prop]).reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
          }, []);
        }
        // Type should be intersected and is either an array or string
        else if(prop === 'type' && (typeof val === "string" || Array.isArray(val))) {
          // Make sure we're dealing with arrays
          if(typeof val === "string") val = [val];
          if(typeof obj2.type === "string") obj2.type = [obj2.type];


          extended.type = val.filter(function(n) {
            return obj2.type.indexOf(n) !== -1;
          });

          // If there's only 1 type and it's a primitive, use a string instead of array
          if(extended.type.length === 1 && typeof extended.type[0] === "string") {
            extended.type = extended.type[0];
          }
        }
        // All other arrays should be intersected (enum, etc.)
        else if(typeof val === "object" && Array.isArray(val)){
          extended[prop] = val.filter(function(n) {
            return obj2[prop].indexOf(n) !== -1;
          });
        }
        // Objects should be recursively merged
        else if(typeof val === "object" && val !== null) {
          extended[prop] = self.extendSchemas(val,obj2[prop]);
        }
        // Otherwise, use the first value
        else {
          extended[prop] = val;
        }
      }
      // Otherwise, just use the one in obj1
      else {
        extended[prop] = val;
      }
    });
    // Properties in obj2 that aren't in obj1
    $each(obj2, function(prop,val) {
      if(typeof obj1[prop] === "undefined") {
        extended[prop] = val;
      }
    });

    return extended;
  }
};

JSONEditor.defaults = {
  themes: {},
  templates: {},
  iconlibs: {},
  editors: {},
  languages: {},
  resolvers: [],
  custom_validators: []
};
