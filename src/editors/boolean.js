JSONEditor.defaults.editors.boolean = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || false;
  },
  register: function() {
    this._super();
    if(!this.input) return;
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
    if(!this.input) return;
    this.input.removeAttribute('name');
  },
  setValue: function(value,initial,from_template) {
    var self = this;

    this.input.checked = !!value;

    var changed = (from_template || (this.getValue() !== value));
    this.refreshValue();
    if(changed) {
      if(self.parent) self.parent.onChildEditorChange(self);
      else self.jsoneditor.onChange();
    }

    this.watch_listener();
    this.jsoneditor.notifyWatchers(this.path);
  },
  removeProperty: function() {
    this._super();
    this.input.style.display = 'none';
    if(this.description) this.description.style.display = 'none';
    this.theme.disableLabel(this.label);
  },
  addProperty: function() {
    this._super();
    this.input.style.display = '';
    if(this.description) this.description.style.display = '';
    this.theme.enableLabel(this.label);
  },
  build: function() {
    var self = this, i;
    if(!this.getOption('compact',false)) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    this.input_type = 'checkbox';
    this.input = this.theme.getCheckbox();

    if(this.getOption('compact')) this.container.setAttribute('class',this.container.getAttribute('class')+' compact');

    if(this.schema.readOnly || this.schema.readonly) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    this.input.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();

      this.value = this.checked;

      self.refreshValue();
      self.watch_listener();
      self.jsoneditor.notifyWatchers(self.path);
      if(self.parent) self.parent.onChildEditorChange(self);
      else self.jsoneditor.onChange();
    });

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    // Any special formatting that needs to happen after the input is added to the dom
    requestAnimationFrame(function() {
      self.afterInputReady();
    });

    this.register();
    this.refreshValue();
    this.jsoneditor.notifyWatchers(this.path);
  },
  enable: function() {
    if(!this.always_disabled) {
      this.input.disabled = false;
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  },
  afterInputReady: function() {
    var self = this;
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function() {
    this.value = this.input.checked;
    this.serialized = (this.value ? '1' : '');
  },
  destroy: function() {
    if(this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if(this.label && this.label.parentNode) this.label.parentNode.removeChild(this.label);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);
    this._super();
  },
  /**
   * This is overridden in derivative editors
   */
  sanitize: function(value) {
    return (value ? '1' : '');
  },
  showValidationErrors: function(errors) {
    var self = this;

    var messages = [];
    $each(errors,function(i,error) {
      if(error.path === self.path) {
        messages.push(error.message);
      }
    });

    if(messages.length) {
      this.theme.addInputError(this.input, messages.join('. ')+'.');
    }
    else {
      this.theme.removeInputError(this.input);
    }
  }
});