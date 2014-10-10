/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Gaussian = JP.Gaussian || {};

JP.Gaussian.filters = {};

JP.Gaussian.getFilter = function(kSize)
{
  kSize = (kSize << 1) + 1; // gotter be odd
  // createFilter is slow, cache it for use later
  if (JP.Gaussian.filters[kSize] === undefined)
    JP.Gaussian.filters[kSize] = JP.Gaussian.createFilter(kSize);
  return JP.Gaussian.filters[kSize];
}

JP.Gaussian.createFilter = function(kSize)
{
  kSize = kSize || 5;
  // set std dev to 1.0
  var sigma = 1.0;
  var r = 0;
  var s = 2.0 * sigma * sigma;
  var sum = 0; // normalization

  var max = 0.0;
  var gKernal = new Array(kSize);

  for (var i = 0; i < gKernal.length; ++i)
    gKernal[i] = new Array(kSize);

  for (var x = -(kSize >> 1); x <= (kSize >> 1); ++x)
  {
    for (var y = -(kSize >> 1); y <= (kSize >> 1); ++y)
    {
      r = Math.sqrt(x*x + y*y);
      gKernal[x + (kSize >> 1)][y + (kSize >> 1)] = (Math.exp(-(r*r)/s))/(Math.PI * s);
      sum += gKernal[x + (kSize >> 1)][y + (kSize >> 1)]
      if (gKernal[x + (kSize >> 1)][y + (kSize >> 1)] > max)
        max = gKernal[x + (kSize >> 1)][y + (kSize >> 1)]
    }
  }

  // normalize!
  for (var i = 0; i < kSize; ++i)
  {
    for (var j = 0; j < kSize; ++j)
      gKernal[i][j] /= sum;
  }
  return gKernal;
}

function testFilter(size)
{
  var filter = JP.Gaussian.getFilter(size);
  for (var i = 0; i < filter.length; ++i)
  {
    var log = "";
    for (var j = 0; j < filter[i].length; ++j)
      log += filter[i][j] + "  ";
    console.log(log);
  }
}
