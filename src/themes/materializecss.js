// needed for generating input ids
var inputIdSequence = 0;

JSONEditor.defaults.themes.materializecss = JSONEditor.AbstractTheme.extend({
  getHeader: function(text) {
    var el = document.createElement('h5');
    if(typeof text === "string") {
      el.textContent = text;
    }
    else {
      el.appendChild(text);
    }

    return el;
  },
  getHeaderButtonHolder: function() {
    var el = document.createElement('div');
    el.style.fontSize = '.6em';
    el.style.margin = '0 10px 0 10px';
    el.style.display = 'inline-block';
    el.className = '';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = this.getDescription(text);
    el.style.marginLeft = '10px';
    el.style.display = 'inline-block';
    return el;
  },
  getGridRow: function() {
    var el = document.createElement('div');
    el.style.margin = '0 10px';
    el.className = 'row';
    return el;
  },
  getGridColumn: function() {
    var el = document.createElement('div');
    return el;
  },
  getSelectInput: function(options) {
    var select = document.createElement('select');
    select.className = 'browser-default';
    if(options) this.setSelectOptions(select, options);
    return select;
  },
  getFormControl: function(label, input, description) {
    var el = document.createElement('div');

    var id = 'json-editor-input-' + inputIdSequence++;
    input.setAttribute('id', id);

    if(label) {
      label.setAttribute('for', id);
    }

    if (input.tagName === 'SELECT' || (input.tagName === 'INPUT' && input.getAttribute('type').toLowerCase() === 'color')) {
      el.className = 'col s12 m4';
      if(label) {
        el.appendChild(label);
      }
      input.style.display = 'block';
      el.appendChild(input);
    } else {
      el.className = 'input-field col s12 m4';
      el.appendChild(input);
      if(label) {
        el.appendChild(label);
      }
    }

    return el;
  },
  getDescription: function(text) {
    var el = document.createElement('span');
    el.style.fontSize = '.8em';
    el.style.fontStyle = 'italic';
    el.textContent = text;
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.style.fontSize = '.9em';
    el.style.margin = '10px 0';
    el.className = 'col s12';
    return el;
  },
  getMultiCheckboxHolder: function(controls,label,description) {
    var el = document.createElement('div');

    if(label) {
      label.style.display = 'block';
      label.style.marginLeft = '10px';
      el.appendChild(label);
    }

    for(var i in controls) {
      if(!controls.hasOwnProperty(i)) continue;
      controls[i].style.display = 'inline-block';
      el.appendChild(controls[i]);
    }

    if(description) el.appendChild(description);

    return el;
  },
  getFormInputLabel: function(text) {
    var el = document.createElement('label');
    el.textContent = text;
    return el;
  },
  getButton: function(text, icon, title) {
    var button = document.createElement("button");
    button.className = 'btn waves-effect waves-light';
    button.style.marginRight = '5px';
    button.style.padding = '0px 15px';

    if(icon) {
      button.appendChild(icon);
    }

    var el = document.createTextNode(text||title||".");
    button.appendChild(el);

    return button;
  },
  setButtonText: function(button,text, icon, title) {
    while (button.firstChild) {
      button.removeChild(button.firstChild);
    }

    if(icon) {
      button.appendChild(icon);
    }

    var el = document.createTextNode(text||title||".");
    button.appendChild(el);
  },
  getCheckboxLabel: function(text) {
    var el = this.getFormInputLabel(text);
    el.style.fontWeight = 'normal';
    el.style.top = '-10px';
    return el;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.style.padding = '1em 0.4em';
    return el;
  },
  afterInputReady: function(input) {
    if(input.controls) return;
    input.controls = this.closest(input,'.form-control');
  },
  addInputError: function(input,text) {
    if(!input.controls) return;
    if(!input.errmsg) {
      input.errmsg = document.createElement('div');
      input.controls.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.errmsg.style.display = 'none';
  }
});
