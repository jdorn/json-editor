/*! JSON Editor v0.1.8 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2013-11-24
 */

/**
 * Requires jQuery.
 * Uses Bootstrap 2.X classnames for styling.
 * Either jqueryUI sortable or html5sortable is required if you want drag/drop rearranging of list elements
 * A templating engine is required if you want to use macro templates.
 *
 * Supports a subset of the JSON Schema specification with a few extra
 * features and custom types as well.
 *
 * Example Usage:
 *
 * var schema = {
 *   type: "object",
 *   title: "Person",
 *   properties: {
 *     firstname: {
 *       type: "string"
 *     },
 *     age: {
 *       type: "integer"
 *     }
 *   }
 * };
 * $("#editor").jsoneditor({
 *   schema: schema
 * });
 *
 * $("#editor").jsoneditor('value',{
 *   firstname: "Jeremy",
 *   age: 24
 * });
 *
 * var value = $("#editor").jsoneditor('value');
 * console.log(value);
 *
 * $("#editor").jsoneditor('destroy');
 */

(function($) {
  /* Simple JavaScript Inheritance
   * By John Resig http://ejohn.org/
   * MIT Licensed.
   */
  // Inspired by base2 and Prototype
  var Class;!function(){var a=!1,b=/xyz/.test(function(){})?/\b_super\b/:/.*/;Class=function(){},Class.extend=function(c){function g(){!a&&this.init&&this.init.apply(this,arguments)}var d=this.prototype;a=!0;var e=new this;a=!1;for(var f in c)e[f]="function"==typeof c[f]&&"function"==typeof d[f]&&b.test(c[f])?function(a,b){return function(){var c=this._super;this._super=d[a];var e=b.apply(this,arguments);return this._super=c,e}}(f,c[f]):c[f];return g.prototype=e,g.prototype.constructor=g,g.extend=arguments.callee,g}}();

  /**
   * Turn an element into a schema editor
   * @param options Options (must contain at least a `schema` property)
   *
   * Constructor:
   * $("#container").jsoneditor({
   *   schema: {...}
   * });
   *
   * Set Value:
   * $("#container").jsoneditor('value',{...})
   *
   * Get Value:
   * var value = $("#container").jsoneditor('value');
   *
   * Destroy:
   * $("#container").jsoneditor('destroy');
   */
  $.fn.jsoneditor = function(options) {
    var $this = $(this), d;

    // Get/Set value
    if(options === 'value') {
      d = $this.data('jsoneditor');
      if(!d) return {};

      // Setting value
      if(arguments.length > 1) {
        d.root.setValue(arguments[1]);
        return this;
      }
      // Getting value
      else {
        return d.root.getValue();
      }
    }
    // Destroy editor
    else if(options === 'destroy') {
      d = $this.data('jsoneditor');
      if(!d) return this;
      d.schema = null;
      d.options = null;
      d.root.destroy();
      d = null;
      $this.data('jsoneditor',null);

      return this;
    }

    options = options || {};

    var schema = options.schema;
    var data = options.startval;

    var editor_class = $.jsoneditor.getEditorClass(schema);

    // Store info about the jsoneditor in the element
    var d = {
      schema: schema,
      options: options,
      definitions: {},
      theme: new $.jsoneditor.themes[options.theme || 'bootstrap2']()
    };
    $this.data('jsoneditor',d);

    d.root = new editor_class({
      jsoneditor: $this,
      schema: schema,
      container: $this
    });

    // Starting data
    if(data) d.root.setValue(data);

    return this;
  };

  $.jsoneditor = {
    template: window.swig,
    editors: {},
    themes: {},
    expandSchema: function(schema, editor) {
      if(schema['$ref']) {
        if(!schema['$ref'].match(/^#\/definitions\//g)) {
          throw "JSON Editor only supports local references to schema definitions defined for the root node";
        }
        var key = schema['$ref'].substr(14);
        var definitions = editor.data('jsoneditor').definitions;
        if(!definitions[key]) throw "Schema definition not found - "+schema['$ref'];

        return $.extend(true,{},definitions[key]);
      }
      return schema;
    },
    getEditorClass: function(schema, editor) {
      schema = $.jsoneditor.expandSchema(schema, editor);

      var editor = schema.editor || schema.type;
      if(!$.jsoneditor.editors[editor]) throw "Unknown editor "+editor;
      return $.jsoneditor.editors[editor];
    }
  };
  
  $.jsoneditor.AbstractTheme = Class.extend({
    getFormInputField: function(type) {
      return $("<input type='"+type+"'>");
    },
    getFormInputLabel: function(text) {
      return $("<label>").text(text);
    },
    addFormInputControl: function(div,label,field) {
      div.append(label);
      div.append(field);
    },
    getTable: function() {
      return $("<table>");
    },
    addTableHeader: function(table, cols) {
      var header = $("<thead>").appendTo(table);
      
      var header_row = $("<tr>").appendTo(header);
      $.each(cols,function(i,col) {
        header_row.append($("<th>").text(col));
      });
      
      return header;
    },
    addTableBody: function(table) {
      return $("<tbody>").appendTo(table);
    },
    getTableRow: function() {
      return $("<tr>");
    },
    getTableCell: function() {
      return $("<td>");
    },
    getSelectInput: function() {
      return $("<select>");
    },
    getFormOutput: function() {
      return $("<output></output>").css({
        paddingLeft: '10px'
      });
    },
    getTextareaInput: function() {
      return $("<textarea>").css({
        width: '100%',
        height: this.options.height || 150
      });
    },
    getSelectOption: function(val) {
      return $("<option>").text(val).attr('value',val);
    },
    indentDiv: function(div) {
      div.css({
        paddingLeft: 10,
        marginLeft: 10,
        borderLeft: '1px solid #ccc'
      });
    },
    getTitle: function(text) {
      return $("<h2>").text(text);
    },
    getTitleControls: function() {
      return $("<div style='display:inline-block;'></div>");
    },
    getControls: function() {
      return $("<div>");
    },
    getButton: function(text) {
      return $("<button>").text(text);
    },
    getChildEditorHolder: function() {
      return $("<div></div>").css({
        border: '1px solid #ccc',
        padding: '10px'
      });
    }
  });
  
  $.jsoneditor.themes.bootstrap2 = $.jsoneditor.AbstractTheme.extend({
    getFormInputField: function(type) {
      var field = this._super(type);
      
      // Some input formats should use a large input field
      if(['email','url','text'].indexOf(this.input_type) >= 0) {
        this.input.addClass('input-xxlarge')
      }
      
      return field;
    },
    addFormInputControl: function(div,label,field) {
      if(field.attr('type')==='checkbox') {
        label.addClass('checkbox');
        label.append(field);
        div.append(label);
      }
      else {
        this._super(div, label, field);
      }
    },
    getTable: function() {
      return this._super().addClass('table table-bordered').css({
        maxWidth: 'none',
        width: 'auto'
      });
    },
    getControls: function() {
      return this._super().addClass('btn-group');
    },
    getTitleControls: function() {
      return this._super().addClass('btn-group');
    },
    getButton: function(text) {
      return this._super(text).addClass('btn');
    },
    getChildEditorHolder: function() {
      return $("<div>").addClass('well well-small');
    }
  });
  
  $.jsoneditor.themes.bootstrap3 = $.jsoneditor.AbstractTheme.extend({
    addFormInputControl: function(div,label,field) {
      if(field.attr('type')==='checkbox') {
        label.append(field);
        div.addClass('checkbox').append(label);
      }
      else {
        div.addClass('form-group').append(label).append(field);
      }
    },
    getSelectInput: function() {
      return $("<select>").addClass('form-control');
    },
    getTable: function() {
      return this._super().addClass('table table-bordered').css({
        maxWidth: 'none',
        width: 'auto'
      });
    },
    getFormOutput: function() {
      return $("<output></output>").css({
        paddingLeft: '10px',
        display: 'inline-block'
      });
    },
    getFormInputField: function(type) {
      var field = this._super(type);
      
      if(type === 'range') {
        field.css('margin-left','5px').css('margin-top','5px');
      }
      else if(type === 'color') {
        field.css('margin-left','5px')
      }
      else if(type === 'checkbox') {
        field.css('margin-left','5px')
      }
      else {
        field.addClass('form-control');
      }
      
      return field;
    },
    getControls: function() {
      return this._super().addClass('btn-group');
    },
    getTitleControls: function() {
      return this._super().addClass('btn-group');
    },
    getButton: function(text) {
      return this._super(text).addClass('btn btn-default');
    },
    getChildEditorHolder: function() {
      return $("<div>").addClass('well well-small');
    }
  });
  
  $.jsoneditor.themes.jqueryui = $.jsoneditor.AbstractTheme.extend({
    addTableHeader: function(table, cols) {
      var header = this._super(table, cols);
      $("th",header).addClass('ui-state-default').css({
        fontWeight: 'bold'
      });
      return header;
    },
    getTableCell: function() {
      return this._super().addClass('ui-widget-content');
    },
    getTitleControls: function() {
      return this._super().addClass('ui-buttonset').css({
        fontSize: '.45em'
      });
    },
    getFormInputLabel: function(text) {
      return this._super(text).css({
        marginRight: '5px'
      });
    },
    getControls: function() {
      return this._super().addClass('ui-buttonset');
    },
    getButton: function(text) {
      return $("<button>").addClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only').append(
        $("<span>").addClass('ui-button-text').text(text)
      );
    },
    getChildEditorHolder: function() {
      return $("<div>").addClass('ui-widget-content ui-corner-all').css({
        padding: '1em 1.4em'
      });
    }
  });

  /**
   * All editors should extend from this class
   */
  $.jsoneditor.AbstractEditor = Class.extend({
    default: null,
    init: function(options) {
      this.container = options.container;
      this.jsoneditor = options.jsoneditor;
      this.schema = options.schema;
      this.schema = $.jsoneditor.expandSchema(this.schema,this.jsoneditor);
      
      this.theme = this.jsoneditor.data('jsoneditor').theme;

      // Store schema definitions
      if(this.schema.definitions) {
        var definitions = this.jsoneditor.data('jsoneditor').definitions;
        $.each(this.schema.definitions,function(key,schema) {
          definitions[key] = schema;
        });
      }

      this.options = $.extend(true, {}, (this.options || {}), (this.schema.options || {}), options);

      if(!options.path && !this.schema.id) this.schema.id = 'root';
      this.path = options.path || this.schema.id;

      this.key = this.path.split('.').pop();
      this.parent = options.parent;

      this.value = null;

      var tag = options.tag || 'div';
      if(tag === 'td') {
        this.div = this.theme.getTableCell();
      }
      else {
        this.div = $("<"+tag+">");
      }

      this.div.appendTo(this.container);

      // Show field's description as a tooltip
      if(this.schema.description) this.div.attr('title',this.schema.description);

      this.div.data('editor',this);
      this.div.attr('data-schematype',this.schema.type);

      if(this.schema.id) {
        this.div.attr('data-schemaid',this.schema.id);
      }

      this.initialize();

      // If this field has a default value
      this.setValue(this.schema.default || this.default);
    },
    /**
     * Called after constructor
     * Should be overridden
     */
    initialize: function() {

    },
    /**
     * Gets the value from the editor
     * Can be overridden
     * @return The editor's value
     */
    getValue: function() {
      return this.value;
    },
    /**
     * Sets the value of the editor
     * Should be overridden
     * @param value The value to set
     */
    setValue: function(value) {
      this.value = value;
    },
    /**
     * Destroys the editor
     * Child classes should extend this method
     */
    destroy: function() {
      this.div.remove();
      this.value = null;
      this.container = null;
      this.jsoneditor = null;
      this.schema = null;
      this.path = null;
      this.key = null;
      this.parent = null;
      this.div = null;
    }
  });

  /**
   * Editor for schemas of type 'object'
   * { type: "object", properties: {} }
   */
  $.jsoneditor.editors.object = $.jsoneditor.AbstractEditor.extend({
    default: {},
    init: function(options) {
      if(options.table_row) options.tag = 'tr';
      this._super(options);
    },
    initialize: function() {
      var self = this;
      this.value = {};

      // If this should be rendered as a table row
      if(this.options.table_row) {
        this.editor_holder = this.div;
      }
      // If it should be rendered as a div
      else {
        this.theme.indentDiv(this.div);


        // Add a title and placeholder for action buttons
        this.title = this.theme.getTitle(this.schema.title || this.schema.id || this.key).appendTo(this.div);
        this.title_controls = this.theme.getTitleControls().appendTo(this.title);

        // Add toggle button to collapse/expand object
        this.toggle_button = this.theme.getButton('Toggle').addClass('toggle').appendTo(this.title_controls).attr('data-toggle','shown').css({marginLeft: 20}).on('click',function(e) {
          if($(this).attr('data-toggle')==='hidden') {
            $(this).attr('data-toggle','shown');
            self.editor_holder.show(300);
          }
          else {
            $(this).attr('data-toggle','hidden');
            self.editor_holder.hide(300);
          }

          e.stopPropagation();
          e.preventDefault();
          return false;
        });

        // Put all child editors within a well
        this.editor_holder = this.theme.getChildEditorHolder().appendTo(this.div);
      }

      // Add child editors
      this.editors = {};
      $.each(this.schema.properties,function(key,schema) {
        var editor = $.jsoneditor.getEditorClass(schema, self.jsoneditor);
        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: self.editor_holder,
          path: self.path+'.'+key,
          parent: self,
          tag: (self.options.table_row? 'td' : 'div')
        });
      });

      // If a child editor changes, update this one's value
      self.editor_holder.on('change',function() {
        self.refresh();
      });

      this.refresh();

      if(this.options.collapsed && this.toggle_button) this.toggle_button.trigger('click');
    },
    /**
     * Re-calculate value from child editors
     */
    refresh: function() {
      var self = this;
      this.value = {};
      $.each(this.editors,function(key,editor) {
        self.value[key] = editor.getValue();
      });
    },
    setValue: function(value) {
      value = value || {};
      $.each(this.editors,function(key,editor) {
        if(typeof value[key] !== "undefined") {
          editor.setValue(value[key]);
        }
      });
      this.refresh();
    },
    getValue: function() {
      return $.extend({},this.value);
    },
    destroy: function() {
      var self = this;
      $.each(this.editors,function(i,editor) {
        editor.destroy();
        self.editors[i] = null;
      });
      self.editors = null;

      this._super();
    }
  });

  // Boolean Editor (simple checkbox)
  $.jsoneditor.editors.boolean = $.jsoneditor.AbstractEditor.extend({
    default: false,
    initialize: function() {
      var self = this;

      this.value = false;

      this.input_holder = $("<div></div>").css({
        padding: '10px 0'
      }).appendTo(this.div);
      
      this.label = this.theme.getFormInputLabel(this.schema.title || this.schema.id || this.key);
      this.input = this.theme.getFormInputField('checkbox');
      
      this.theme.addFormInputControl(this.input_holder,this.label,this.input);

      this.input
        // data-schemapath is used by other editors to listen to changes
        .attr('data-schemapath',this.path)
        // data-schematype can be used to style different editors based on the string editor
        .attr('data-schematype',this.schema.type)
        //update the editor's value when it is changed
        .on('change',function(e) {
          self.updateValue();
        });
    },
    updateValue: function() {
      this.value = this.input.prop('checked');
    },
    setValue: function(val) {
      if(val) this.input.prop('checked',true);
      else this.input.prop('checked',false);

      this.updateValue();
    }
  });

  /**
   * Editor for schemas of type 'string'
   *
   * Renders a text input
   * { type: "string" }
   *
   * Renders a select box if the 'enum' property is set
   * { type: "string", enum: ["option 1","option 2"] }
   */
  $.jsoneditor.editors.string = $.jsoneditor.AbstractEditor.extend({
    default: '',
    initialize: function() {
      this.value = '';

      var self = this;
      this.label = this.theme.getFormInputLabel(this.schema.title || this.schema.id || this.key).appendTo(this.div);

      // Select box
      if(this.schema.enum) {
        this.input_type = 'select';
        this.input = this.theme.getSelectInput().css('width','auto');
        $.each(this.schema.enum,function(i,val) {
          self.input.append(self.theme.getSelectOption(val))
        });
      }
      // Text Area
      else if(this.options.textarea) {
        this.input_type = 'textarea';
        this.input = this.theme.getTextareaInput();
      }
      // Text input
      else {
        this.input_type = this.schema.format? this.schema.format : 'text';
        this.input = this.theme.getFormInputField(this.input_type);

        // Set the min/max for format="range"
        if(this.input_type === 'range') {
          this.input.attr('min',(this.schema.minimum || 0));
          this.input.attr('max',(this.schema.maximum || 100));
          this.input.css({
            marginBottom: '10px'
          });
        }
      }

      this.input
        // data-schemapath is used by other editors to listen to changes
        .attr('data-schemapath',this.path)
        // data-schematype can be used to style different editors based on the string editor
        .attr('data-schematype',this.schema.type)
        // update the editor's value when it is changed
        .on('change keyup',function(e) {
          // Don't allow changing if this field is a template
          if(self.schema.template) {
            $(this).val(self.value);
            return;
          }

          var val = $(this).val();
          // sanitize value
          var sanitized = self.sanitize(val);
          if(val !== sanitized) {
            e.preventDefault();
            e.stopPropagation();
            $(this).val(sanitized);
          }
          self.updateValue();
        })
        .appendTo(this.div);

      // For input type='range', we need to display the value after the input
      if(this.input_type === 'range') {
        this.output = this.theme.getFormOutput().insertAfter(this.input);
      }

      // If this schema is based on a macro template, set that up
      if(this.schema.template) this.setupTemplate();
      else this.updateValue();
    },
    updateValue: function() {
      this.value = this.input.val();

      if(this.output) this.output.val(this.value);
    },
    destroy: function() {
      if(this.vars) {
        var self = this;
        // Remove event listeners for the macro template
        $.each(this.vars,function(name,attr) {
          attr.root.off('change','[data-schemapath="'+attr.adjusted_path+'"]',self.var_listener)
        });
        self.var_listener = null;
      }
      this.template = null;
      this.vars = null;

      this._super();
    },
    setValue: function(value,from_template) {
      // Don't allow directly setting the value
      if(this.template && !from_template) return;

      value = value || '';

      // Sanitize value before setting it
      var sanitized = this.sanitize(value);
      if(this.schema.enum && this.schema.enum.indexOf(sanitized) < 0) {
        sanitized = this.schema.enum[0];
      }

      // If the value has changed
      this.input.val(sanitized);

      this.updateValue();

      if(from_template) this.input.trigger('change');
    },
    setupTemplate: function() {
      // Don't allow editing the input directly if it's based on a macro template
      this.input.addClass('disabled');

      // Compile and store the template
      this.template = $.jsoneditor.template.compile(this.schema.template);

      // Prepare the template vars
      this.vars = {};
      if(this.schema.vars) {
        var self = this;
        this.var_listener = function() {
          window.setTimeout(function() {
            self.refresh();
          });
        };
        $.each(this.schema.vars,function(name,path) {
          var path_parts = path.split('.');
          var first = path_parts.shift();

          // Find the root node for this template variable
          var root = self.div.closest('[data-schemaid="'+first+'"]');
          if(!root.length) throw "Unknown template variable path "+path;

          // Keep track of the root node and path for use when rendering the template
          var adjusted_path = root.data('editor').path + '.' + path_parts.join('.');
          self.vars[name] = {
            root: root,
            path: path_parts,
            adjusted_path: adjusted_path
          };

          // Listen for changes to the variable field
          root.on('change','[data-schemapath="'+adjusted_path+'"]',self.var_listener);
        });

        self.var_listener();
      }
    },
    /**
     * This is overridden in derivative editors
     */
    sanitize: function(value) {
      return value;
    },
    /**
     * Re-calculates the value if needed
     */
    refresh: function() {
      // If this editor needs to be rendered by a macro template
      if(this.template) {
        // Build up template variables
        var vars = {};
        $.each(this.vars,function(name,attr) {
          var obj = attr.root.data('editor').getValue();
          var current_part = -1;
          var val = null;
          // Use "path.to.property" to get root['path']['to']['property']
          while(1) {
            current_part++;
            if(current_part >= attr.path.length) {
              val = obj;
              break;
            }

            if(!obj || typeof obj[attr.path[current_part]] === "undefined") {
              break;
            }

            obj = obj[attr.path[current_part]];
          }
          vars[name] = val;
        });
        this.setValue(this.template(vars),true);
      }
    }
  });

  /**
   * Editor for schemas of type 'array'
   * { type: "array", items: {} }
   *
   * Only supports arrays where every element has the same schema (specified in the 'items' property)
   */
  $.jsoneditor.editors.array = $.jsoneditor.AbstractEditor.extend({
    default: [],
    initialize: function() {
      var self = this;
      this.value = [];

      this.title = this.theme.getTitle(this.schema.title || this.schema.id || this.key).addClass('title').appendTo(this.div);
      this.title_controls = this.theme.getTitleControls().appendTo(this.title);

      // If rendering the editor as an editable html table
      if(this.options.table_format) {
        this.table = this.theme.getTable().appendTo(this.div);

        var headers = [];        
        $.each(this.schema.items.properties,function(key,prop) {
          headers.push(prop.title||prop.id||key);
        });
        headers.push('actions');

        this.theme.addTableHeader(this.table, headers);
        this.row_holder = this.theme.addTableBody(this.table);
      }
      else {
        // Indent the editor so it's easy to see the nested relationships
        this.theme.indentChildEditor(this.div);

        this.row_holder = $("<div>").appendTo(this.div);
      }

      this.controls = this.theme.getControls().appendTo(this.div);

      // If a child editor changes, update this one's value
      this.row_holder.on('change',function() {
        self.refresh();
      });

      this.rows = [];

      this.addControls();
      this.refresh();

      if(this.options.collapsed) {
        self.toggle_button.trigger('click');
      }


    },
    addControls: function() {
      var self = this;
      this.toggle_button = this.theme.getButton('Toggle All').appendTo(this.title_controls).css({marginLeft: 20}).addClass('toggle-all').attr('data-toggle','shown').on('click',function(e) {
        if($(this).attr('data-toggle')==='shown') {
          $(this).attr('data-toggle','hidden');

          // For table editor, hide the table
          if(self.options.table_format) {
            self.row_holder.hide();
            self.controls.hide();
          }
          // For array editor, toggle each element
          else {
            $('.toggle[data-toggle="shown"]',self.row_holder).trigger('click');
          }
        }
        else {
          $(this).attr('data-toggle','shown');

          // For table editor, show the table
          if(self.options.table_format) {
            self.row_holder.show();
            self.controls.show();
          }
          // For array editor, show each element
          else {
            $('.toggle[data-toggle="hidden"]',self.row_holder).trigger('click');
          }
        }

        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      // Add "new row" and "delete last" buttons below editor
      this.add_row_button = this.theme.getButton('Add '+(this.schema.items.title || this.schema.items.id || this.schema.title || this.schema.id || this.key))
        .on('click',function() {
          self.addRow();
          self.refresh();
          self.div.trigger('change');
        })
        .appendTo(self.controls);

      this.delete_last_row_button = this.theme.getButton('Delete Last '+(this.schema.items.title || this.schema.items.id || this.schema.title || this.schema.id || this.key))
        .on('click',function() {
          var rows = self.getValue();
          rows.pop();
          self.setValue(rows);
          self.div.trigger('change');
        })
        .appendTo(self.controls);

      this.remove_all_rows_button = this.theme.getButton('Delete All Rows')
        .on('click',function() {
          self.setValue([]);
          self.div.trigger('change');
        })
        .appendTo(self.controls);

      // Make rows sortable
      this.row_holder
        .on('sortupdate',function(e,ui) {
          var oldi = ui.oldindex;
          var newi = ui.item.index();

          e.stopPropagation();
          e.preventDefault();

          if(oldi == newi) return;

          // Get the new value for the array
          var value = self.getValue();
          var newval = [];
          var row = value[oldi];
          var before = oldi>newi;
          $.each(value,function(i,el) {
            if(i===oldi) return;

            if(before) {
              if(i===newi) newval.push(row);
              newval.push(el);
            }
            else {
              newval.push(el);
              if(i===newi) newval.push(row);
            }
          });

          // Move the element back to where it was
          ui.item.detach();
          if(oldi) {
            self.row_holder.children().eq(oldi-1).after(ui.item);
          }
          else {
            self.row_holder.children().eq(0).before(ui.item);
          }

          self.setValue(newval);
          self.div.trigger('change');
        })
    },
    destroy: function() {
      this.empty();
      this.rows = null;

      this._super();
    },
    addRow: function(value) {
      var self = this;
      var i = this.rows.length;

      var schema_copy = $.extend({},self.schema.items);
      schema_copy.title = (schema_copy.title || schema_copy.id || self.schema.title || self.schema.id || self.key)+' '+i;

      var editor = $.jsoneditor.getEditorClass(schema_copy, self.jsoneditor);

      self.rows[i] = new editor({
        jsoneditor: self.jsoneditor,
        schema: schema_copy,
        container: self.row_holder,
        path: self.path+'.'+i,
        parent: self,
        table_row: self.options.table_format
      });

      // Buttons to delete row, move row up, and move row down
      self.rows[i].delete_button = this.theme.getButton('Delete '+(self.schema.items.title||self.schema.items.id||self.schema.title||self.schema.id||self.key))
        .addClass('delete')
        .data('i',i)
        .on('click',function() {
          var i = $(this).data('i');

          var value = self.getValue();

          var newval = [];
          $.each(value,function(j,row) {
            if(j===i) return; // If this is the one we're deleting
            newval.push(row);
          });
          self.setValue(newval);
          self.div.trigger('change');
        });
      self.rows[i].moveup_button = this.theme.getButton('Move up')
        .data('i',i)
        .addClass('moveup')
        .on('click',function() {
          var i = $(this).data('i');

          if(i<=0) return;
          var rows = self.getValue();
          var tmp = rows[i-1];
          rows[i-1] = rows[i];
          rows[i] = tmp;

          self.setValue(rows);
          self.div.trigger('change');
        });
      self.rows[i].movedown_button = this.theme.getButton('Move down')
        .addClass('movedown')
        .data('i',i)
        .on('click',function() {
          var i = $(this).data('i');

          var rows = self.getValue();
          if(i>=rows.length-1) return;
          var tmp = rows[i+1];
          rows[i+1] = rows[i];
          rows[i] = tmp;

          self.setValue(rows);
          self.div.trigger('change');
        });

      var controls_holder;

      // In the table format, action buttons go in a column to the far right
      if(this.options.table_format) {
        controls_holder = this.theme.getControls().appendTo(this.theme.getTableCell().appendTo(self.rows[i].div));
      }
      // In the div layout, buttons go next to the title
      else {
        controls_holder = self.rows[i].title_controls;
      }

      controls_holder.append(self.rows[i].delete_button);
      if(i) controls_holder.append(self.rows[i].moveup_button);
      controls_holder.append(self.rows[i].movedown_button);

      // Make child editors compact within the table format
      if(this.options.table_format) {
        var row = this.rows[this.rows.length-1];

        // Hide labels, headers, wells, make inputs shorter
        // TODO: use theme
        $('label,h1,h2,h3,h4,h5,h6',row.div).remove();
        $('.well',row.div).removeClass('well').css({
          marginLeft: 0,
          paddingLeft: 0
        });

        // Make inputs small and remove bottom margins
        // TODO: use theme
        $('.input-xxlarge',row.div).removeClass('input-xxlarge').css('margin-bottom',0);
        $('select',row.div).css('margin-bottom',0);
      }

      if(value) self.rows[i].setValue(value);
    },

    /**
     * Re-calculate the value for this editor
     */
    refresh: function() {
      var self = this;
      this.value = [];

      // If we currently have minItems items in the array
      var minItems = this.schema.minItems && this.schema.minItems >= this.rows.length;

      $.each(this.rows,function(i,editor) {
        // Hide the move down button for the last row
        if(i === self.rows.length - 1) {
          editor.movedown_button.hide();
        }
        else {
          editor.movedown_button.show();
        }

        // Hide the delete button if we have minItems items
        if(minItems) {
          editor.delete_button.hide();
        }
        else {
          editor.delete_button.show();
        }

        // Get the value for this editor
        self.value[i] = editor.getValue();
      });
      
      if(!this.value.length) {
        this.delete_last_row_button.hide();
        this.remove_all_rows_button.hide();
      }
      else if(this.value.length === 1) {      
        this.remove_all_rows_button.hide();  

        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems) {
          this.delete_last_row_button.hide();
        }
        else {
          this.delete_last_row_button.show();
        }
      }
      else {
        // If there are minItems items in the array, hide the delete button beneath the rows
        if(minItems) {
          this.delete_last_row_button.hide();
          this.delete_last_row_button.hide();
        }
        else {
          this.delete_last_row_button.show();
          this.remove_all_rows_button.show();
        }
      }

      // If there are maxItems in the array, hide the add button beneath the rows
      if(this.schema.maxItems && this.schema.maxItems <= this.rows.length) {
        this.add_row_button.hide();
      }
      else {
        this.add_row_button.show();
      }

      if(this.table) {
        if(this.value.length) this.table.show();
        else this.table.hide();
      }
    },
    /**
     * Destroy editors for all rows
     */
    empty: function() {
      var self = this;
      $.each(this.rows,function(i,row) {
        row.destroy();
        self.rows[i] = null;
      });
      self.rows = [];
    },
    setValue: function(value) {
      // Update the array's value, adding/removing rows when necessary
      value = value || [];

      // Make sure value has between minItems and maxItems items in it
      if(this.schema.minItems) {
        while(value.length < this.schema.minItems) {
          value.push({});
        }
      }
      if(this.schema.maxItems && value.length > this.schema.maxItems) {
        value = value.slice(0,this.schema.maxItems);
      }

      var self = this;
      $.each(value,function(i,val) {
        if(self.rows[i]) {
          // TODO: don't set the row's value if it hasn't changed
          self.rows[i].setValue(val);
        }
        else {
          self.addRow(val);
        }
      });

      for(var j=value.length; j<self.rows.length; j++) {
        self.rows[j].destroy();
        self.rows[j] = null;
      }
      self.rows = self.rows.slice(0,value.length);

      self.refresh();

      if($.fn.sortable) {
        self.row_holder.sortable('destroy');
        if(self.options.table_format) {
          self.row_holder.sortable({
            items: 'tr',
            placeholder: '<tr>'+self.theme.getTableCell().html('&nbsp;')+'</tr>',
            forcePlaceholderSize: true
          });
        }
      }
    }
  });

  // Compact version of array editor that uses table rows instead of divs
  // This works best when none of the array elements' properties have children
  $.jsoneditor.editors.table = $.jsoneditor.editors.array.extend({
    initialize: function() {
      this.options.table_format = true;
      this._super();
    }
  });

  // String editor derivatives
  $.jsoneditor.editors.number = $.jsoneditor.editors.string.extend({
    sanitize: function(value) {
      return (value+"").replace(/[^0-9\.\-]/g,'');
    },
    getValue: function() {
      return this.value*1;
    }
  });
  $.jsoneditor.editors.integer = $.jsoneditor.editors.string.extend({
    sanitize: function(value) {
      value = value + "";
      return value.replace(/[^0-9\-]/g,'');
    },
    getValue: function() {
      return this.value*1;
    }
  });

})(jQuery);
