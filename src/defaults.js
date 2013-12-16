// Set the default template engine based on what libraries are loaded
$.each($.jsoneditor.templates, function(key, template) {
  // If this template is supported
  if(template()) {
    $.jsoneditor.template = key;
    return false;
  }
});