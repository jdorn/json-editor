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
var $deepCompare = function() {
  var i, l, leftChain, rightChain;

  function compare2Objects (x, y) {
    var p;

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
         return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
        return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
       (x instanceof Date && y instanceof Date) ||
       (x instanceof RegExp && y instanceof RegExp) ||
       (x instanceof String && y instanceof String) ||
       (x instanceof Number && y instanceof Number)) {
        return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
        return false;
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
        return false;
    }

    if (x.constructor !== y.constructor) {
        return false;
    }

    if (x.prototype !== y.prototype) {
        return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
         return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
        }
        else if (typeof y[p] !== typeof x[p]) {
            return false;
        }
    }

    for (p in x) {
        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
        }
        else if (typeof y[p] !== typeof x[p]) {
            return false;
        }

        switch (typeof (x[p])) {
            case 'object':
            case 'function':

                leftChain.push(x);
                rightChain.push(y);

                if (!compare2Objects (x[p], y[p])) {
                    return false;
                }

                leftChain.pop();
                rightChain.pop();
                break;

            default:
                if (x[p] !== y[p]) {
                    return false;
                }
                break;
        }
    }

    return true;
  }

  if (arguments.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more arguments to compare";
  }

  for (i = 1, l = arguments.length; i < l; i++) {

      leftChain = []; //Todo: this can be cached
      rightChain = [];

      if (!compare2Objects(arguments[0], arguments[i])) {
          return false;
      }
  }

  return true;
};
