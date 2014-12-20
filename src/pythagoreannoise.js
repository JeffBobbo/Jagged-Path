/*

  pythagoreannoise.js

  custom lib designed for creating reasonably coherent noise.

  inspired by perlin/fractal noise and my recent maths lectures on calculus


  todo: change this so that each layer has it's own frequency and offset, and then stack those together

*/

function Noise(levels, freqXMin, freqXMax, freqYMin, freqYMax, offXMin, offXMax, offYMin, offYMax)
{
  this.levels = [];
  for (i = 0; i < (levels || 3); ++i)
    this.levels.push(new Noise.Level(i, randRange(freqXMin, freqXMax) / (i+1), randRange(freqYMin, freqYMax) / (i+1) , randRange(offXMin, offXMax) * (i+1), randRange(offYMin, offYMax) * (i+1)));
}

Noise.Level = function(i, freqX, freqY, offX, offY)
{
  this.freqX = freqX || 1;
  this.freqY = freqY || 1;
  this.offX  = offX  || 0;
  this.offY  = offY  || 0;
  this.pow   = 2;
}


Noise.prototype.Wave = function(i)
{
  if (i % 2 === 0)
    return Math.sin;
  return Math.cos;
}

Noise.prototype.Value = function(x, y)
{
  x *= Math.PI / 180;
  y *= Math.PI / 180;

  var ret = 0.0;
  for (var i = 1; i <= this.levels.length; ++i)
  {
    var level = this.levels[i-1];
    ret += i * this.Wave(i)(level.offX + level.freqX * x) + i * this.Wave(i)(level.offY + level.freqY * y);
  }
  return ret;
};

Noise.Test = function()
{
  size = size || 3;
  var pn = new Noise(fx, fy, levels);

  str = "";
  for (var x = 0; x < size; ++x)
  {
    for (var y = 0; y < size; ++y)
    {  
      str += (pn.Value(x, y))   + " "
    }
    str += "\n";
  }
  console.log(str);
}