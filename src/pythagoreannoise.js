/*

new noise plan

Create multiple graphs using a function, then stack these together

*/

function Noise()
{
  //this.freqMod = randRange(0.5, 2.0);
  this.freqModX = 1.5 * Math.random() + 0.5;
  this.freqModY = 1.5 * Math.random() + 0.5;
  //this.ampMod = randRange(0.5, 2.0);
  this.ampModX = 1.5 * Math.random() + 0.5;
  this.ampModY = 1.5 * Math.random() + 0.5;

  this.levels = 2 + Math.floor(3 * Math.random());
}

Noise.prototype.Value = function(x, y)
{
  x *= Math.PI / 180;
  y *= Math.PI / 180;

  var ret = 0.0;
  for (var i = 1; i <= this.levels; i++)
    ret += (this.ampModX * i) * Math.sin((this.freqModX * (1 / i)) * x) + (this.ampModY * i) * Math.cos((this.freqModY * (1 / i)) * y);
  return ret;
};