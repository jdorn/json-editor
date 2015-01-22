// hyper-link describeBy Custom Validator

JSONEditor.defaults.custom_validators.push(function(schema, value, path) {
  if (schema.links) {
    for (var i = 0; i < schema.links.length; i++) {
      if (schema.links[i].rel.toLowerCase() === "describedby") {
        var href = schema.links[i].href;
        var data = this.jsoneditor.root.getValue();
        //var template = new UriTemplate(href); //preprocessURI(href));
        //var ref = template.fillFromObject(data);
        var template = this.jsoneditor.compileTemplate(href, this.jsoneditor.template);
        var ref = template(data);

        schema.links.splice(i, 1);

        schema = $extend({}, schema, this.jsoneditor.refs[ref]);

        return this._validateSchema(schema, value, path);
      }
    }
  }

  return [];
});