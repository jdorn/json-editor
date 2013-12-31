// Set the default theme
$.jsoneditor.theme = 'html';

// Set the default template engine
$.jsoneditor.template = 'default';

// Set the default resolvers
$.jsoneditor.resolvers.unshift(function(schema) {
  return schema.type;
});
$.jsoneditor.resolvers.unshift(function(schema) {
 if(schema.type && schema.type instanceof Array) {
   return "multiple";
 }
});
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});
