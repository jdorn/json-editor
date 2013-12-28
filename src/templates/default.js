$.jsoneditor.templates.default = function() {
  return {
    compile: function(template) {
      return function (vars) {
        var ret = template+"";
        // Only supports basic {{var}} macro replacement
        $.each(vars,function(key,value) {
          ret = ret.replace(new RegExp('\{\{\s*'+key+'\s*\}\}','g'),value);
        });
        return ret;
      };
    }
  };
};
