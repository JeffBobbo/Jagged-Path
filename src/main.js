/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

"use strict";

/**
 * Global game namesapce
 * @namespace JP
 */
var JP = JP || {
  /**
   * render target
   * @type {HTMLCanvas}
   * @memberOf JP
   */
  canvas: null,
  /**
   * render cache target
   * @type {HTMLCanvas}
   * @memberOf JP
   * @type {HTMLCanvas}
   */
  tcanvas: null,
  /**
   * render context
   * @type {HTMLCanvas}
   * @memberOf JP
   * @type {HTMLCanvas}
   */
  context: null,
  /**
   * render cache context
   * @type {HTMLCanvas}
   * @memberOf JP
   * @type {HTMLCanvas}
   */
  tcontext: null,

  world: null,
  player:null,

  // how big is our world in tiles
  WIDTH:  920,
  HEIGHT: 480,

  // tile size limits
  MIN_ZOOM_SIZE: 8,
  MAX_ZOOM_SIZE: 64,
  zoomLevel: 32, // default

  RPANE: 300,
  CPANE: 120,

  needDraw: false
};

var useDB = false;

/**
 * game state
 * @enum
*/
JP.STATE = {
  INIT: 0,
  GEN:  1,
  RUN:  2
};

var useDB = false;

/**
 * Pregame setup, retrieves content files and loads the world data if there's a one to load
 * @function
 */
JP.Initialize = function()
{
  if (JP.Data.filesReq === 0)
    JP.Data.Load(); // start the load process

  if (JP.Data.filesReq > JP.Data.filesRec)
  {
    document.getElementById('loadingTitle').textContent = "Retreiving game data";
    document.getElementById('loadingDetail').textContent = Commify(JP.Data.filesRec) + " of " + Commify(JP.Data.filesReq) + " files received";
    document.getElementById('loadingExtra').textContent = 'Please Wait';
    return;
  }
/*
  var prog = JP.world.Load();
  if (prog !== false && prog !== true) // I know this looks weird, but prog being false means no world loaded
  {
    document.getElementById('loadingTitle').textContent = "Loading world data";
    document.getElementById('loadingDetail').textContent = (prog * 100).toFixed(0) + '%';
    return;
  }
*/
  JP.gameState++;
};

/**
 * World generation, preperation and player loading
 * @function
 */
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
    // temp hack
    if (JP.world.terrain[Math.floor(JP.player.relx)][Math.floor(JP.player.rely)].spawnSafe === true)
      JP.world.entities.unshift(JP.Entity.Create("Lumberjack", Math.floor(JP.player.relx), Math.floor(JP.player.rely))); // place a woodsman with the player

    JP.world.Prerender();
    document.getElementById('eventLog').style.display = "";
    document.getElementById('playerUI').style.display = "";
    document.getElementById('inventory').style.display = "";
  }
  JP.gameState++;
};

/**
 * Main loop, queued by requestAnimationFrame, hands off to appropriate state functions.
 * @function
 */
JP.GameLoop = function()
{
  JP.getTickCount(true); // update the tickcount
  document.getElementById('fpsCounter').textContent = JP.getFPS().toFixed(0) + " fps";

  switch (JP.gameState)
  {
    case JP.STATE.INIT:
      JP.Initialize();
    break;
    case JP.STATE.GEN:
      JP.Generate();
    break;
    case JP.STATE.RUN:
      JP.Idle();
    break;
  }
  requestAnimationFrame(JP.GameLoop);
};

/**
 * Game loop. Checks for input, idles spawners and entities, renders, remove dead entities, save
 * @function
 */
JP.Idle = function()
{
  JP.KeyProcessing();
  //JP.player.Idle();
  //
  var target = Math.floor(1000 / 70); // 70 instead of 60 so there's time to do other things
  var start = getTime(); // using getTime instead JP.getTickCount due to FPS issues
  for (var i = JP.world.spawners.length - 1; i >= 0 && getTime() - start < target; --i)
    JP.world.spawners[i].Idle();
  for (var i = JP.world.entities.length - 1; i >= 0 && getTime() - start < target; --i)
  {
    JP.world.entities[i].Idle();
    JP.world.entities[i].Move();
  }
  JP.Draw();

  // remove any seppuku'd entities
  for (var i = JP.world.entities.length - 1; i >= 0; --i) // always do this in full
  {
    var ent = JP.world.entities[i]
    if (ent.seppuku === true)
    {
      JP.world.entities.splice(i, 1);

      if (ent.spawner !== null)
      {
        for (var j = ent.spawner.children.length - 1; j >= 0; j--)
        {
          if (ent.spawner.children[j] === ent.id)
            ent.spawner.children.splice(j, 1);
        };
      }
    }
  };
  JP.world.entities.sort(function(a, b) {
    return a.id - b.id;
  });
  JP.Save();
};

/**
 * Save player state every 5s
 * @function
 */
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

/**
 * Render the world, if required
 * @function
 */
JP.Draw = function()
{
  JP.context = JP.canvas.getContext("2d");
  JP.tcontext = JP.tcanvas.getContext("2d");


  if (JP.needDraw === false)
    return;

  if (JP.world !== null)
    JP.world.Draw();

  JP.needDraw = false;
};

/**
  @typedef MouseState
  @type {object}
  @property {number} x - x coordinate in view
  @property {number} x - y coordinate in view
  @property {number} button - button press
 */
/**
 * @type {MouseState}
 */
JP.MouseState = JP.MouseState || {
  x: -1,
  y: -1,
  button: -1
};

/**
 * Process mouse input event, pushing data into {@link JP.MouseState}
 * @function
 */
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

/**
  @typedef KeyMap
  @type {object}
  @property {number} keyCode - keyState
 */
/**
 * @type {KeyMap}
 */
JP.KeyMap = {};
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
  E: 69, // mine

  PLUS: 187, // zoom
  MINUS: 189,
  NUM_PLUS: 107,
  NUM_MINUS: 109
};

/**
 * Process key input event, pushing data into {@link JP.KeyMap}
 * @function
 */
JP.ProcessKey = function(evt)
{
  evt = evt || event;
  var keyCode = (evt.which !== undefined || evt.which !== null) ? evt.which : evt.keyCode;

  JP.KeyMap[keyCode] = (JP.KeyMap[keyCode] !== null ? evt.type === 'keydown' : evt.type === 'keyup' ? false : null);
};

/**
 * Does actions on keys in {@link JP.KeyMap}
 * @function
 * @retuns {Boolean} false
 */
JP.KeyProcessing = function()
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
      case JP.Keys.E:
        JP.player.Mine();
        JP.KeyMap[JP.Keys.E] = null;
      break;

      // map scaling
      case JP.Keys.PLUS:
      case JP.Keys.NUM_PLUS:
        if (JP.world.generationLevel === JP.World.Gen.DONE)
        {
          JP.zoomLevel = Math.min(JP.MAX_ZOOM_SIZE, JP.zoomLevel + 8);
          JP.Option.Set("zoomLevel", JP.zoomLevel);
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
          JP.zoomLevel = Math.max(JP.MIN_ZOOM_SIZE , JP.zoomLevel - 8);
          JP.Option.Set("zoomLevel", JP.zoomLevel);
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

/**
 * window.onresize function to set new game resolution, causes rerender to happen next frame
 * @function
 */
JP.SetResolution = function()
{
  if (JP.canvas === null)
  {
    JP.canvas = document.getElementById('canvas');
    JP.context = JP.canvas.getContext("2d");
  }
  if (JP.tcanvas === null)
  {
    JP.tcanvas = document.getElementById('tcanvas');
    JP.tcontext = JP.tcanvas.getContext("2d");
  }

  JP.canvas.width  = document.documentElement.clientWidth - JP.RPANE;
  JP.tcanvas.width  = document.documentElement.clientWidth - JP.RPANE;
  JP.canvas.height = document.documentElement.clientHeight - JP.CPANE;
  JP.tcanvas.height = document.documentElement.clientHeight - JP.CPANE;
  if (JP.world !== null && JP.world.generationLevel === JP.World.Gen.DONE)
    JP.world.Prerender();
  JP.needDraw = true;
};
window.onresize = JP.SetResolution;

/**
 * Called by 'New World' button at main menu. Deletes the world with no prompt and then passes off to {@link loadWorld}
 * @function
 */
function newWorld()
{
  JP.Delete();

  loadWorld();
};

/**
 * Called by 'Load World' button at main menu, otherwise shouldn't be called once it has already been called once
 * @function
 */
function loadWorld()
{
  if (JP.world !== null)
    return; // don't do this twice

  JP.gameState = JP.STATE.INIT;

  JP.zoomLevel = JP.Option.Get("zoomLevel");

  JP.SetResolution();
  // remove the splash screen
  document.getElementById("splash").style.display = "none";
  document.getElementById('loading').style.display = "";

  // show FPS counter
  document.getElementById('fpsCounter').style.display = "";


  // create the world
  JP.world = new JP.World();
  // load player data
  JP.player = new JP.Player();

  JP.Logger.logNode = document.getElementById('eventLog');
  JP.canvas.focus();

  requestAnimationFrame(JP.GameLoop);
};

/**
 * Deletes the world and player save, then calls {@link pageLoad}. No confirmation
 * @function
 */
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

/**
 * Called on page load, load options, sets up the canvases and event handlers as well as main menu buttons
 * @function
 */
function pageLoad()
{
  JP.Option.Load();
  // setup the canvas
  JP.SetResolution(); // this handles the JP.t?canvas references

  if (localStorage.getItem("JP.Saved") === null)
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

  document.onkeydown   = function(event) {JP.ProcessKey(event); };
  document.onkeyup     = function(event) {JP.ProcessKey(event); };
  JP.canvas.onmousemove = function(event) {JP.ProcessMouse(event); };
  JP.canvas.onmousedown = function(event) {JP.ProcessMouse(event); };
};

/**
 * Quick function for controlling the tabbed player ui
 * @param {Object} HTML 'a' element
 */
function UISwitch(node)
{
  switch (node.textContent)
  {
    case "Inventory":
      document.getElementById('inventory').style.display = '';
      document.getElementById('questPage').style.display = 'none';
    break;
    case "Quest List":
      document.getElementById('inventory').style.display = 'none';
      document.getElementById('questPage').style.display = '';
      // update the quest list
      var list = document.getElementById('questList');
      list = RemoveChildren(list);
      for (var i = JP.player.quests.length - 1; i >= 0; i--)
      {
        var qp = JP.player.quests[i];

        var q = document.createElement("a");
        q.textContent = JP.Quest.Find(qp.codename).fullname;
        q.href = "#";
        q.setAttribute("data-quest", qp.codename);
        q.onclick = function() { OpenQuest(this); };
        list.appendChild(q);
      };
    break;
  }
};

/**
 * Updates the quest log dialog. Does no opening or closing
 * @param {Object} HTML 'a' element generated by {@link UISwitch}
 */
function OpenQuest(elem)
{
  var codename = elem.getAttribute("data-quest");

  var quest = JP.Quest.Find(codename);

  document.getElementById('questTitle').textContent = quest.fullname;
  document.getElementById('questDesc').textContent = quest.description;
  document.getElementById('questStatus').textContent = quest.Write();

  document.getElementById('questInfoPane').style.display = '';
}
