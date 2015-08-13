JSONEditor.defaults.templates["default"] = function() {
  return {
    compile: function(template) {
      var matches = template.match(/{{\s*([a-zA-Z0-9\-_ \.]+)\s*}}/g);
      var l = matches && matches.length;

      // Shortcut if the template contains no variables
      if(!l) return function() { return template; };

      // Pre-compute the search/replace functions
      // This drastically speeds up template execution
      var replacements = [];
      var get_replacement = function(i) {
        var p = matches[i].replace(/[{}]+/g,'').trim().split('.');
        var n = p.length;
        var func;
        
        if(n > 1) {
          var cur;
          func = function(vars) {
            cur = vars;
            for(i=0; i<n; i++) {
              cur = cur[p[i]];
              if(!cur) break;
            }
            return cur;
          };
        }
        else {
          p = p[0];
          func = function(vars) {
            return vars[p];
          };
        }
        
        replacements.push({
          s: matches[i],
          r: func
        });
      };
      for(var i=0; i<l; i++) {
        get_replacement(i);
      }

      // The compiled function
      return function(vars) {
        var ret = template+"";
        var r;
        for(i=0; i<l; i++) {
          r = replacements[i];
          ret = ret.replace(r.s, r.r(vars));
        }
        return ret;
      };
    }
  };
};
