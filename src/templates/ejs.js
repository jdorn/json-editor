JSONEditor.defaults.templates.ejs = function() {
  if(!window.EJS) return false;

  return {
    compile: function(template) {
      var compiled = new window.EJS({
        text: template
      });

      return function(context) {
        return compiled.render(context);
      };
    }
  };
};
