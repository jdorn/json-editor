// Enum Editor (used for objects and arrays with enumerated values)
$.jsoneditor.editors.enum = $.jsoneditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.enum[0];
  },
  addProperty: function() {
    this._super();
    this.display_area.show(500);
    this.theme.enableHeader(this.title);
  },
  removeProperty: function() {
    this._super();
    this.display_area.hide(500);
    this.theme.disableHeader(this.title);
  },
  build: function() {
    var container = this.getContainer();
    this.title = this.getTheme().getHeader(this.getTitle()).appendTo(this.container);

    this.options.enum_titles = this.options.enum_titles || [];

    this.enum = this.schema.enum;
    this.selected = 0;
    this.select_options = [];
    this.html_values = [];

    var self = this;
    for(var i=0; i<this.enum.length; i++) {
      this.select_options[i] = this.options.enum_titles[i] || "Value "+(i+1);
      this.html_values[i] = this.getHTML(this.enum[i]);
    }

    // Switcher
    this.switcher = this.theme.getSelectInput(this.select_options).appendTo(this.container).css({
      float: 'right',
      marginBottom: 0
    });

    // Display area
    this.display_area = this.theme.getIndentedPanel().appendTo(this.container);

    this.switcher.on('change',function() {
      self.selected = self.select_options.indexOf($(this).val());
      self.value = self.enum[self.selected];
      self.refreshValue();
      self.container.trigger('change');
    });
    this.value = this.enum[0];
    this.refreshValue();
  },
  refreshValue: function() {
    var self = this;
    self.selected = -1;
    var stringified = JSON.stringify(this.value);
    $.each(this.enum, function(i, el) {
      if(stringified === JSON.stringify(el)) {
        self.selected = i;
        return false;
      }
    });

    if(self.selected<0) {
      self.setValue(self.enum[0]);
      return;
    }

    this.switcher.val(this.select_options[this.selected]);
    this.display_area.empty().append(this.html_values[this.selected]);
  },
  getHTML: function(el) {
    var self = this;

    if(el === null) {
      return '<em>null</em>';
    }
    // Array or Object
    else if(typeof el === "object") {
      // TODO: use theme
      var ret;
      if(el instanceof Array) ret = $("<ol></ol>");
      else ret = $("<ul></ul>");

      $.each(el,function(i,child) {
        var html = self.getHTML(child);

        // Add the keys to object children
        if(!(el instanceof Array)) {
          // TODO: use theme
          html = $("<div></div>").append($("<strong></strong>").text(i)).append(': ').append(html);
        }

        // TODO: use theme
        ret.append($("<li></li>").append(html));
      });

      return ret;
    }
    // Boolean
    else if(typeof el === "boolean") {
      return el? 'true' : 'false';
    }
    // String or Number
    else {
      return el;
    }
  },
  setValue: function(val) {
    this.value = val;
    this.refreshValue();

    this.container.trigger('change set');
  },
  destroy: function() {
    this.display_area.remove();
    this.title.remove();
    this.switcher.remove();

    this._super();
  }
});
