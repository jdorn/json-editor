JSONEditor.defaults.templates.hogan = function() {
  if(!window.Hogan) return false;

  return {
    compile: function(template) {
      var compiled = window.Hogan.compile(template);
      return function(context) {
        return compiled.render(context);
      };
    }
  };
};
