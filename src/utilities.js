/**
 * Taken from jQuery 2.1.3
 *
 * @param obj
 * @returns {boolean}
 */
var $isplainobject = function( obj ) {
  // Not plain objects:
  // - Any object or value whose internal [[Class]] property is not "[object Object]"
  // - DOM nodes
  // - window
  if (typeof obj !== "object" || obj.nodeType || (obj !== null && obj === obj.window)) {
    return false;
  }

  if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
    return false;
  }

  // If the function hasn't returned already, we're confident that
  // |obj| is a plain object, created by {} or constructed with new Object
  return true;
};

var $extend = function(destination) {
  var source, i,property;
  for(i=1; i<arguments.length; i++) {
    source = arguments[i];
    for (property in source) {
      if(!source.hasOwnProperty(property)) continue;
      if(source[property] && $isplainobject(source[property])) {
        if(!destination.hasOwnProperty(property)) destination[property] = {};
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
  if(!obj || typeof obj !== "object") return;
  var i;
  if(Array.isArray(obj) || (typeof obj.length === 'number' && obj.length > 0 && (obj.length - 1) in obj)) {
    for(i=0; i<obj.length; i++) {
      if(callback(i,obj[i])===false) return;
    }
  }
  else {
    if (Object.keys) {
      var keys = Object.keys(obj);
      for(i=0; i<keys.length; i++) {
        if(callback(keys[i],obj[keys[i]])===false) return;
      }
    }
    else {
      for(i in obj) {
        if(!obj.hasOwnProperty(i)) continue;
        if(callback(i,obj[i])===false) return;
      }
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

var $uuid = function (options) {
    'use strict';
    // http://www.ietf.org/rfc/rfc4122.txt
    if (options && options.short) return "_"+("000000" + (Math.random()*Math.pow(36,8) << 0).toString(36)).slice(-6);

    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    return s.join("");
};
