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

JP.GUI.prototype.OnEvent = function(event)
{
  for (var i = this.windowList.length - 1; i >= 0; i--)
    this.windowList[i].OnEvent(event);
};

JP.GUI.Window = function()
{
  this.enabled = true;
  this.visible = false;
  this.childList = [];
}

JP.GUI.Window.prototype.OnEvent = function(event)
{
  if ((this.enabled | this.visible) === false)
    return;

  for (var i = this.childList.length - 1; i >= 0; i--)
    this.childList[i].OnEvent(event);
};

JP.GUI.CallbackType = {
  MOUSE1:   0, // LM
  MOUSE2:   1, // RM
  MOUSE3:   2, // MM
  MOUSEIN:  3, // inside the elem
  MOUSEOUT: 4  // outside the elem
};

JP.GUI.Element = function()
{
  this.posx = -1;
  this.posy = -1;
  this.width  = -1;
  this.height = -1;

  this.enabled = true;
  this.visible = false;
  this.eventCallbacks = {}; // type, function()
}

JP.GUI.Element.prototype.OnEvent = function(event)
{
  if (event.type === "mouse")
  {
    if (InRange(this.posx, this.posx+this.width,  event.MouseState.x) === false && InRange(this.posy, this.posy+this.height, event.MouseState.y) === false)
    {
      if (this.eventCallbacks[MOUSEOUT] !== undefined)
        this.eventCallbacks[MOUSEOUT]();
    }
    else if (event.MouseState.button === -1)
    {
      if (this.eventCallbacks[MOUSEIN] !== undefined)
        this.eventCallbacks[MOUSEIN]();
    }
    else
    {
      if (this.eventCallbacks[])
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