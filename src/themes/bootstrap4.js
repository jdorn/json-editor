JSONEditor.defaults.themes.bootstrap4 = JSONEditor.AbstractTheme.extend({
    getSelectInput: function(options) {
        var el = this._super(options);
        el.className += 'form-control';
        return el;
    },
    setGridColumnSize: function(el,size) {
        el.className = 'col-md-'+size;
    },
    afterInputReady: function(input) {
        if(input.controlgroup) return;
        input.controlgroup = this.closest(input,'.form-group');
        if(this.closest(input,'.compact')) {
            input.controlgroup.style.marginBottom = 0;
        }
    },
    getTextareaInput: function() {
        var el = document.createElement('textarea');
        el.className = 'form-control';
        return el;
    },
    getRangeInput: function(min, max, step) {
        return this._super(min, max, step);
    },
    getFormInputField: function(type) {
        var el = this._super(type);
        if(type !== 'checkbox') {
            el.className += 'form-control';
        } else {
            el.className += 'form-check-input';
        }
        return el;
    },
    getFormControl: function(label, input, description) {
        var group = document.createElement('div');

        if(label && input.type === 'checkbox') {
            group.className += ' checkbox';
            label.appendChild(input);
            label.style.fontSize = '14px';
            group.style.marginTop = '0';
            group.appendChild(label);
            input.style.position = 'relative';
            input.style.cssFloat = 'left';
        }
        else {
            group.className += ' form-group';
            if(label) {
                label.className += ' form-control-label';
                group.appendChild(label);
            }
            group.appendChild(input);
        }

        if(description) group.appendChild(description);

        return group;
    },
    getIndentedPanel: function() {
        var el = document.createElement('div');
        el.className = 'card p-4';
        el.style.paddingBottom = 0;
        return el;
    },
    getFormInputDescription: function(text) {
        var el = document.createElement('p');
        el.className = 'form-text';
        el.innerHTML = text;
        return el;
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
        var el = this._super(text, icon, title);
        el.className += 'btn btn-secondary';
        return el;
    },
    getTable: function() {
        var el = document.createElement('table');
        el.className = 'table table-striped table-bordered table-hover table-responsive';
        return el;
    },

    addInputError: function(input,text) {
        if(!input.controlgroup) return;
        input.controlgroup.className += ' has-danger';
        if(!input.errmsg) {
            input.errmsg = document.createElement('p');
            input.errmsg.className = 'form-text alert alert-danger';
            input.controlgroup.appendChild(input.errmsg);
        }
        else {
            input.errmsg.style.display = '';
        }

        input.errmsg.textContent = text;
    },
    removeInputError: function(input) {
        if(!input.errmsg) return;
        input.errmsg.style.display = 'none';
        input.controlgroup.className = input.controlgroup.className.replace(/\s?has-danger/g,'');
    },
    getTabHolder: function() {
        var el = document.createElement('div');
        el.innerHTML = "<div class='tabs list-group col-md-2'></div><div class='col-md-10'></div>";
        el.className = 'rows';
        return el;
    },
    getTab: function(text) {
        var el = document.createElement('a');
        el.className = 'list-group-item';
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
        container.className = 'progress';

        var bar = document.createElement('div');
        bar.className = 'progress-bar';
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
        progressBar.className = 'progress';
        bar.removeAttribute('aria-valuenow');
        bar.className = 'progress-bar progress-bar-striped';
        bar.style.width = '100%';
        bar.innerHTML = '';
    }
});
