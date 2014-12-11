/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Option = JP.Option || {};

JP.Option.ControlStyle = {
  FPS: 0,
  ARCADE: 1,
  ASTEROID: 2
};

// create option object with defaults
JP.Option.options = {
  "controlStyle": JP.Option.ControlStyle.FPS,
  "zoomLevel": 32
};

JP.Option.Get = function(key)
{
  return JP.Option.options[key] | null;
};

JP.Option.Set = function(key, value)
{
  if (JP.Option.options[key] === undefined)
    return;

  JP.Option.options[key] = value;
  JP.Option.Save();
};

JP.Option.Save = function()
{
  localStorage.setItem("JP.Option", JSON.stringify(JP.Option.options));
};

JP.Option.Load = function()
{
  var o = localStorage.getItem("JP.Option");
  if (o === undefined || o === null)
    return;
  JP.Option.options.merge(JSON.parse(o));
};
