JSONEditor.defaults.templates["default"] = function() {
  function resolve(ref, context) {
    var dot = ref.indexOf('.');
    if (dot === -1)
      return context[ref];
    var predot = ref.slice(0, dot);
    if (!predot)
      return null;
    
    if (context[predot] === undefined)
      return null;
    
    return resolve(ref.slice(dot + 1), context[predot]);
  }
  
  return {
    compile: function(template) {
      return function (vars) {
        var ret = template+"";
        var re = /{{\s*([a-zA-Z0-9_.\-]+)\s*}}/g;
        var m = re.exec(ret);
        while (m) {
          var t = resolve(m[1], vars);
          if (t) {
            ret = ret.replace(m[0], t);
            re.lastIndex += (t.length - m[0].length); // handle short substitutions
          }
          m = re.exec(ret);
        }
        return ret;
      };
    }
  };
};
