/**
 * Taken from jQuery 1
 *
 * @param obj
 * @returns {*}
 */
var $isplainobject = function( obj ) {
  var key;

  // Must be an Object.
  // Because of IE, we also have to check the presence of the constructor property.
  // Make sure that DOM nodes and window objects don't pass through, as well
  if ( !obj || typeof obj !== "object" || obj.nodeType || obj === window ) {
    return false;
  }

  // Not own constructor property must be Object
  if (obj.constructor &&
    !obj.hasOwnProperty('constructor') &&
    !obj.constructor.prototype.hasOwnProperty('isPrototypeOf')) {
    return false;
  }

  try {
    // Not own constructor property must be Object
    if ( obj.constructor &&
        !obj.hasOwnProperty("constructor") &&
        !obj.constructor.prototype.hasOwnProperty('isPrototypeOf') ) {
      return false;
    }
  } catch ( e ) {
    // IE8,9 Will throw exceptions on certain host objects #9897
    return false;
  }

  // Support: IE<9
  // Handle iteration over inherited properties before own properties.
  if ( /msie 8\.0/i.test( window.navigator.userAgent ) ) {
    for ( key in obj ) {
      return obj.hasOwnProperty(key);
    }
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  for ( key in obj ) {}
  return key === undefined || obj.hasOwnProperty(key);
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

/*
 * Minimal functionality taken from math.js v1.7.0 for floating point arithmetic.
 * math.js is under Apache license, see https://github.com/josdejong/mathjs/blob/master/LICENSE for license
 */
var $math = {
  epsilon: 1e-14,
  dbl_epsilon: Number.EPSILON || 2.2204460492503130808472633361816E-16,
  isNumber: function(value) {
    return (value instanceof Number) || (typeof value == 'number');
  },
  mod: function(x, y) {
    if (y > 0) {
      // We don't use JavaScript's % operator here as this doesn't work
      // correctly for x < 0 and x == 0
      // see http://en.wikipedia.org/wiki/Modulo_operation
      return x - y * Math.floor(x / y);
    }
    else if (y === 0) {
      return x;
    }
    else { // y < 0
      // TODO: implement mod for a negative divisor
      throw new Error('Cannot calculate mod for a negative divisor');
    }
  },
  nearlyEqual: function(x, y) {
    // use "==" operator, handles infinities
    if (x == y) return true;

    // NaN
    if (isNaN(x) || isNaN(y)) return false;

    // at this point x and y should be finite
    if(isFinite(x) && isFinite(y)) {
      // check numbers are very close, needed when comparing numbers near zero
      var diff = Math.abs(x - y);
      if (diff < $math.dbl_epsilon) {
	return true;
      }
      else {
	// use relative error
	return diff <= Math.max(Math.abs(x), Math.abs(y)) * $math.epsilon;
      }
    }

    // Infinite and Number or negative Infinite and positive Infinite cases
    return false;
  },
  larger: function(x, y) {
    if ($math.isNumber(x) && $math.isNumber(y)) {
      return !$math.nearlyEqual(x, y, $math.epsilon) && x > y;
    } else {
      throw new TypeError('larger', typeof(x), typeof(y));
    }
  },
  largerEq: function(x, y) {
    if ($math.isNumber(x) && $math.isNumber(y)) {
      return $math.nearlyEqual(x, y, $math.epsilon) || x > y;
    } else {
      throw new TypeError('largerEq', typeof(x), typeof(y));
    }
  },
  smaller: function(x, y) {
    if ($math.isNumber(x) && $math.isNumber(y)) {
      return !$math.nearlyEqual(x, y, $math.epsilon) && x < y;
    } else {
      throw new TypeError('smaller', typeof(x), typeof(y));
    }
  },
  smallerEq: function(x, y) {
    if ($math.isNumber(x) && $math.isNumber(y)) {
      return !$math.nearlyEqual(x, y, $math.epsilon) && x < y;
    } else {
      throw new TypeError('smallerEq', typeof(x), typeof(y));
    }
  }
};
