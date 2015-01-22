// hyper-link describeBy Resolver

JSONEditor.defaults.resolvers.unshift(function(schema) {
  if (schema.links) {
    for (var i = 0; i < schema.links.length; i++) {
      if (schema.links[i].rel.toLowerCase() === "describedby") {
        return "describedBy";
      }
    }
  }
});
