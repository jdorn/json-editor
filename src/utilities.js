var $isplainobject = function( obj ) {
  // Not own constructor property must be Object
  if ( obj.constructor &&
    !obj.hasOwnProperty('constructor') &&
    !obj.constructor.prototype.hasOwnProperty('isPrototypeOf')) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.

  var key;
  for ( key in obj ) {}

  return key === undefined || obj.hasOwnProperty(key);
};

var $extend = function(destination) {
  var source, i,property;
  for(i=1; i<arguments.length; i++) {
    source = arguments[i];
    for (property in source) {
      if(source[property] && $isplainobject(source[property])) {
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
  if(!obj) return;
  var i;
  if(typeof obj.length !== 'undefined') {
    for(i=0; i<obj.length; i++) {
      if(callback(i,obj[i])===false) return;
    }
  }
  else {
    for(i in obj) {
      if(!obj.hasOwnProperty(i)) continue;
      if(callback(i,obj[i])===false) return;
    }
  }
};

var $trigger = function(el,event) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(event, true, true);
  el.dispatchEvent(e);
};
var $triggerc = function(el,event) {
  var e = new CustomEvent(event,{
    bubbles: true,
    cancelable: true
  });

  el.dispatchEvent(e);
};
