// Set the default theme
$.jsoneditor.theme = 'html';

// Set the default template engine
$.jsoneditor.template = 'default';

// Set the default resolvers
$.jsoneditor.resolvers.unshift(function(schema) {
  // TODO: handle schemas with no type set
  // TODO: handle schemas with the type set to a schema
  return "string";
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema is a simple type
  if(typeof schema.type === "string") return schema.type;
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema can be of any type or an enumerated list of types
  if(schema.type === "any" || schema.type && schema.type instanceof Array) {
    return "multiple";
  }
});
$.jsoneditor.resolvers.unshift(function(schema) {
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});
