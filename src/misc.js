/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

var JP = JP || {};

JP.getTickCount = function(update)
{
  if (JP.getTickCount.tick === undefined)
  {
    JP.getTickCount.tick = localStorage.getItem("JP.tickCount") || 0;
    JP.getTickCount.last = getTime();
  }
  JP.getTickCount.tick += getTime() - JP.getTickCount.last;
  if (update === true)
  {
    JP.getTickCount.last = getTime();
    JP.getFPS(true);
    JP.getTickDelta(true);
  }
  return JP.getTickCount.tick; 
};

JP.getTickDelta = function(update)
{
  if (JP.getTickDelta.now === undefined)
  {
    JP.getTickDelta.last = JP.getTickCount();
    JP.getTickDelta.now  = JP.getTickCount();
  }
  if (update === true)
  {
    JP.getTickDelta.last = JP.getTickDelta.now;
    JP.getTickDelta.now  = JP.getTickCount();
  }
  var ret = JP.getTickDelta.now - JP.getTickDelta.last;
  return ret;
};

JP.getFPS = function(update)
{
  if (JP.getFPS.cache === undefined)
    JP.getFPS.cache = [];

  if (update === true)
  {
    JP.getFPS.cache.push(JP.getTickDelta());
    if (JP.getFPS.cache.length > 20)
      JP.getFPS.cache.shift(); // shift off first
    JP.getFPS.last = 0;
    for (var i = JP.getFPS.cache.length - 1; i >= 0; i--)
      JP.getFPS.last += JP.getFPS.cache[i];
    JP.getFPS.last /= JP.getFPS.cache.length;
    JP.getFPS.last = 1000 / JP.getFPS.last;
  }
  return JP.getFPS.last;
}

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

function randIntRange(min, max)
{
  return Math.floor(randRange(min, max + 1));
}

function randTrue()
{
  return Math.random() > 0.5;
}

function TruncateTo(x, r)
{
  return x - (x % r);
}

function getTime()
{
  return new Date().getTime();
}

function Bound(min, max, a)
{
  return (a < min ? min : (a > max ? max : a));
}

function InRange(min, max, a)
{
  min = min !== undefined ? min : -Infinity;
  max = max !== undefined ? max :  Infinity;
  return min <= a && a <= max;
}

function Squared(a)
{
  return a*a;
}

function Cubed(a)
{
  return a*a*a;
}

function Hypotenuse()
{
  var ret = 0;
  for (var i = 0; i < arguments.length; ++i)
    ret += Squared(arguments[i]);
  return Math.sqrt(ret);
}

function Distance(x1, y1, x2, y2)
{
  return Hypotenuse(x1 - x2, y1 - y2);
}

function Interpolate(min, max, p)
{
  return (1 - p) * min + (p * max);
}

function Normalize(arr)
{
  var sum = 0;
  for (var i = arr.length - 1; i >= 0; i--)
    sum += arr[i];
  for (var i = arr.length - 1; i >= 0; i--)
    arr[i] /= sum;
  return arr;
}

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

JP.atan = function(x, y) // params the right way round... ffs
{
  return Math.atan2(y, x);
};

JP.rad = function(d)
{
  return d * Math.PI / 180;
}

JP.deg = function(r)
{
  return r * 180 / Math.PI;
}

function Commify(x)
{
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function SIfy(x)
{
  if (x > 1000000000)
    return Math.floor(x / 10000000) / 100 + "b";
  if (x > 1000000)
    return Math.floor(x / 10000) / 100 + "m";
  if (x > 1000)
    return Math.floor(x / 10) / 100 + "k";
  return Math.floor(x);
}

function strtob(str)
{
  if (str === undefined)
    return false;
  if (str === 0 || str === "0" || str === "false" || str === "FALSE" || str === "no" || str === "NO")
    return false;
  return true;
}

// window focus
window.onfocus = function()
{
  JP.focus = true;
};
window.onblur = function()
{
  JP.focus = false;
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
