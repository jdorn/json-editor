JSONEditor.defaults.templates.markup = function() {
  if(!window.Mark || !window.Mark.up) return false;

  return {
    compile: function(template) {
      return function(context) {
        return Mark.up(template,context);
      };
    }
  };
};
