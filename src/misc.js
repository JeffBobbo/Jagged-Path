/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

var JP = JP || {};


/**
 * Returns the number of ms Jagged Path has been running in total
 * @function
 * @param {boolean} [update=false] - Should only be called with true once a frame
 * @return number tickCount
 */
JP.getTickCount = function(update)
{
  if (JP.getTickCount.tick === undefined)
  {
    JP.getTickCount.tick = localStorage.getItem("JP.tickCount") || 0; // restore from save, or start at 0
    JP.getTickCount.now = getTime(); // set to now
  }
  if (update === true)
  {
    JP.getTickCount.tick += getTime() - JP.getTickCount.now; // increment the difference
    JP.getTickCount.now = getTime(); // set to now again

    // update the others
    JP.getFPS(true);
    JP.getTickDelta(true);
  }
  return JP.getTickCount.tick; // our total since the start of time (when the world started)
};

/**
 * Returns the number of ms the last frame took to do
 * @function
 * @param {boolean} [update=false] - Never call this with update=true outside of {@link JP.getTickCount}
 * @return number tickDelta
 */
JP.getTickDelta = function(update)
{
  if (JP.getTickDelta.now === undefined)
  {
    JP.getTickDelta.last = 0; // init
    JP.getTickDelta.now  = 0;
  }
  if (update === true)
  {
    JP.getTickDelta.last = JP.getTickDelta.now; // last tick
    JP.getTickDelta.now  = JP.getTickCount(); // time now
  }
  return JP.getTickDelta.now - JP.getTickDelta.last; // different
};


/**
 * Returns the reciprocal of the average frame time for the last 60 frames
 * @function
 * @param {boolean} [update=false] - Never call this with update=true outside of {@link JP.getTickCount}
 * @return number fps
 */
JP.getFPS = function(update)
{
  if (JP.getFPS.cache === undefined)
  {
    JP.getFPS.cache = [];
    JP.getFPS.fps = 0;
  }

  if (update === true)
  {
    JP.getFPS.cache.push(JP.getTickDelta());
    while (JP.getFPS.cache.length > 60)
      JP.getFPS.cache.shift(); // shift off first

    var ret = 0;
    for (var i = JP.getFPS.cache.length - 1; i >= 0; i--)
      ret += JP.getFPS.cache[i];

    ret /= JP.getFPS.cache.length;
    JP.getFPS.fps = 1000 / ret;
  }
  return JP.getFPS.fps;
}

/**
 * Generate a random floating point number in the range [min, max]
 * @function
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randRange(min, max)
{
  if (min === max)
    return min;
  if (min >= max)
  {
    var tmp = min;
    min = max;
    max = tmp;
  }
  return min + ((max - min) * Math.random());
}

/**
 * Generate a random integer in the range [min, max]
 * @function
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randIntRange(min, max)
{
  return Math.floor(randRange(min, max + 1));
}

/**
 * Returns true 50% of the time randomly
 * @function
 * @return {boolean}
 */
function randTrue()
{
  return Math.random() > 0.5;
}

/**
 * Truncates x towards zero for the next multiple of r
 * @function
 * @param {number} x
 * @param {number} r
 * @return {number}
 */
function TruncateTo(x, r)
{
  return x - (x % r);
}

/**
 * Return milliseconds since epoch
 * @function
 * @return {number} ms
 */
function getTime()
{
  return new Date().getTime();
}

/**
 * Bound a value a to a range of [min, max]
 * @function
 * @param {number} min
 * @param {number} max
 * @param {number} a
 * @return {number}
 */
function Bound(min, max, a)
{
  return (a < min ? min : (a > max ? max : a));
}

/**
 * Returns true if a lies within the range of [min, max]
 * @function
 * @param {number} [min=-Infinity]
 * @param {number} [max=Infinity]
 * @return {boolean} randomFloat
 */
function InRange(min, max, a)
{
  min = min !== undefined ? min : -Infinity;
  max = max !== undefined ? max :  Infinity;
  return min <= a && a <= max;
}

/**
 * Returns the square of a, for reability
 * @function
 * @param {number} a
 * @return {number} a²
 */
function Squared(a)
{
  return a*a;
}

/**
 * Returns the cube of a, for reability
 * @function
 * @param {number} a
 * @return {number} a³
 */
function Cubed(a)
{
  return a*a*a;
}

/**
 * Calculates the hypotenuse for any list of points
 * @function
 * @param {...number} a
 * @return {number} hypot
 */
function Hypotenuse()
{
  var ret = 0;
  for (var i = 0; i < arguments.length; ++i)
    ret += Squared(arguments[i]);
  return Math.sqrt(ret);
}

/**
 * Calculates the distance between (x1, y1) and (x2, y2)
 * @function
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {number} dist
 */
function Distance(x1, y1, x2, y2)
{
  return Hypotenuse(x1 - x2, y1 - y2);
}

/**
 * Linear interpolation of p between min and max
 * @function
 * @param {number} min
 * @param {number} max
 * @param {number} p
 * @return {number} lerp
 */
function Interpolate(min, max, p)
{
  return (1 - p) * min + (p * max);
}

/**
 * Normalize an array of values, that is, so the sum of the values equals 1
 * @function
 * @param {array}
 * @return {array}
 */
function Normalize(arr)
{
  var sum = 0;
  for (var i = arr.length - 1; i >= 0; i--)
    sum += arr[i];
  for (var i = arr.length - 1; i >= 0; i--)
    arr[i] /= sum;
  return arr;
}

/**
 * Calculates if a point is within a segment of a circle that has a radius at location origin specified by tMin and tMax
 * @function
 * @param {object} origin - Where the circle is, eg, {x: 4, y: 5}
 * @param {object} point - Where the point is, eg, {x:3. y: 4.5}
 * @param {number} tMin - Lower bound for segment, in radians
 * @param {number} tMax - Upper bound for segment, in radians
 * @param {number} radius
 * @return {boolean}
 */
JP.InsideSegment = function(origin, point, tMin, tMax, radius)
{
  var rel = {
    x: origin.x - point.x,
    y: origin.y - point.y,
  };

  // make sure it's in the radius
  if (rel.x * rel.x + rel.y * rel.y > radius)
    return false;

  var t = JP.atan(rel.x, rel.y);

  var a = ((tMax - tMin) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);

  // check if it passes through zero
  if (tMin <= tMax)
    return t >= tMin && t <= tMax;
  else
    return t >= tMin || t <= tMax;
};

/**
 * Convenience function for putting x and y the right way rounf for Math.atan2
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
JP.atan = function(x, y) // params the right way round... ffs
{
  return Math.atan2(y, x);
};

/**
 * Convenience function for converting degrees into radians
 * @param {number} degrees
 * @returns {number} radians
 * @memberOf JP
 */
JP.rad = function(d)
{
  return d * Math.PI / 180;
}

/**
 * Convenience function for converting radians into degrees
 * @param {number} radians
 * @returns {number} degrees
 * @memberOf JP
 */
JP.deg = function(r)
{
  return r * 180 / Math.PI;
}

/**
 * Commify large numbers for easier reading, eg 123456 -> 123,456
 * @param {number}
 * @returns {string}
 */
function Commify(x)
{
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Turns a number into it's 'SI'ish form, eg 2,500 -> 2.5k
 * @param {number}
 * @returns {string}
 */
function SIfy(x)
{
  if (x > 1000000000000)
    return Math.floor(x / 10000000000) / 100 + "t";
  if (x > 1000000000)
    return Math.floor(x / 10000000) / 100 + "b";
  if (x > 1000000)
    return Math.floor(x / 10000) / 100 + "m";
  if (x > 1000)
    return Math.floor(x / 10) / 100 + "k";
  return Math.floor(x);
}

/** Parses a native type for boolean data
 * @param {string|number|boolean}
 * @returns {boolean}
 */
function parseBool(x)
{
  x = "" + x || null;
  if (x === null)
    return false;

  switch (x.toLowerCase())
  {
    case "true":
    case "yes":
      return true;
    break;
    default:
      if (parseInt(x) > 0)
        return true;
    break;
  }
  return false;
}

// window focus
window.onfocus = function()
{
  JP.focus = true;

  JP.KeyMap = []; // reset the key state
};
window.onblur = function()
{
  JP.focus = false;

  JP.KeyMap = []; // reset the key state
};

// prototype'd functions
Array.prototype.clear = function()
{
  while (this.length > 0)
    this.pop();
};

// string erase function
String.prototype.erase = function(s, e)
{
  // erase from s up to e
  // if e is undefined, go from s to the end
  if (e === undefined)
    e = this.length;
  var ret = "";
  ret += this.slice(0, s);
  ret += this.slice(e, this.length);
  return ret;
};

String.prototype.toTitleCase = function()
{
  var words = this.split(' ');
  var results = new Array();
  for (var i = 0; i < words.length; ++i)
  {
    var letter = words[i].charAt(0).toUpperCase();
    results.push(letter + words[i].slice(1));
  }
  return results.join(' ');
};

// merge stuff from other into this if it exists in other
Object.prototype.merge = function(other)
{
  if (other === undefined || other === null)
    return;
  var keys = Object.keys(this);
  for (var i = 0; i < keys.length; ++i)
  {
    if (other[keys[i]] === undefined && this[keys[i]] !== undefined) // this is a new value, but it already exists so skip
      continue;
    if (other[keys[i]] === NaN) // don't copy NaN values
      continue;
    if (this[keys[i]] === undefined) // it doesn't exist in our target, so don't add it
      continue;
    if (other[keys[i]] !== null && typeof(other[keys[i]]) === "object") // deep copy
    {
      if (other[keys[i]].isArray() === true)
        this[keys[i]] = other[keys[i]];
      else
        this[keys[i]].merge(other[keys[i]]);
    }
    else
      this[keys[i]] = other[keys[i]];
  };
};

Object.prototype.isArray = function()
{
  return Object.prototype.toString.call(this) === '[object Array]';
};

function RemoveChildren(node)
{
  while (node.lastChild)
    node.removeChild(node.lastChild);
  return node;
};
