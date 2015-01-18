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


// functions for the front end
JP.Option.Open = function()
{
  JP.Option.LoadOptions();
  document.getElementById('options').style.display = '';
  document.getElementById('splash').style.display = 'none';
};

JP.Option.Close = function()
{
  JP.Option.SaveOptions(); // get the data and save

  // then close
  document.getElementById('options').style.display = 'none';
  if (JP.world === null) // reshow the splash if we haven't started the game yet
    document.getElementById('splash').style.display = '';
};

JP.Option.SaveOptions = function()
{
  var controlOpt = document.getElementById('controlStyle').getElementsByTagName('input');
  for (var i = controlOpt.length - 1; i >= 0; i--)
  {
    if (controlOpt[i].checked === true)
    {
      JP.Option.Set('controlStyle', JP.Option.ControlStyle[controlOpt[i].value]);
      break;
    }
  }
};

JP.Option.LoadOptions = function()
{
  var controlOpt = document.getElementById('controlStyle').getElementsByTagName('input');
  var setting = JP.Option.Get('controlStyle');
  for (var i = controlOpt.length - 1; i >= 0; i--)
  {
    if (JP.Option.ControlStyle[controlOpt[i].value] === setting)
      controlOpt[i].checked = true;
    else
      controlOpt[i].checked = false;
  }
};
