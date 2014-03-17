$.jsoneditor.themes.html = $.jsoneditor.AbstractTheme.extend({
  getFormInputLabel: function(text) {
    var el = this._super(text);
    this.applyStyles(el,{
      display: "block",
      marginBottom: '3px'
    });
    return el;
  },
  getFormInputDescription: function(text) {
    var el = this._super(text);
    this.applyStyles(el,{
      fontSize: '.8em',
      margin: 0,
      display: 'inline-block',
      fontStyle: 'italic'
    });
    return el;
  },
  getIndentedPanel: function() {
    var el = this._super();
    this.applyStyles(el,{
      border: '1px solid #ddd',
      padding: '5px',
      margin: '5px',
      borderRadius: '3px'
    });
    return el;
  },
  getChildEditorHolder: function() {
    var el = this._super();
    this.applyStyles(el,{
      marginBottom: '8px'
    });
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    this.applyStyles(el,{
      display: 'inline-block',
      marginLeft: '10px',
      fontSize: '.8em',
      verticalAlign: 'middle'
    });
    return el;
  },
  getTable: function() {
    var el = this._super();
    this.applyStyles(el,{
      borderBottom: '1px solid #ccc',
      marginBottom: '5px'
    });
    return el;
  },
  addInputError: function(input, text) {
    input.style.borderColor = 'red';
    
    if(!input.errmsg) {
      var group = this.closest(input,'.form-control');
      input.errmsg = document.createElement('div');
      input.errmsg.setAttribute('class','errmsg');
      input.errmsg.style = input.errmsg.style || {};
      input.errmsg.style.color = 'red';
      group.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = 'block';
    }
    
    input.errmsg.innerHTML = '';
    input.errmsg.appendChild(document.createTextNode(text));
  },
  removeInputError: function(input) {
    input.style.borderColor = '';
    if(input.errmsg) input.errmsg.style.display = 'none';
  }
});
