JSONEditor.defaults.templates.mustache = function() {
  if(!window.Mustache) return false;

  return {
    compile: function(template) {
      return function(view) {
        return window.Mustache.render(template, view);
      };
    }
  };
};
