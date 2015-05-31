MT = function(s)
{
  this.state = new Uint32Array(624);
  this.index = 0;

  this.seed(s);
};

MT.RAND_MAX = Math.pow(2, 32);

MT.prototype.seed = function(s)
{
  var seed = 0;
  switch (typeof(s))
  {
    case "function":
      seed = s();
    break;
    case "number":
      seed = s;
    break;
    case "string":
      seed = parseInt(s);
    break;
    default:
      throw "Bad seed";
    break;
  }
  seed &= 0x7FFFFFFF; // pretty sure this doesn't make a difference

  this.state[0] = seed;
  for (var i = 1; i < 624; ++i)
    this.state[i] = 0xFFFF & (0x6C078965 * (this.state[i - 1] ^ (this.state[i - 1] >> 30)) + i);
  return seed;
};

MT.prototype.generate = function()
{
  for (var i = 0; i < 624; ++i)
  {
    var j = (this.state[i] & 0x80000000) + (this.state[(i + 1) % 624] & 0x7FFFFFFF);
    this.state[i] = this.state[(i + 397) % 624] ^ (j >> 1);
    if (j % 2 !== 0)
      this.state[i] = this.state[i] ^ 0x9908B0DF;
  }
};

// 32 bit int
MT.prototype.rand = function()
{
  if (this.index === 0)
    this.generate();

  var y = this.state[this.index];

  y ^= (y >> 11);
  y ^= (y << 7 ) & 0x9D2C5680;
  y ^= (y << 15) & 0xEFC60000;
  y ^= (y >> 28);

  this.index++;
  if (this.index == 624)
    this.index = 0;
  return y;
};

// 31 bit int
MT.prototype.rand31 = function()
{
  return this.rand() >>> 1;
};

// 0..0.99..
MT.prototype.random = function()
{
  return this.rand() / MT.RAND_MAX;
};

// 0..1
MT.prototype.randomOne = function()
{
  return this.rand() / (MT.RAND_MAX - 1);
}

// min..max float
MT.prototype.randomRange = function(min, max)
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
MT.prototype.randRange = function(min, max)
{
  return Math.floor(this.randomRange(min, max + 1));
}
