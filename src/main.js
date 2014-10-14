/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

"use strict";

var JP = JP || {
  canvas: null,
  context: null,
  world: null,
  // how big is our world in tiles
  WIDTH:  920,
  HEIGHT: 480,

  ratio: 16/9, // for display
  // ui-side pane height
  ui_width: -1,
  ui_height: -1,

  needDraw: false,
};

// controls
JP.Keys = JP.Keys || {
  A: 65,
  W: 87,
  D: 68,
  S: 83,
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,

  C: 67, // chop wood
  T: 84, // talk
  F: 70, // fire
};

JP.MouseState = JP.MouseState || {
  x: -1,
  y: -1,
  button: -1,
};

JP.Generate = function()
{
  if (JP.world.generationLevel < JP.World.Gen.DONE)
  {
    JP.world.GenerationTasks();
    return; 
  }
  else
  {
    clearInterval(JP.intervalID);
    setInterval(JP.Idle, 20);    
  }
}

JP.Idle = function()
{
  JP.getTickCount(true); // update the tickcount
  //JP.player.Idle();
  for (var i = 0; i < JP.world.entities.length; ++i)
  {
    if (JP.world.entities[i].Idle() === false) // entity removed during idle, so deal with it properly
    {
      i--;
      continue;
    }
    JP.world.entities[i].Move();
  }
  JP.Draw();

  JP.Save();
};

JP.Save = function()
{
  var interval = 5000; // ms
  if (JP.Save.next === undefined)
    JP.Save.next = JP.getTickCount() + interval;

  if (JP.Save.next < JP.getTickCount())
  {
    JP.player.Save();
    JP.world.Save(); // also saves entities
    JP.Save.next = JP.getTickCount() + interval;
  }
}

JP.Draw = function()
{
  if (JP.needDraw === false)
    return;

  JP.context = JP.canvas.getContext("2d");
  JP.world.Draw();

  // draw ui stuff
  // clear this bit
  //JP.context.clearRect(JP.canvas.width - JP.ui_width, 0, JP.canvas.width, JP.canvas.height);
  JP.context.fillStyle = "#000000";
  JP.context.fillRect(JP.canvas.width - JP.ui_width, 0, JP.canvas.width, JP.canvas.height);

  JP.Logger.Draw();
  var w = JP.canvas.width - JP.ui_width + 8;
  var h = (JP.ui_height >> 1) + 8;
  // inventory
  JP.context.font = '14pt Courier New';
  JP.context.fillText(SIfy(JP.player.gold) + " Gold Coins", w, h);
  h += 24;
  JP.context.fillText("Inventory", w, h);
  
  JP.context.font = '12pt Courier New';
  h += 4;

  var i = JP.player.inventory.length - 1;
  while (i >= 0 && (h += 16) < JP.ui_height) // figure out something if this is longer than can be shown
    JP.context.fillText(JP.player.inventory[i].quant + "x " + JP.player.inventory[i--].name, w, h);

  //JP.player.Draw(); // this draws the players inventory
  JP.needDraw = false;
}

JP.ProcessMouse = function(event)
{
  JP.MouseState.x = event.clientX || JP.MouseState.x; // - (document.documentElement.clientWidth - JP.canvas.width) / 2;
  JP.MouseState.y = event.clientY || JP.MouseState.y; // - (document.documentElement.clientHeight - JP.canvas.height) / 2;
  if (JP.MouseState.x < JP.canvas.width - JP.ui_width)
  {
    JP.MouseState.vx = JP.MouseState.x; // special one for view
    JP.MouseState.vy = JP.MouseState.y;
  }
  JP.MouseState.button = (event.type === "mousedown" ? event.button : -1); // LM: 0, MM: 1, RM: 2
  var evt = (new JP.GUI.Event()).merge(JP.MouseState);
  evt.type = "mouse";
  JP.guimgr.OnEvent(evt);
  JP.needDraw = true;
  return false;
};

JP.ProcessKey = function(event)
{
  var keyCode = (event.which !== undefined || event.which !== null) ? event.which : event.keyCode;
  switch (keyCode)
  {
    //movement
    case JP.Keys.LEFT:
    case JP.Keys.A:
      JP.player.Move(JP.Keys.A); // move left
    break;

    case JP.Keys.UP:
    case JP.Keys.W:
      JP.player.Move(JP.Keys.W); // move up
    break;

    case JP.Keys.RIGHT:
    case JP.Keys.D:
      JP.player.Move(JP.Keys.D); // move right
    break;
    case JP.Keys.DOWN:
    case JP.Keys.S:
      JP.player.Move(JP.Keys.S); // move down
    break;

    //actions
    case JP.Keys.C:
      JP.player.ChopTree();
    break;
    case JP.Keys.T:
      JP.player.Talk();
    break;
    case JP.Keys.F:
      JP.player.Fire();
    break;
    default:
      console.log(keyCode);
    break;
  }
  return false;
};

JP.SetResolution = function()
{
  var w = document.documentElement.clientWidth - JP.PIXEL_SIZE*2;
  var h = document.documentElement.clientHeight - JP.PIXEL_SIZE*2;
  if (h > w)
  {
    JP.canvas.width  = TruncateTo(w, JP.PIXEL_SIZE);
    JP.canvas.height = TruncateTo(w / JP.ratio, JP.PIXEL_SIZE);
  }
  else
  {
    JP.canvas.width  = TruncateTo(h * JP.ratio, JP.PIXEL_SIZE);
    JP.canvas.height = TruncateTo(h, JP.PIXEL_SIZE);
  }
  JP.ui_height = JP.canvas.height;
  JP.ui_width  = TruncateTo(JP.canvas.width * (1 / 4), JP.PIXEL_SIZE);
  JP.needDraw = true;
};
window.onresize = JP.SetResolution;

function start()
{
  var element = document.getElementById("start");
  element.parentNode.removeChild(element);
  
  JP.guimgr = new JP.GUI.Manager();

  // create the world
  JP.world = new JP.World();
  JP.world.Load();

  // load player data
  JP.player = new JP.Player();
  JP.player.Load();

  JP.Logger.logNode = document.getElementById('eventLog');
  JP.canvas.focus();

  JP.intervalID = setInterval(JP.Generate, 5);
}

function pageLoad()
{
  // setup the canvas
  JP.canvas = document.getElementById('canvas');
  JP.context = JP.canvas.getContext("2d");
  JP.SetResolution();
}
