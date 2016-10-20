JSONEditor.defaults.themes.semantic_ui = JSONEditor.AbstractTheme.extend({
  getContainer: function() {
    var el = document.createElement('div');
    el.className = 'ui form';    
    return el;
  },
  getGridContainer: function(options) {
    var el = this._super(options);
    el.className = 'ui stackable padded grid';        
    return el;
  },
  getIndentedPanel: function() {        
    var el = document.createElement('div');
    el.className = 'ui basic segment';
    el.style.position = '';
    return el; 
  },
  getSelectInput: function(options) {
    var el = this._super(options);
    el.className += 'ui basic selection dropdown';
    return el;
  },
  setGridColumnSize: function(el,size) {
    var sizes = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen'];
    el.className = sizes[size] + " wide column";
  },

  afterInputReady: function(input) {
    if(input.controlgroup) return;
    input.controlgroup = this.closest(input,'.field');
    // TODO: use bootstrap slider
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.className = 'ui input';
    return el;
  },
  getRangeInput: function(min, max, step) {
    // TODO: use better slider
    return this._super(min, max, step);
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    if(type !== 'checkbox') {
      el.className += ' ui small input';
    }
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.className += ' input-label';
    
    return el;
  },
  
  getFormControl: function(label, input, description) {
    var group = document.createElement('div');
    
    if(label && input.type === 'checkbox') {
      group.className += ' ui slider checkbox';
      group.appendChild(input);
      group.appendChild(label);
    } 
    else {
      group.className += ' field';
      if(label) {
        group.appendChild(label);
      }
      group.appendChild(input);
    }

    if(description) group.appendChild(description);

    return group;
  },

  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.className = 'help-block';
    el.innerHTML = text;
    return el;
  },
  getHeader: function(text) {
    var el = document.createElement('div');
    el.className = "ui header";
    
    if(typeof text === "string") {
      el.textContent = text;
    }
    
    else {
      el.appendChild(text);
    }

    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.className += " button-holder-header";   
    el.style.float = "right"; 
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className="button-holder"
    //el.style.float = "right";
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += 'ui compact mini button';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'ui table bordered';
    return el;
  },
  addInputError: function(input, text) {    
    console.log(['erroradd', input]);
    
    if(!input.errmsg) {
      var group = this.closest(input,'.field');
      var target = $(group).find('label')[0];
      input.errmsg = document.createElement('small');
      input.errmsg.setAttribute('class','error');
      input.errmsg.style = input.errmsg.style || {};
      input.errmsg.style.float = 'right';
      target.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = 'block';
    }
    
    input.errmsg.innerHTML = '';
    input.errmsg.appendChild(document.createTextNode(text));
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.errmsg.style.display = 'none';
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.className = 'ui tabbed-array grid stackable ui segment';
    el.innerHTML = "<div class='three wide column ui small vertical tabular menu'></div><div class='rows nine wide stretched column'></div>";
    return el;
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = "tab-contents"
    return el
  },
  getTab: function(text) {
    var el = document.createElement('a');
    el.className = 'item';
    el.setAttribute('href','#');
    el.appendChild(text);
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  getProgressBar: function() {
    var min = 0, max = 100, start = 0;

    var container = document.createElement('div');
    container.className = 'ui progress';

    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', start);
    bar.setAttribute('aria-valuemin', min);
    bar.setAttribute('aria-valuenax', max);
    bar.innerHTML = start + "%";
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;

    var bar = progressBar.firstChild;
    var percentage = progress + "%";
    bar.setAttribute('aria-valuenow', progress);
    bar.style.width = percentage;
    bar.innerHTML = percentage;
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;

    var bar = progressBar.firstChild;
    progressBar.className = 'bar';
    bar.removeAttribute('aria-valuenow');
    bar.style.width = '100%';
    bar.innerHTML = '';
  }
});