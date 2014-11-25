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

  // how big each tile is
  PIXEL_SIZE: 32,

  RPANE: 300,
  CPANE: 120,

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

  PLUS: 187, // zoom
  MINUS: 189,
  NUM_PLUS: 107,
  NUM_MINUS: 109
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
    document.getElementById('loadingTitle').textContent = "Retreiving game data";
    document.getElementById('loadingDetail').textContent = Commify(JP.Data.filesRec) + " of " + Commify(JP.Data.filesReq) + " received";
    document.getElementById('loadingExtra').textContent = 'Please Wait';
    return;
  }

  var prog = JP.world.Load();
  if (prog !== false && prog !== true) // I know this looks weird, but prog being false means no world loaded
  {
    document.getElementById('loadingTitle').textContent = "Loading world data";
    document.getElementById('loadingDetail').textContent = (prog * 100).toFixed(0) + '%';
    return;
  }
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
    document.getElementById('loading').style.display = "none";
    JP.player.Load();
    JP.world.Prerender();
    clearInterval(JP.intervalID);
    JP.intervalID = setInterval(function() {JP.Idle();}, 20);
  }
}

JP.Idle = function()
{
  JP.getTickCount(true); // update the tickcount
  JP.KeyProcessing();
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
  JP.context = JP.canvas.getContext("2d");
  JP.tcontext = JP.tcanvas.getContext("2d");

  document.getElementById('fpsCounter').textContent = (1000 / JP.getFPS()).toFixed(0) + " fps";

  if (JP.needDraw === false)
    return;

  JP.world.Draw();

  JP.needDraw = false;
};

JP.ProcessMouse = function(event)
{
  JP.MouseState.x = event.clientX || JP.MouseState.x;
  JP.MouseState.y = event.clientY || JP.MouseState.y;
  if (JP.MouseState.x < JP.canvas.width)
  {
    JP.MouseState.vx = JP.MouseState.x; // special one for view
    JP.MouseState.vy = JP.MouseState.y;
  }
  JP.MouseState.button = (event.type === "mousedown" ? event.button : -1); // LM: 0, MM: 1, RM: 2
  JP.needDraw = true;
  return false;
};

JP.KeyMap = {};
JP.ProcessKey = function(evt)
{
  evt = evt || event;
  var keyCode = (evt.which !== undefined || evt.which !== null) ? evt.which : evt.keyCode;

  JP.KeyMap[keyCode] = (JP.KeyMap[keyCode] !== null ? evt.type === 'keydown' : evt.type === 'keyup' ? false : null);
};

JP.KeyProcessing = function(key)
{
  var keys = Object.keys(JP.KeyMap);
  for (var i = keys.length - 1; i >= 0; i--)
  {
    var key = JP.KeyMap[keys[i]] === true ? parseInt(keys[i]) : -1;
    switch (key)
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
          JP.KeyMap[JP.Keys.C] = null;
      break;
      case JP.Keys.T:
        JP.player.Talk();
          JP.KeyMap[JP.Keys.T] = null;
      break;
      case JP.Keys.F:
        JP.player.Fire();
          JP.KeyMap[JP.Keys.F] = null;
      break;

      // map scaling
      case JP.Keys.PLUS:
      case JP.Keys.NUM_PLUS:
        if (JP.world.generationLevel === JP.World.Gen.DONE)
        {
          JP.PIXEL_SIZE = Math.min(64, JP.PIXEL_SIZE + 8);
          JP.world.Prerender();
          JP.KeyMap[JP.Keys.PLUS] = null;
          JP.KeyMap[JP.Keys.NUM_PLUS] = null;
          JP.needDraw = true;
        }
      break;
      case JP.Keys.MINUS:
      case JP.Keys.NUM_MINUS:
        if (JP.world.generationLevel === JP.World.Gen.DONE)
        {
          JP.PIXEL_SIZE = Math.max(8 , JP.PIXEL_SIZE - 8);
          JP.world.Prerender();
          JP.KeyMap[JP.Keys.MINUS] = null;
          JP.KeyMap[JP.Keys.NUM_MINUS] = null;
          JP.needDraw = true;
        }
      break;
    }
  }
  return false;
};

JP.SetResolution = function()
{
  JP.canvas.width  = document.documentElement.clientWidth - JP.RPANE;
  JP.tcanvas.width  = document.documentElement.clientWidth - JP.RPANE;
  JP.canvas.height = document.documentElement.clientHeight - JP.CPANE;
  JP.tcanvas.height = document.documentElement.clientHeight - JP.CPANE;
  if (JP.world !== null && JP.world.generationLevel === JP.World.Gen.DONE)
    JP.world.Prerender();
  JP.needDraw = true;
};
window.onresize = JP.SetResolution;


function newWorld()
{
  JP.Delete();

  loadWorld();
}

function loadWorld()
{
  if (JP.world !== null)
    return; // don't do this twice

  JP.USE_ARCADE_CONTROLS = document.getElementById("useArcade").checked;

  JP.SetResolution();
  // remove the splash screen
  document.getElementById("splash").style.display = "none";
  document.getElementById('loading').style.display = "";

  // create the world
  JP.world = new JP.World();
  // load player data
  JP.player = new JP.Player();

  JP.Logger.logNode = document.getElementById('eventLog');
  JP.canvas.focus();

  clearInterval(JP.intervalID);
  JP.intervalID = setInterval(function() {JP.Initialize();}, 5);
};

JP.Delete = function()
{
  JP.world = JP.world || new JP.World();
  JP.player = JP.player || new JP.Player();

  JP.world.Delete();
  JP.player.Delete();

  JP.world = null;
  JP.player = null;

  // just for the buttons
  pageLoad();
};

function pageLoad()
{
  // setup the canvas
  JP.canvas = document.getElementById('canvas');
  JP.context = JP.canvas.getContext("2d");
  JP.tcanvas = document.getElementById('tcanvas');
  JP.tcontext = JP.tcanvas.getContext("2d");
  JP.SetResolution();

  if (localStorage.getItem("JP.World.Saved") === null)
  {
    document.getElementById('loadWorld').disabled   = true;
    document.getElementById('deleteWorld').disabled = true;
    document.getElementById('newWorld').disabled    = false;
  }
  else
  {
    document.getElementById('loadWorld').disabled   = false;
    document.getElementById('deleteWorld').disabled = false;
    document.getElementById('newWorld').disabled    = true;
  }

  JP.canvas.onkeydown   = function(event) {JP.ProcessKey(event); };
  JP.canvas.onkeyup     = function(event) {JP.ProcessKey(event); };
  JP.canvas.onmousemove = function(event) {JP.ProcessMouse(event); };
  JP.canvas.onmousedown = function(event) {JP.ProcessMouse(event); };

/*  JP.guimgr = new JP.GUI.Manager();
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
  */
};
