var $extend = function(destination) {
  var source;
  for(var i=1; i<arguments.length; i++) {
    source = arguments[i];
    for (var property in source) {
      if(!source.hasOwnProperty(property)) continue;
      if(source[property] && source[property].constructor && source[property].constructor === Object) {
        destination[property] = destination[property] || {};
        $extend(destination[property], source[property]);
      }
      else {
        destination[property] = source[property];
      }
    }
  }
  return destination;
};

var $each = function(obj,callback) {
  if(obj.length) {
    for(var i=0; i<obj.length; i++) {
      if(callback(i,obj[i])===false) return;
    }
  }
  else {
    for(var i in obj) {
      if(!obj.hasOwnProperty(i)) continue;
      if(callback(i,obj[i])===false) return;
    }
  }
};

var _raf = window.requestAnimationFrame || function(callback) { window.setTimeout(callback,16) };

var $trigger = function(el,event) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(event, true, true);
  el.dispatchEvent(e);
};
var $triggerc = function(el,event) {
  if (window.CustomEvent) {
    var e = new CustomEvent(event,{
      bubbles: true,
      cancelable: true
    });
  } else {
    var e = document.createEvent('CustomEvent');
    e.initCustomEvent(event, true, true);
  }

  el.dispatchEvent(e);
};
