/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

"use strict";

var JP = JP || {
  gameview: null,
  gamecontext: null,
  world: null,
  // how big is our world in tiles
  WIDTH:  920,
  HEIGHT: 480,

  // how big each tile is
  PIXEL_SIZE: 32,

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

JP.CallbackType = {
  MOUSE1:   0, // LM
  MOUSE2:   1, // RM
  MOUSE3:   2, // MM
  MOUSEIN:  3, // inside the elem
  MOUSEOUT: 4  // outside the elem
};

JP.Initialize = function()
{
  if (JP.Data.filesReq === 0)
    JP.Data.Load(); // start the load process

  if (JP.Data.filesReq > JP.Data.filesRec)
  {
    JP.guicontext.clearRect(0, 0, JP.guiview.width, JP.guiview.height);
    var x = JP.guiview.width  / 2;
    var y = JP.guiview.height / 2;

    JP.guicontext.font = '30pt Courier New';
    JP.guicontext.textAlign = 'center';
    JP.guicontext.fillStyle = '#ffa500';
    JP.guicontext.fillText("Retreiving game data", x, y-50);
    JP.guicontext.fillText(Commify(JP.Data.filesRec) + " of " + Commify(JP.Data.filesReq) + " received", x, y);
    JP.guicontext.fillText('Please Wait', x, y+70);
    return;
  }

  var prog = JP.world.Load();
  if (prog !== false && prog !== true) // I know this looks weird, but prog being false means no world loaded
  {
    JP.guicontext.clearRect(0, 0, JP.guiview.width, JP.guiview.height);
    var x = JP.guiview.width  / 2;
    var y = JP.guiview.height / 2;

    JP.guicontext.font = '30pt Courier New';
    JP.guicontext.textAlign = 'center';
    JP.guicontext.fillStyle = '#ffa500';
    JP.guicontext.fillText("Loading world data", x, y-50);
    JP.guicontext.fillText((prog * 100).toFixed(0) + '%', x, y);
    JP.guicontext.fillText('Please Wait', x, y+70);
    return;
  }
  JP.player.Load();
  clearInterval(JP.intervalID);
  JP.intervalID = setInterval(function() {JP.Generate();}, 5);
}

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
    JP.intervalID = setInterval(function() {JP.Idle();}, 20);
  }
}

JP.Idle = function()
{
  JP.getTickCount(true); // update the tickcount
  //JP.player.Idle();
  for (var i = JP.world.entities.length - 1; i >= 0; i--)
  {
    JP.world.entities[i].Idle();
    JP.world.entities[i].Move();
  }
  JP.Draw();

  // remove any seppuku'd entities
  for (var i = JP.world.entities.length - 1; i >= 0; i--)
  {
    if (JP.world.entities[i].seppuku === true)
      JP.world.entities.splice(i, 1);
  };

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
};

JP.Draw = function()
{
  JP.gamecontext = JP.gameview.getContext("2d");
  JP.guicontext = JP.guiview.getContext("2d");

  // draw ui stuff
  // clear this bit
  JP.guicontext.clearRect(0, 0, JP.guiview.width, JP.guiview.height);
  JP.guicontext.fillStyle = "#000000";
  JP.guicontext.fillRect(JP.guiview.width - JP.ui_width, 0, JP.guiview.width, JP.guiview.height);

  JP.guicontext.fillStyle = "#FFFFFF";
  JP.Logger.Draw();
  var w = JP.guiview.width - JP.ui_width + 8;
  var h = (JP.ui_height >> 1) + 8;
  // inventory
  JP.guicontext.font = '10pt Courier New';
  JP.guicontext.fillText(SIfy(JP.player.gold) + " Gold Coins", w, h);
  h += 24;
  JP.guicontext.fillText("Inventory", w, h);

  JP.guicontext.font = '8pt Courier New';
  h += 4;

  var keys = Object.keys(JP.player.inventory);
  var i = keys.length - 1;
  while (i >= 0 && (h += 16) < JP.ui_height) // can we see it?
    JP.guicontext.fillText(JP.player.inventory[keys[i]] + "x " + keys[i--], w, h);
  var fps = (1000 / JP.getTickDelta()).toFixed(0) + "fps";
  JP.guicontext.font = "10pt Courier New";
  JP.guicontext.fillText(fps, JP.guiview.width - JP.ui_width + 10, JP.guiview.height - 24)

  if (JP.needDraw === false)
    return;

  JP.world.Draw();

  //JP.player.Draw(); // this draws the players inventory
  JP.guimgr.Draw();
  JP.needDraw = false;
};

JP.ProcessMouse = function(event)
{
  JP.MouseState.x = event.clientX || JP.MouseState.x; // - (document.documentElement.clientWidth - JP.gameview.width) / 2;
  JP.MouseState.y = event.clientY || JP.MouseState.y; // - (document.documentElement.clientHeight - JP.gameview.height) / 2;
  if (JP.MouseState.x < JP.gameview.width - JP.ui_width)
  {
    JP.MouseState.vx = JP.MouseState.x; // special one for view
    JP.MouseState.vy = JP.MouseState.y;
  }
  JP.MouseState.button = (event.type === "mousedown" ? event.button : -1); // LM: 0, MM: 1, RM: 2
  var evt = new JP.GUI.Event();
  evt.MouseState = JP.MouseState;
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
  JP.gameview.width  = document.documentElement.clientWidth;
  JP.gameview.height = document.documentElement.clientHeight;
  JP.guiview.width  = JP.gameview.width;
  JP.guiview.height = JP.gameview.height;
  JP.ui_height = JP.guiview.height;
  JP.ui_width = TruncateTo(JP.guiview.width * (1 / 4), JP.PIXEL_SIZE);
  JP.needDraw = true;
};
window.onresize = JP.SetResolution;

function start()
{
  if (JP.world !== null)
    return; // don't do this twice

  JP.SetResolution();
  // remove the splash screen
  JP.guimgr.RemoveWindow(JP.splash);

  // create the world
  JP.world = new JP.World();
  // load player data
  JP.player = new JP.Player();

  JP.Logger.logNode = document.getElementById('eventLog');
  JP.gameview.focus();

  clearInterval(JP.intervalID);
  JP.intervalID = setInterval(function() {JP.Initialize();}, 5);
};

JP.Delete = function()
{
  JP.world = JP.world || new JP.World();
  JP.player = JP.player || new JP.Player();

  JP.world.Delete();
  JP.player.Delete();
};

function pageLoad()
{
  // setup the gameview
  JP.gameview = document.getElementById('gameview');
  JP.gamecontext = JP.gameview.getContext("2d");
  JP.guiview = document.getElementById('guiview');
  JP.guicontext = JP.guiview.getContext("2d");

  JP.guiview.onkeydown   = function() {JP.ProcessKey(event); };
  JP.guiview.onmousemove = function() {JP.ProcessMouse(event); };
  JP.guiview.onmousedown = function() {JP.ProcessMouse(event); };

  JP.guimgr = new JP.GUI.Manager();
  JP.splash = JP.guimgr.CreateWindow();
  JP.guimgr.windowList[JP.splash].visible = true;
  var cb = {};
  cb[JP.CallbackType.MOUSE1] = start;
  var btn = JP.guimgr.windowList[JP.splash].CreateElement("Start", JP.guicontext.width * 0.4, JP.guicontext.height * 0.4, JP.guicontext.width * 0.2, JP.guicontext.height * 0.2, cb);
  JP.guimgr.windowList[JP.splash].childList[btn].SetFont("20px Courier New");
  JP.guimgr.windowList[JP.splash].childList[btn].RegisterEvent(JP.CallbackType.MOUSEIN, function() {JP.guimgr.windowList[JP.splash].childList[btn].SetFont("22px Courier New")});
  JP.guimgr.windowList[JP.splash].childList[btn].RegisterEvent(JP.CallbackType.MOUSEOUT, function() {JP.guimgr.windowList[JP.splash].childList[btn].SetFont("20px Courier New")});
  // draw the gui until we start
  JP.intervalID = setInterval(function() {JP.guimgr.Draw();}, 5);
};
