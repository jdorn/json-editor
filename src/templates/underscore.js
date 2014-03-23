JSONEditor.defaults.templates.underscore = function() {
  if(!window._) return false;

  return {
    compile: function(template) {
      return function(context) {
        return _.template(template, context);
      };
    }
  };
};
