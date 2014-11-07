/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Entity = JP.Entity || {};
JP.Entity.ID = 0;

JP.Entity.Type = JP.Entity.Type || {};
  JP.Entity.Type.NONE = 0,

  //trees
  JP.Entity.Type.OAK =       0x1;
  JP.Entity.Type.EVERGREEN = 0x2;
  JP.Entity.Type.TREE =      JP.Entity.Type.OAK + JP.Entity.Type.EVERGREEN;

  // npcs
  JP.Entity.Type.LUMBERJACK = 0x4;
  JP.Entity.Type.NPC =        JP.Entity.Type.LUMBERJACK;
  
  //misc
  JP.Entity.Type.FIRE = 0x8;
  JP.Entity.Type.MISC = JP.Entity.Type.FIRE;

JP.Entity.Entity = function(x, y, lifespan)
{
  this.id = JP.Entity.ID++;
  this.img = undefined;
  this.imgPath = undefined;
  this.colour = "#ffffff";
  this.hpMax = 10;
  this.hp = this.hpMax;
  this.canTalk = false;
  this.canMove = false;
  this.canChop = false;
  this.posx = x || -1;
  this.posy = y || -1;
  this.size = JP.PIXEL_SIZE;
  this.moveGoal = {x: x, y: y, cx: x, cy: y};
  this.timeToLive = JP.getTickCount() + lifespan || -1;

  // item drops on death
  // array of objects like: {item, chance};
  this.drops = [];
  this.goldMin = 0;
  this.goldMax = 0;
};

JP.Entity.Entity.prototype.Draw = function(xoffset, yoffset)
{
  if (this.posx < Math.floor(xoffset) || this.posx > (JP.gameview.width - JP.ui_width) / JP.PIXEL_SIZE + xoffset)
    return;
  if (this.posy < Math.floor(yoffset) || this.posy > (JP.gameview.height) / JP.PIXEL_SIZE + yoffset)
    return;
  if (this.imgPath !== undefined)
  {
    if (this.img === undefined)
    {
      this.img = new Image();
      this.img.src = 'img/' + this.imgPath;
    }
    JP.gamecontext.drawImage(this.img,
      (this.posx - xoffset) * JP.PIXEL_SIZE,
      (this.posy - yoffset) * JP.PIXEL_SIZE,
      this.size,
      this.size
    );
  }
  else
  {
    JP.gamecontext.fillStyle = this.colour;
    JP.gamecontext.fillRect(
      (this.posx - xoffset) * JP.PIXEL_SIZE,
      (this.posy - yoffset) * JP.PIXEL_SIZE,
      JP.PIXEL_SIZE,
      JP.PIXEL_SIZE
    );
  }
}

JP.Entity.Entity.prototype.Impact = function(damage)
{
  this.hp -= damage;
  if (this.hp <= 0)
  {
    this.Death();
    return true;
  }
  return false;
};

JP.Entity.Entity.prototype.Idle = function()
{
  if (this.timeToLive !== -1 && this.timeToLive < JP.getTickCount())
  {
    this.Death();
    return false;
  }
  return true;
};

JP.Entity.Entity.prototype.Death = function(doDrops)
{
  doDrops = doDrops || true;

  if (doDrops && this.drops !== undefined && this.drops.length > 0)
  {
    for (var i = this.drops.length - 1; i >= 0; i--)
    {
      if (this.drops[i].chance >= 1.0 || this.drops[i].chance > Math.random())
        JP.player.ItemDelta(this.drops[i].name);
    };

    if (this.goldMax > 0)
      JP.player.DeltaGold(randIntRange(this.goldMin, this.goldMax));
  }

  JP.world.entities.splice(JP.Entity.FindByID(this.id), 1);
  JP.needDraw = true;
};

JP.Entity.Entity.prototype.InRangeOfPlayer = function(range)
{
  range = range || 1;
  if (Distance(JP.player.posx, JP.player.posy, this.posx, this.posy) > range)
    return false;
  return true;
};

JP.Entity.FindByID = function(id)
{
  for (var i = JP.world.entities.length - 1; i >= 0; --i)
  {
    if (JP.world.entities[i].id === id)
      return i;
  };
  return -1;
};

JP.Entity.FindByPos = function(x, y, xtol, ytol)
{
  xtol = xtol || 0.5;
  ytol = ytol || 0.5;
  for (var i = JP.world.entities.length - 1; i >= 0; --i)
  {
    if (InRange(x - xtol, x + xtol, JP.world.entities[i].posx) === false)
      continue;
    if (InRange(y - ytol, y + ytol, JP.world.entities[i].posy) === false)
      continue;
    return i;
  };
  return -1;
};

JP.Entity.FindAroundPlayer = function(type, range, st, et)
{
  type = type || 0;
  range = range || 1;
  st = st || JP.rad(-60);
  et = et || JP.rad( 60);

  st += JP.player.direction;
  et += JP.player.direction;

  for (var i = JP.world.entities.length - 1; i >= 0; --i)
  {
    if (type > 0 && (JP.world.entities[i].type & type) === 0)
      continue;

    var o = {x: JP.player.relx + 0.5, y: JP.player.rely + 0.5};
    var p = {x: JP.world.entities[i].posx + 0.5, y: JP.world.entities[i].posy + 0.5};

    if (JP.InsideSegment(o, p, st, et, range) === true)
      return i;
  };
  return -1;
};

JP.Entity.Entity.prototype.Talk = function()
{
  return false;
};

JP.Entity.Entity.prototype.Move = function()
{
  return;
};

JP.Entity.Oak = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.OAK;
  this.imgPath = 'tree.png';
  this.canChop = true;
  this.hpMax = 5;
  this.hp = randIntRange(3, 5); // how many hits to farm/kill
  this.drops = [{name: "Oak Log", chance: 1.0}];

  // reposition slightly so trees don't sit uniformly
  this.size = randIntRange((JP.PIXEL_SIZE >> 1) - 2, (JP.PIXEL_SIZE >> 1) + 2) << 1;
 // this.posx += 1 / randRange(0, JP.PIXEL_SIZE - this.size);
 // this.posy += 1 / randRange(0, JP.PIXEL_SIZE - this.size);
};
JP.Entity.Oak.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.Oak.prototype.constructor = JP.Entity.Oak;
JP.Entity.Evergreen = function()
{
  JP.Entity.Oak.apply(this, arguments);
  this.type = JP.Entity.Type.EVERGREEN;
  this.imgPath = 'evergreen.png';
  this.hpMax = 4;
  this.hp = randIntRange(2, 4); // how many hits to farm/kill
  this.drops = [{name: "Evergreen Log", chance: 1.0}];
};
JP.Entity.Evergreen.prototype = Object.create(JP.Entity.Oak.prototype);
JP.Entity.Evergreen.prototype.constructor = JP.Entity.Evergreen;


JP.Entity.Lumberjack = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.LUMBERJACK;
  this.imgPath ='lumberjack.png';
  this.canTalk = true;
  this.canMove = true;
};
JP.Entity.Lumberjack.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.Lumberjack.prototype.constructor = JP.Entity.Lumberjack;
JP.Entity.Lumberjack.prototype.Talk = function()
{
  if (JP.player.ItemClass(JP.Item.Class.AXE) === undefined)
  {
    new JP.Logger.LogItem("\"Well there, it looks like you could use an axe!\"", false, false, false).Post();
    JP.player.ItemDelta("Axe");
    return true;
  }
  else if (JP.player.ItemClass(JP.Item.Class.WOOD) === undefined)
  {
    new JP.Logger.LogItem("\"Use 'C' to chop at trees and collect wood!\"", false, false, false).Post();
    return true;
  }
  else if (JP.player.ItemClass(JP.Item.Class.TINDERBOX) === undefined)
  {
    new JP.Logger.LogItem("\"Here's a Tinderbox, find a clear area and press 'F' to start a fire.\"", false, false, false).Post();
    JP.player.ItemDelta("Tinderbox");
    return true;
  }
  else if (JP.player.canSwim === false && JP.player.ItemQuant("Evergreen Log") < 25 && JP.player.ItemQuant("Oak Log") < 20)
  {
    new JP.Logger.LogItem("\"Bring me 25 Evergreen Logs or 20 Oak Logs and I'll teach you to swim.\"", false, false, false).Post();
    return true;
  }
  else if (JP.player.canSwim === false && JP.player.ItemQuant("Evergreen Log") >= 25)
  {
    new JP.Logger.LogItem("\"... Row row row your boat, gently down the stream, belts off trousers down, isn't life a scream?!\"", false, false, false).Post();
    new JP.Logger.LogItem("You now know how to swim", false, false, true).Post();
    JP.player.canSwim = true;
    JP.player.ItemDelta("Evergreen Log", -25);
    return true;
  }
  else if (JP.player.canSwim === false && JP.player.ItemQuant("Oak Log") >= 20)
  {
    new JP.Logger.LogItem("\"... Row row row your boat, gently down the stream, belts off trousers down, isn't life a scream?!\"", false, false, false).Post();
    new JP.Logger.LogItem("You now know how to swim", false, false, true).Post();
    JP.player.ItemDelta("Oak Log", -20);
    JP.player.canSwim = true;
    return true;
  }
  else if (JP.player.ItemQuant("Oak Log") < 5)
  {
    new JP.Logger.LogItem("\"Bring me five Oak Logs and I'll pay you " + JP.Item.Spec("Oak Log", "value") + " Gold each for them!\"").Post();
    return true;
  }
  else if (JP.player.ItemQuant("Oak Log") >= 5)
  {
    JP.player.ItemDelta("Oak Log", -5);
    new JP.Logger.LogItem("\"'Ere you go.\"").Post();
    JP.player.DeltaGold(JP.Item.Spec("Oak Log", "value") * 5);
    return true;
  }
  return false;
};

JP.Entity.Lumberjack.prototype.Move = function()
{
  return; // this works but it's too fast and cba to work on this atm

  // move towards our moveGoal
  if (this.posx === this.moveGoal.x && this.posy === this.moveGoal.y)
  {
    var nx = randIntRange(-10, 10);
    var ny = randIntRange(-10, 10);
    this.moveGoal.x = this.moveGoal.cx + nx;
    this.moveGoal.y = this.moveGoal.cy + ny;
  }
  var dx = this.posx - this.moveGoal.x;
  var dy = this.posy - this.moveGoal.y;
  if (Math.abs(dx > dy) || dx === dy && randTrue())
  {
    if (dx > 0)
      this.posx++;
    else
      this.posx--;
  }
  else
  {
    if (dy > 0)
      this.posy++;
    else
      this.posy--;
  }
};


JP.Entity.Fire = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.FIRE;
  this.imgPath = 'fire.png';
  this.canTalk = false;
  this.canMove = false;
};
JP.Entity.Fire.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.Fire.prototype.constructor = JP.Entity.Fire;

JP.Entity.Load = function(data)
{
/*
  if (data === undefined || data === null)
    return;

  var ent;
  switch (data.class)
  {
    case ""
  }
*/
};