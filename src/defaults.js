// Set the default theme
$.jsoneditor.theme = 'html';

// Set the default template engine
$.jsoneditor.template = 'default';

// Set the default resolvers
$.jsoneditor.resolvers.unshift(function(schema) {
  // Unknown or compound type
  return "multiple";
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema is a simple type
  if(typeof schema.type === "string") return schema.type;
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If the schema can be of any type
  if(schema.type === "any") return "multiple";
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // Type `array` with format set to `table`
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // Array or Object with enumerated values
  if(schema.type === "array" || schema.type === "object") {
    if(schema.enum) return "enum";
  }
});
$.jsoneditor.resolvers.unshift(function(schema) {
  // If this schema uses `oneOf`
  if(schema.oneOf) return "multiple";
});
