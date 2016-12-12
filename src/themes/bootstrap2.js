JSONEditor.defaults.themes.bootstrap2 = JSONEditor.AbstractTheme.extend({
  getRangeInput: function(min, max, step) {
    // TODO: use bootstrap slider
    return this._super(min, max, step);
  },
  getGridContainer: function() {
    var el = document.createElement('div');
    el.className = 'container-fluid';
    return el;
  },
  getGridRow: function() {
    var el = document.createElement('div');
    el.className = 'row-fluid';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'inline-block';
    el.style.fontWeight = 'bold';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'span'+size;
  },
  getSelectInput: function(options) {
    var input = this._super(options);
    input.style.width = 'auto';
    input.style.maxWidth = '98%';
    return input;
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    el.style.width = '98%';
    return el;
  },
  afterInputReady: function(input) {
    if(input.controlgroup) return;
    input.controlgroup = this.closest(input,'.control-group');
    input.controls = this.closest(input,'.controls');
    if(this.closest(input,'.compact')) {
      input.controlgroup.className = input.controlgroup.className.replace(/control-group/g,'').replace(/[ ]{2,}/g,' ');
      input.controls.className = input.controlgroup.className.replace(/controls/g,'').replace(/[ ]{2,}/g,' ');
      input.style.marginBottom = 0;
    }

    // TODO: use bootstrap slider
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'well well-small';
    el.style.paddingBottom = 0;
    return el;
  },
  getInfoButton: function(text) {
    var icon = document.createElement('span');
    icon.className = "icon-info-sign pull-right";
    icon.style.padding = ".25rem";
    icon.style.position = "relative";
    icon.style.display = "inline-block";

    var tooltip = document.createElement('span');
    tooltip.style["font-family"] = "sans-serif";
    tooltip.style.visibility = "hidden";
    tooltip.style["background-color"] = "rgba(50, 50, 50, .75)";
    tooltip.style.margin = "0 .25rem";
    tooltip.style.color = "#FAFAFA";
    tooltip.style.padding = ".5rem 1rem";
    tooltip.style["border-radius"] = ".25rem";
    tooltip.style.width = "25rem";
    tooltip.style.transform = "translateX(-27rem) translateY(-.5rem)";
    tooltip.style.position = "absolute";
    tooltip.innerText = text;
    icon.onmouseover = function() {
      tooltip.style.visibility = "visible";
    };
    icon.onmouseleave = function() {
      tooltip.style.visibility = "hidden";
    };

    icon.appendChild(tooltip);

    return icon;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.className = 'help-inline';
    el.textContent = text;
    return el;
  },
  getFormControl: function(label, input, description, infoText) {
    var ret = document.createElement('div');
    ret.className = 'control-group';

    var controls = document.createElement('div');
    controls.className = 'controls';

    if(label && input.getAttribute('type') === 'checkbox') {
      ret.appendChild(controls);
      label.className += ' checkbox';
      label.appendChild(input);
      controls.appendChild(label);
      if(infoText) controls.appendChild(infoText);
      controls.style.height = '30px';
    }
    else {
      if(label) {
        label.className += ' control-label';
        ret.appendChild(label);
      }
      if(infoText) controls.appendChild(infoText);
      controls.appendChild(input);
      ret.appendChild(controls);
    }

    if(description) controls.appendChild(description);

    return ret;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'btn-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el =  this._super(text, icon, title);
    el.className += ' btn btn-default';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'table table-bordered';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    return el;
  },
  addInputError: function(input,text) {
    if(!input.controlgroup || !input.controls) return;
    input.controlgroup.className += ' error';
    if(!input.errmsg) {
      input.errmsg = document.createElement('p');
      input.errmsg.className = 'help-block errormsg';
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
    input.controlgroup.className = input.controlgroup.className.replace(/\s?error/g,'');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.className = 'tabbable tabs-left';
    el.innerHTML = "<ul class='nav nav-tabs span2' style='margin-right: 0;'></ul><div class='tab-content span10' style='overflow:visible;'></div>";
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('li');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tab_holder) {
    return tab_holder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'tab-pane active';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  },
  getProgressBar: function() {
    var container = document.createElement('div');
    container.className = 'progress';

    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = '0%';
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;

    progressBar.firstChild.style.width = progress + "%";
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;

    progressBar.className = 'progress progress-striped active';
    progressBar.firstChild.style.width = '100%';
  }
});
