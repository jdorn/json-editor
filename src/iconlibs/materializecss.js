JSONEditor.defaults.iconlibs.materializecss = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'expand_less',
    expand: 'expand_more',
    "delete": 'delete',
    edit: 'create',
    add: 'add',
    cancel: 'undo',
    save: 'save',
    moveup: 'arrow_upward',
    movedown: 'arrow_downward'
  },
  icon_prefix: '',
  getIcon: function(key) {
    var iconText = this.getIconClass(key);

    if(!iconText) return null;

    var i = document.createElement('i');
    i.className = 'material-icons left';
    var textNode = document.createTextNode(iconText);
    i.appendChild(textNode);
    return i;
  }
});
