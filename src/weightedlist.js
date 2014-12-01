/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.WeightedList = function()
{
  this.data = [];
};

JP.WeightedList.prototype.Size = function()
{
  return this.data.length;
};

JP.WeightedList.prototype.At = function(index)
{
  return this.data[index].data || null;
};

JP.WeightedList.prototype.Empty = function()
{
  return this.Size() === 0;
};

JP.WeightedList.prototype.Insert = function(data, weight)
{
  if (weight === 0.0)
    weight = 1.0;
  this.data.push({data: data, weight:weight});
};

JP.WeightedList.prototype.TotalWeight = function()
{
  var ret = 0.0;
  for (var i = this.data.length - 1; i >= 0; i--)
    ret += this.data[i].weight;
  return ret;
};

JP.WeightedList.prototype.ChooseRandom = function()
{
  var totalWeight = this.TotalWeight();

  var choice = randRange(0, 1) * totalWeight;

  for (var i = this.data.length - 1; i >= 0; i--)
  {
    choice -= this.data[i].weight;
    if (choice <= 0.0)
      return this.data[i].data;
  };
  return null;
}
