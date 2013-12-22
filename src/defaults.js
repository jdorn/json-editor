// Set the default theme
$.jsoneditor.theme = 'html';

// Set the default template engine based on what libraries are loaded
$.each($.jsoneditor.templates, function(key, template) {
  // If this template is supported
  if(template()) {
    $.jsoneditor.template = key;
    return false;
  }
});

// Set the default resolvers
$.jsoneditor.resolvers.unshift(function(schema) {
  return schema.type;
});
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});
