function XOR(s)
{
  this.x = s & 0xFF000000;
  this.y = s & 0x00FF0000;
  this.z = s & 0x0000FF00;
  this.w = s & 0x000000FF;
};

XOR.RAND_MAX = Math.pow(2, 32);

// 32 bit int
XOR.prototype.rand = function()
{
  var t = x ^ (x << 11);
  x = y; // shift through the reg
  y = z;
  z = w;
  return (w = w ^ (w >> 19) ^ t ^ (t >> 8));
};

// 31 bit int
XOR.prototype.rand31 = function()
{
  return this.rand() >>> 1;
}

// 0..0.99...
XOR.prototype.random = function()
{
  return this.rand() / XOR.RAND_MAX;
}

// 0..1
XOR.prototype.randomOne = function()
{
  return this.rand() / (XOR.RAND_MAX - 1);
}

// min.,max float
XOR.prototype.randomRange = function(min, max)
{
  if (min === max)
    return min;
  if (min >= max)
  {
    var t = min;
    min = max;
    max = t;
  }
  return min + ((max - min) * this.randomOne());
}

// min..max int
XOR.prototype.randRange = function(min, max)
{
  return Math.floor(this.randomRange(min, max + 1));
}
