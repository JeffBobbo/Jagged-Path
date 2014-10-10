/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Player = function()
{
  this.posx = -1;
  this.posy = -1;
  this.relx = -1; // floats
  this.rely = -1; // floats

  this.speed = 10 / 1000;
  this.direction;
  this.imgBase = 'img/player';

  if (JP.USE_ARCADE_CONTROLS === true)
  {
    this.imgUp = new Image();
    this.imgUp.src = this.imgBase + '_back.png';
    this.imgLeft = new Image();
    this.imgLeft.src = this.imgBase + '_left.png';
    this.imgRight = new Image();
    this.imgRight.src = this.imgBase + '_right.png';
    this.imgDown = new Image();
    this.imgDown.src = this.imgBase + '_front.png';
  }
  else
  {
    this.img = new Image();
    this.img.src = this.imgBase + '.png';
  }

  // inventory stuff
  this.gold = 0; // monies
  this.inventory = [];
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


  // end data
  // saveKeys -- This is what gets saved or loaded -- key names of the JP.Player object
  this.saveKeys = [
    "relx",
    "rely",
    "direction",
    "gold",
    "canClimb",    
    "canSwim",
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
  o["inventory"] = [];
  for (var i = this.inventory.length - 1; i >= 0; i--)
  {
    var item = {};
    item.name = this.inventory[i].name;
    item.quant = this.inventory[i].quant;
    o["inventory"].push(item);
  };

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

  for (var i = invent.length - 1; i >= 0; i--)
    this.ItemDelta(invent[i].name, invent[i].quant);
  // this inventory handling is HORRIBLE and I should fix it, but that's for another day

  this.posx = Math.floor(this.relx);
  this.posy = Math.floor(this.rely);
};

JP.Player.prototype.Delete = function()
{
  localStorage.removeItem("JP.Player");
}

JP.Player.prototype.CanClimb = function(snow)
{
  if (snow)
    return this.ItemClass(JP.Item.Class.SNOW_GEAR) != -1;
  else
    return this.ItemClass(JP.Item.Class.CLIMBING_GEAR) != -1;
  return this.canClimb;
}

JP.Player.prototype.ItemOwn  = function(name)
{
  return this.ItemQuant(name) > 0;
};

JP.Player.prototype.ItemQuant = function(name)
{
  for (var i = this.inventory.length - 1; i >= 0; --i)
  {
    if (this.inventory[i].name === name)
      return this.inventory[i].quant;
  }
  return 0;
};

JP.Player.prototype.ItemClass = function(itemClass)
{
  var best = -1;
  for (var i = this.inventory.length - 1; i >= 0; i--)
  {
    if (this.inventory[i].class === itemClass)
    {
      if (best === -1)
        best = i;
      if (this.inventory[i].power > this.inventory[best].power)
        best = i;
    }
  }
  return best;
};

JP.Player.prototype.ItemDelta = function(name, quant, absolute)
{
  quant = quant || 1;
  absolute = absolute || false;

  var index = -1; // find the item
  for (var i = this.inventory.length - 1; i >= 0; --i)
  {
    if (this.inventory[i].name !== name)
      continue;
    index = i;
    break;
  }
  if (index === -1) // if it doesn't exist, add it
  {
    this.inventory.unshift(JP.Item.Create(name, quant)); // absol doesn't matter, cause we have 0 already
    index = 0;
  }
  else // otherwise, update quant
  {
    if (absolute === true)
      this.inventory[index].quant = quant;
    else
      this.inventory[index].quant += quant;
  }
  if (this.inventory[index].quant <= 0) // remove if none left
    this.inventory.splice(index, 1);
  JP.needDraw = true;
};

JP.Player.prototype.DeltaGold = function(quant, absolute)
{
  absolute = absolute || false;
  if (quant === undefined)
    return false;

  var gold = absolute ? quant : this.gold + quant;

  if (gold < 0)
    return false;
  this.gold = gold;
  return true;
}

JP.Player.prototype.Draw = function()
{
/*
  var table = document.getElementById('inventTable');
  while (table.rows.length > 1)
    table.deleteRow(-1);

  for (var i = this.inventory.length - 1; i >= 0; --i)
  {
    var row = table.insertRow(-1);
    var quant = row.insertCell(0);
    var name = row.insertCell(0);
    quant.textContent = this.inventory[i].quant;
    name.textContent = this.inventory[i].name;
  }
  */
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
  var dist = this.speed * dt;
  if (JP.world.terrain[this.posx][this.posy].constructor === JP.Tile.Water)
    dist *= 0.5; // slower in water

  if (JP.USE_ARCADE_CONTROLS)
  {
    switch (dir)
    {
      case JP.Keys.A:
        if (this.relx - dist > 0 && JP.world.terrain[Math.floor(this.relx - dist)][this.posy].IsPassable())
          this.relx -= dist;
        this.direction = JP.Keys.A;
      break;
      case JP.Keys.D:
        if (this.relx + dist < (JP.WIDTH - 1) && JP.world.terrain[Math.floor(this.relx + dist)][this.posy].IsPassable())
          this.relx += dist;
        this.direction = JP.Keys.D;
      break;

      case JP.Keys.W:
        if (this.rely - dist > 0 && JP.world.terrain[this.posx][Math.floor(this.rely - dist)].IsPassable())
          this.rely -= dist;
        this.direction = JP.Keys.W;
      break;
      case JP.Keys.S:
        if (this.rely + dist < (JP.HEIGHT - 1) && JP.world.terrain[this.posx][Math.floor(this.rely + dist)].IsPassable())
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
        dx = Math.sin(-this.direction) * (dist * (dir === JP.Keys.A ? -0.8 : 0.8)); // I know this looks weird, but neh
        dy = Math.cos(-this.direction) * (dist * (dir === JP.Keys.A ? -0.8 : 0.8)); // I know this looks weird, but neh
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
  }
  // update non-floats
  this.posx = Math.floor(this.relx);
  this.posy = Math.floor(this.rely);
  JP.needDraw = true;
};

JP.Player.prototype.Talk = function()
{
  if (JP.USE_ARCADE_CONTROLS)
  {
    var a = [];
    for (var i = 0; i < JP.world.entities.length; ++i)
    {
      if (JP.world.entities[i].InRangeOfPlayer() === true)
        a.push(i);
    }
    for (var i = 0; i < a.length; ++i)
    {
      if (JP.world.entities[a[i]].canTalk === false)
        continue;

      if (JP.world.entities[a[i]].Talk() === true)
      {
        var dx = this.posx - JP.world.entities[a[i]].posx;
        var dy = this.posy - JP.world.entities[a[i]].posy;
        if (dx === 1)
          this.direction = JP.Keys.A;
        else if (dx === -1)
          this.direction = JP.Keys.D;
        else if (dy === 1)
          this.direction = JP.Keys.W;
        else
          this.direction = JP.Keys.S;
        JP.needDraw = true;

        return;
      }
    }
    new JP.Logger.LogItem("There's nothing to talk to.", false, false, true).Post();
  }
  else
  {
    var npc = JP.Entity.FindAroundPlayer(JP.Entity.Type.NPC, 2.5);
    if (npc === -1 || JP.world.entities[npc].canTalk === false || JP.world.entities[npc].Talk() === false)
      new JP.Logger.LogItem("There's nothing to talk to.", false, false, true).Post();
  }
};

JP.Player.prototype.ChopTree = function()
{
  var axe = this.ItemClass(JP.Item.Class.AXE);
  if (axe === -1)
  {
    new JP.Logger.LogItem("You have no axe.", false, false, true).Post();
    return; // no axe, no dice
  }
  this.inventory[axe].Use();
};

JP.Player.prototype.Fire = function()
{
  var tb = this.ItemClass(JP.Item.Class.TINDERBOX);
  if (tb === -1)
  {
    new JP.Logger.LogItem("You have no tinder box.", false, false, true).Post();
    return;
  }
  this.inventory[tb].Use();
}