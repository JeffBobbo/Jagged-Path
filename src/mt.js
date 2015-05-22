MT = function(s)
{
  this.stateSize = 624;
  this.state = new Array(MT.stateSize);
  this.index = 0;

  this.seed(s);
}

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
    default:
      seed = (new Date()).getTime();
    break;
  }

  this.state[0] = seed;
  for (var i = 1; i < this.stateSize; ++i)
    this.state[i] = 0xFFFF & (0x6C078965 * (this.state[i - 1] ^ (this.state[i - 1] >> 30)) + i);
}

MT.prototype.generate = function()
{
  for (var i = 0; i < this.stateSize; ++i)
  {
    var j = (this.state[i] & 0x80000000) + (this.state[(i + 1) % this.stateSize] & 0x7FFFFFFF);
    this.state[i] = this.state[(i + 397) % this.stateSize] ^ (j >> 1);
    if (j % 2 !== 0)
      this.state[i] = this.state[i] ^ 0x9908B0DF;
  }
}

MT.prototype.extract = function()
{
  if (this.index === 0)
    this.generate();

  var y = this.state[this.index];

  y ^= (y >> 11);
  y ^= (y << 7 ) & 0x9D2C5680;
  y ^= (y << 15) & 0xEFC60000;
  y ^= (y >> 28);

  this.index++;
  if (this.index == this.stateSize)
    this.index = 0;
  return y;
}