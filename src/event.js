/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.GUI = JP.GUI || {};

JP.GUI.Event = function()
{
  this.MouseState = {x: -1, y: -1, button: -1};
  this.KeyState = []; // ?
}

JP.GUI.Manager = function()
{
  this.windowList = [];
}

JP.GUI.Manager.prototype.OnEvent = function(event)
{
  for (var i = this.windowList.length - 1; i >= 0; i--)
    this.windowList[i].OnEvent(event);
};

JP.GUI.Manager.prototype.Draw = function()
{
  for (var i = this.windowList.length - 1; i >= 0; i--)
  {
    const win = this.windowList[i];

    if (win.visible === false)
      continue;

    win.Draw();
  };
};

JP.GUI.Manager.prototype.CreateWindow = function()
{
  var win = new JP.GUI.Window();
  this.windowList.push(win);
  return this.windowList.length-1;
};

JP.GUI.Window = function()
{
  this.enabled = true;
  this.visible = false;
  this.childList = [];
}

JP.GUI.Window.prototype.Draw = function()
{
  for (var i = this.childList.length - 1; i >= 0; i--)
  {
    const elem = this.childList[i];

    if (elem.visible === false)
      continue;

    elem.Draw();
  };
};
JP.GUI.Window.prototype.OnEvent = function(event)
{
  if ((this.enabled | this.visible) === false)
    return;

  for (var i = this.childList.length - 1; i >= 0; i--)
    this.childList[i].OnEvent(event);
};

JP.GUI.Element = function()
{
  this.title = "";
  this.posx = -1;
  this.posy = -1;
  this.width  = -1;
  this.height = -1;

  this.enabled = true;
  this.visible = null;
  this.eventCallbacks = {}; // type, function()
}

JP.GUI.Element.prototype.Draw = function()
{
  JP.context.fillStyle = "#AAAAAA";
  JP.context.fillRect(this.x, this.y, this.w, this.h);
  JP.context.fillStyle = "#FF0000";
  JP.context.font = '12pt Courier New';
  JP.context.fillText(this.title, this.x+4, this.y+4);
}

JP.GUI.Element.prototype.OnEvent = function(event)
{
  if (event.type === "mouse")
  {
    if (InRange(this.posx, this.posx+this.width,  event.MouseState.x) === false && InRange(this.posy, this.posy+this.height, event.MouseState.y) === false)
    {
      if (this.eventCallbacks[JP.CallbackType.MOUSEOUT] !== undefined)
        this.eventCallbacks[JP.CallbackType.MOUSEOUT]();
    }
    else if (event.MouseState.button === -1)
    {
      if (this.eventCallbacks[JP.CallbackType.MOUSEIN] !== undefined)
        this.eventCallbacks[JP.CallbackType.MOUSEIN]();
    }
    else
    {
      if (this.eventCallbacks[event.MouseState.button] !== undefined)
        this.eventCallbacks[event.MouseState.button]();
    }
  }
};

JP.GUI.Element.prototype.RegisterEvent = function(event, callback)
{
  this.eventCallbacks.event = callback;
};

JP.GUI.Element.prototype.DeregisterEvent = function(event)
{
  delete this.eventCallbacks.event;
};

JP.GUI.Window.prototype.CreateElement = function(title, x, y, w, h, callbacks)
{
  var btn = new JP.GUI.Element();
  btn.title = title;
  btn.posx = x;
  btn.posy = y;
  btn.width = w;
  btn.height = h;

  var keys = Object.keys(callbacks);
  for (var i = 0; i < keys.length; ++i)
    btn.RegisterEvent(keys[i], callbacks[keys[i]]);
  this.childList.push(btn);
  return this.childList.length-1;
};