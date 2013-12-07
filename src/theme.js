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
