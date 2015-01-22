/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Player = function()
{
  this.fName = "";
  this.sName = "";
  this.posx = -1;
  this.posy = -1;
  this.relx = -1; // floats
  this.rely = -1; // floats

  this.speed = 4; // in tiles per s
  this.rotationSpeed = Math.PI * 2; // pi radians per second
  this.direction = 0;
  this.imgBase = 'img/player';

  this.imgUp = new Image();
  this.imgUp.src = this.imgBase + '_back.png';
  this.imgLeft = new Image();
  this.imgLeft.src = this.imgBase + '_left.png';
  this.imgRight = new Image();
  this.imgRight.src = this.imgBase + '_right.png';
  this.imgDown = new Image();
  this.imgDown.src = this.imgBase + '_front.png';
  this.img = new Image();
  this.img.src = this.imgBase + '.png';

  // inventory stuff
  this.gold = 0; // monies
  this.inventory = {}; // name: quant
  // ? -- need climbing gear and boat for mountains/water

  // skill stuff -- unimplemented
  this.skills = {
    woodcutting: 0,
    swimming: -1, // -1 means the skill is locked and has to be learnt
  };
  /* swimming outline:
    Swimming level mandates how far you can swim (in squares?) -- need some kind of punishment
    Swimmers can dive and recover treasure, of which depends on level
  */
  this.canClimb = false;
  this.canSwim = false;

  this.quests = []; // {codename, status, start, end}

  // end data
  // saveKeys -- This is what gets saved or loaded -- key names of the JP.Player object
  this.saveKeys = [
    "fName",
    "sName",
    "relx",
    "rely",
    "direction",
    "gold",
    "canClimb",    
    "canSwim",
    "quests"
  ];
};

JP.Player.prototype.Save = function()
{
  var o = {};
  for (var i = this.saveKeys.length - 1; i >= 0; i--)
  {
    var key = this.saveKeys[i]; 
    o[key] = this[key];
  }
  o.inventory = this.inventory;
  localStorage.setItem("JP.Player", JSON.stringify(o));
};

JP.Player.prototype.Load = function()
{
  var tmp = JSON.parse(localStorage.getItem("JP.Player"));
  if (tmp === undefined || tmp === null)
    return;

  var invent = tmp.inventory;
  tmp.inventory = undefined; // so we don't overwrite it in merge
  this.merge(tmp);

  var keys = Object.keys(invent);
  for (var i = keys.length - 1; i >= 0; i--)
  {
    try
    {
      this.ItemDelta(keys[i], invent[keys[i]], true, false);
    }
    catch(msg)
    {
    }
  }

  this.ItemUpdate();
  this.GoldUpdate();

  this.posx = Math.floor(this.relx);
  this.posy = Math.floor(this.rely);
};

JP.Player.prototype.Delete = function()
{
  localStorage.removeItem("JP.Player");
}

JP.Player.prototype.CanClimb = function(snow)
{
  return this.canClimb;
}

JP.Player.prototype.ItemOwn  = function(name)
{
  return this.ItemQuant(name) > 0;
};

JP.Player.prototype.ItemQuant = function(name)
{
  return this.inventory[name] || 0;
};

JP.Player.prototype.ItemClass = function(itemClass)
{
  var best = -1;
  var keys = Object.keys(this.inventory);
  for (var i = keys.length - 1; i >= 0; i--)
  {
    if (JP.Item.Spec(keys[i], "class") === itemClass)
    {
      if (best === -1 || JP.Item.Spec(keys[i], "power") > JP.Item.Spec(keys[best], "power"))
        best = i;
    }
  }
  if (best === -1)
    return null;
  return keys[best];
};

JP.Player.prototype.ItemQuantOfClass = function(itemClass)
{
  var quant = 0;
  var keys = Object.keys(this.inventory);
  for (var i = keys.length - 1; i >= 0; i--)
  {
    if (JP.Item.Spec(keys[i], "class") === JP.Item.Class[itemClass])
      quant += this.inventory[keys[i]];
  };
  return quant;
};

JP.Player.prototype.ItemDelta = function(name, quant, absolute, update)
{
  quant = quant || 1;
  absolute = absolute || false;
  update = update || true;

  //make sure the item exists
  if (JP.Item.Spec(name, "name") === undefined)
    throw "Item '" + name + "' does not exist in JP.Player.ItemDelta()";

  if (absolute === true || this.inventory[name] === undefined)
    this.inventory[name] = quant;
  else
    this.inventory[name] += quant;

  if (this.inventory[name] <= 0)
    delete this.inventory[name];

  if (update === true)
  {
    this.ItemUpdate();
    this.QuestUpdate();
  }
};

JP.Player.prototype.ItemUpdate = function()
{

  var table = document.getElementById('inventTable');
  while (table.rows.length > 0)
    table.deleteRow(-1);

  var keys = Object.keys(this.inventory);
  for (var i = keys.length - 1; i >= 0; --i)
  {
    var row = table.insertRow(-1);
    var quant = row.insertCell(0);
    var name = row.insertCell(0);
    quant.textContent = this.inventory[keys[i]];
    name.textContent = keys[i];
    name.title = JP.Item.StatString(keys[i]);
  }
};

JP.Player.prototype.GoldDelta = function(quant, absolute, update)
{
  absolute = absolute || false;
  update = update || true;
  if (quant === undefined)
    return false;

  quant = Math.floor(quant);

  var gold = absolute ? quant : this.gold + quant;

  if (gold < 0)
    return false;
  this.gold = gold;

  if (update)
  {
    this.GoldUpdate();
    this.QuestUpdate();
  }
  return true;
};

JP.Player.prototype.GoldUpdate = function()
{
  document.getElementById('goldCount').textContent = SIfy(this.gold) + " Gold";
};

JP.Player.prototype.Place = function()
{
  // choose a sensible location for the player
  while (this.relx === -1 && this.rely === -1)
  {
    var x = randIntRange(0, JP.WIDTH - 1);
    var y = randIntRange(0, JP.HEIGHT - 1);
    // make sure this spot is clear
    if (JP.world.terrain[x][y].spawnSafe === false)
      continue;
    this.posx = x;
    this.posy = y;
    this.relx = x;
    this.rely = y;
  }
};

JP.Player.prototype.Move = function(dir)
{
  var dt = JP.getTickDelta();
  var dist = this.speed * (dt / 1000);
  if (JP.world.terrain[this.posx][this.posy].name === "Sea" || JP.world.terrain[this.posx][this.posy].name === "River")
    dist *= 0.5; // slower in water

  if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.ARCADE)
  {
    switch (dir)
    {
      case JP.Keys.A:
        if (this.relx - dist > 0 && JP.world.terrain[Math.floor(this.relx - dist)][Math.floor(this.rely + 0.5)].IsPassable())
          this.relx -= dist;
        this.direction = JP.Keys.A;
      break;
      case JP.Keys.D:
        if (this.relx + dist < (JP.WIDTH - 1) && JP.world.terrain[Math.floor(this.relx + 1 + dist)][Math.floor(this.rely + 0.5)].IsPassable())
          this.relx += dist;
        this.direction = JP.Keys.D;
      break;

      case JP.Keys.W:
        if (this.rely - dist > 0 && JP.world.terrain[Math.floor(this.relx + 0.5)][Math.floor(this.rely - dist)].IsPassable())
          this.rely -= dist;
        this.direction = JP.Keys.W;
      break;
      case JP.Keys.S:
        if (this.rely + dist < (JP.HEIGHT - 1) && JP.world.terrain[Math.floor(this.relx + 0.5)][Math.floor(this.rely + 1 + dist)].IsPassable())
          this.rely += dist;
        this.direction = JP.Keys.S;
      break;
    }
  }
  else
  {
    dist *= -1; // gotter do this so the character moves towards the mouse
    var dx = 0;
    var dy = 0;
    switch (dir)
    {
      case JP.Keys.A: // strafe L
      case JP.Keys.D: // strafe R
        if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.ASTEROID)
        {
          this.direction += (dir === JP.Keys.A ? -1 : 1) * this.rotationSpeed * (dt / 1000);
        }
        else
        {
          dx = Math.sin(-this.direction) * (dist * (dir === JP.Keys.A ? -0.8 : 0.8)); // I know this looks weird, but neh
          dy = Math.cos(-this.direction) * (dist * (dir === JP.Keys.A ? -0.8 : 0.8)); // I know this looks weird, but neh
        }
      break;
      case JP.Keys.W: // forwards march!
        dx = Math.cos(this.direction) * dist;
        dy = Math.sin(this.direction) * dist;
      break;
      case JP.Keys.S: // run away!
        dx = Math.cos(this.direction) * (dist * -0.6);
        dy = Math.sin(this.direction) * (dist * -0.6);
      break;
    }
    if (this.relx + dx <= 0.0 || this.relx + dx + 1 >= JP.world.terrain.length) // don't go beyond the edges
      return;
    if (this.rely + dy <= 0.0 || this.rely + dy + 1 >= JP.world.terrain[0].length) // don't go beyond the edges
      return;
    if (JP.world.terrain[Math.floor(this.relx + dx + 0.5)][Math.floor(this.rely + dy + 0.5)].IsPassable() === false) // don't walk where we can't go
      return;
    this.relx += dx;
    this.rely += dy;

    // make sure direction is in range -- bit dirty but does the job
    while (this.direction > Math.PI)
      this.direction -= 2 * Math.PI;
    while (this.direction < -Math.PI)
      this.direction += 2 * Math.PI;
  }
  // update non-floats
  this.posx = Math.floor(this.relx);
  this.posy = Math.floor(this.rely);

  // close any running dialogs
  for (var i = JP.world.entities.length - 1; i >= 0; i--)
  {
    var ent = JP.world.entities[i];
    if (ent.convoState != null)
    {
      ent.convoState = null;
      JP.Entity.TalkPane(ent);
    }
  }

  JP.world.Prerender();
  JP.needDraw = true;
};

JP.Player.prototype.Talk = function()
{
  if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.ARCADE)
  {
    var ents = [];
    for (var i = 0; i < JP.world.entities.length; ++i)
    {
      var ent = JP.world.entities[i];
      if ((ent.type & JP.Entity.Type.NPC) === 0)
        continue;

      if (ent.InRangeOfPlayer() === true)
        ents.push(ent);
    }
    for (var i = 0; i < ents.length; ++i)
    {
      if (ents[i].Talk() === true)
      {
        var dx = this.posx - ents[i].posx;
        var dy = this.posy - ents[i].posy;
        if (dx > 0 && dx > Math.abs(dy))
          this.direction = JP.Keys.A;
        else if (dx <= 0 && dx > Math.abs(dy))
          this.direction = JP.Keys.D;
        else if (dy > 0 && dy >= Math.abs(dx))
          this.direction = JP.Keys.W;
        else
          this.direction = JP.Keys.S;
        JP.needDraw = true;

        return;
      }
    }
    new JP.Logger.LogItem("There's nothing to talk to.").Post();
  }
  else
  {
    var npc = JP.Entity.FindAroundPlayer(JP.Entity.Type.NPC, 2.5);
    if (npc === null || npc.Talk() === false)
      new JP.Logger.LogItem("There's nothing to talk to.").Post();
  }
};

JP.Player.prototype.ChopTree = function()
{
  var axe = this.ItemClass(JP.Item.Class.AXE);
  if (axe === null)
  {
    new JP.Logger.LogItem("You have no axe.").Post();
    return; // no axe, no dice
  }
  JP.Item.Use(axe);
};

JP.Player.prototype.Fire = function()
{
  var tb = this.ItemClass(JP.Item.Class.TINDERBOX);
  if (tb === null)
  {
    new JP.Logger.LogItem("You have no tinder box.").Post();
    return;
  }
  JP.Item.Use(tb);
};

JP.Player.prototype.QuestProgress = function(quest)
{
  for (var i = this.quests.length - 1; i >= 0; i--)
  {
    if (this.quests[i].codename === quest)
      return this.quests[i];
  }
  return null;
};

JP.Player.prototype.QuestUpdate = function()
{
  for (var i = this.quests.length - 1; i >= 0; i--)
    JP.Quest.Find(this.quests[i].codename).Update();
};
