JSONEditor.defaults.editors.rating = JSONEditor.defaults.editors.integer.extend({
  build: function() {
    var self = this, i;
    if(!this.options.compact) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    // Dynamically add the required CSS the first time this editor is used
    var styleId = 'json-editor-style-rating';
    var styles = document.getElementById(styleId);
    if (!styles) {
      var style = document.createElement('style');
      style.id = styleId;
      style.type = 'text/css';
      style.innerHTML =
        '      .rating-container {' +
        '        display: inline-block;' +
        '        clear: both;' +
        '      }' +
        '      ' +
        '      .rating {' +
        '        float:left;' +
        '      }' +
        '      ' +
        '      /* :not(:checked) is a filter, so that browsers that don’t support :checked don’t' +
        '         follow these rules. Every browser that supports :checked also supports :not(), so' +
        '         it doesn’t make the test unnecessarily selective */' +
        '      .rating:not(:checked) > input {' +
        '        position:absolute;' +
        '        top:-9999px;' +
        '        clip:rect(0,0,0,0);' +
        '      }' +
        '      ' +
        '      .rating:not(:checked) > label {' +
        '        float:right;' +
        '        width:1em;' +
        '        padding:0 .1em;' +
        '        overflow:hidden;' +
        '        white-space:nowrap;' +
        '        cursor:pointer;' +
        '        color:#ddd;' +
        '      }' +
        '      ' +
        '      .rating:not(:checked) > label:before {' +
        '        content: \'★ \';' +
        '      }' +
        '      ' +
        '      .rating > input:checked ~ label {' +
        '        color: #FFB200;' +
        '      }' +
        '      ' +
        '      .rating:not([readOnly]):not(:checked) > label:hover,' +
        '      .rating:not([readOnly]):not(:checked) > label:hover ~ label {' +
        '        color: #FFDA00;' +
        '      }' +
        '      ' +
        '      .rating:not([readOnly]) > input:checked + label:hover,' +
        '      .rating:not([readOnly]) > input:checked + label:hover ~ label,' +
        '      .rating:not([readOnly]) > input:checked ~ label:hover,' +
        '      .rating:not([readOnly]) > input:checked ~ label:hover ~ label,' +
        '      .rating:not([readOnly]) > label:hover ~ input:checked ~ label {' +
        '        color: #FF8C0D;' +
        '      }' +
        '      ' +
        '      .rating:not([readOnly])  > label:active {' +
        '        position:relative;' +
        '        top:2px;' +
        '        left:2px;' +
        '      }';
      document.getElementsByTagName('head')[0].appendChild(style);
    }

    this.input = this.theme.getFormInputField('hidden');
    this.container.appendChild(this.input);

    // Required to keep height
    var ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-container';

    // Contains options for rating
    var group = document.createElement('div');
    group.setAttribute('name', this.formname);
    group.className = 'rating';
    ratingContainer.appendChild(group);

    if(this.options.compact) this.container.setAttribute('class',this.container.getAttribute('class')+' compact');

    var max = this.schema.maximum ? this.schema.maximum : 5;
    if (this.schema.exclusiveMaximum) max--;

    this.inputs = [];
    for(i=max; i>0; i--) {
      var id = this.formname + i;
      var radioInput = this.theme.getFormInputField('radio');
      radioInput.setAttribute('id', id);
      radioInput.setAttribute('value', i);
      radioInput.setAttribute('name', this.formname);
      group.appendChild(radioInput);
      this.inputs.push(radioInput);

      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.appendChild(document.createTextNode(i + (i == 1 ? ' star' : ' stars')));
      group.appendChild(label);
    }

    if(this.schema.readOnly || this.schema.readonly) {
      this.always_disabled = true;
      $each(this.inputs,function(i,input) {
        group.setAttribute("readOnly", "readOnly");
        input.disabled = true;
      });
    }

    ratingContainer
      .addEventListener('change',function(e) {
        e.preventDefault();
        e.stopPropagation();

        self.input.value = e.srcElement.value;

        self.is_dirty = true;

        self.refreshValue();
        self.watch_listener();
        self.jsoneditor.notifyWatchers(self.path);
        if(self.parent) self.parent.onChildEditorChange(self);
        else self.jsoneditor.onChange();
      });

    this.control = this.theme.getFormControl(this.label, ratingContainer, this.description);
    this.container.appendChild(this.control);

    this.refreshValue();
  },
  setValue: function(val) {
    var sanitized = this.sanitize(val);
    if(this.value === sanitized) {
      return;
    }
    var self = this;
    $each(this.inputs,function(i,input) {
      if (input.value === sanitized) {
        input.checked = true;
        self.value = sanitized;
        self.input.value = self.value;
        self.watch_listener();
        self.jsoneditor.notifyWatchers(self.path);
        return false;
      }
    });
  }
});
