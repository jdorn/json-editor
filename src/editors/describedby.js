// hyper-link describeBy Editor

JSONEditor.defaults.editors.describedBy = JSONEditor.AbstractEditor.extend({
  register: function() {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i]) continue;
        this.editors[i].unregister();
      }

      if (this.editors[this.currentEditor]) this.editors[this.currentEditor].register();
    }

    this._super();
  },
  unregister: function() {
    this._super();

    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i]) continue;
        this.editors[i].unregister();
      }
    }
  },
  getNumColumns: function() {
    if (!this.editors[this.currentEditor]) return 4;
    return Math.max(this.editors[this.currentEditor].getNumColumns(), 4);
  },
  enable: function() {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i]) continue;
        this.editors[i].enable();
      }
    }

    this._super();
  },
  disable: function() {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i]) continue;
        this.editors[i].disable();
      }
    }

    this._super();
  },
  switchEditor: function() {
    var self = this;
    var vars = this.getWatchedFieldValues();

    if (!vars) return;

    //var ref = this.template.fillFromObject(vars);
    var ref = this.template(vars);

    if (!this.editors[this.refs[ref]]) {
      this.buildChildEditor(ref);
    }

    this.currentEditor = this.refs[ref];

    this.register();

    $each(this.editors, function(ref, editor) {
      if (!editor) return;
      if (self.currentEditor === ref) {
        editor.container.style.display = '';
      } else {
        editor.container.style.display = 'none';
      }
    });

    this.refreshValue();
  },
  buildChildEditor: function(ref) {
    this.refs[ref] = this.editors.length;

    var holder = this.theme.getChildEditorHolder();
    this.editor_holder.appendChild(holder);

    var schema = $extend({}, this.schema, this.jsoneditor.refs[ref]);

    var editor = this.jsoneditor.createEditor(
      this.jsoneditor.getEditorClass(schema), {
        jsoneditor: this.jsoneditor,
        schema: schema,
        container: holder,
        path: this.path,
        parent: this,
        required: true
      }
    );

    this.editors.push(editor);

    editor.preBuild();
    editor.build();
    editor.postBuild();
  },
  preBuild: function() {
    var self = this;

    this.refs = {};
    this.editors = [];
    this.currentEditor = '';

    for (var i = 0; i < this.schema.links.length; i++) {
      if (this.schema.links[i].rel.toLowerCase() === 'describedby') {
        //this.template = new UriTemplate(this.schema.links[i].href);
        this.template = this.jsoneditor.compileTemplate(this.schema.links[i].href, this.template_engine);
        break;
      }
    }

    /*this.template.fill(function(varName) {
      self.schema.watch = self.schema.watch || {};
      self.schema.watch[varName] = varName;
      return '';
    });*/

    this.schema.links.splice(0, 1);
    if (this.schema.links.length === 0) delete this.schema.links;

    this.baseSchema = $extend({}, this.schema);
  },
  build: function() {
    this.editor_holder = document.createElement('div');
    this.container.appendChild(this.editor_holder);
    this.switchEditor();
  },
  onWatchedFieldChange: function() {
    this.switchEditor();
  },
  onChildEditorChange: function(editor) {
    if (this.editors[this.currentEditor]) {
      this.refreshValue();
    }

    this._super(editor);
  },
  refreshValue: function() {
    if (this.editors[this.currentEditor]) {
      this.value = this.editors[this.currentEditor].getValue();
    }
  },
  setValue: function(val, initial) {
    if (this.editors[this.currentEditor]) {
      this.editors[this.currentEditor].setValue(val, initial);
      this.refreshValue();
      this.onChange();
    }
  },
  destroy: function() {
    $each(this.editors, function(i, editor) {
      if (editor) editor.destroy();
    });

    if (this.editor_holder && this.editor_holder.parentNode) {
      this.editor_holder.parentNode.removeChild(this.editor_holder);
    }

    this._super();
  },
  showValidationErrors: function(errors) {
    $each(this.editors, function(i, editor) {
      if (!editor) return;
      editor.showValidationErrors(errors);
    });
  }
});
