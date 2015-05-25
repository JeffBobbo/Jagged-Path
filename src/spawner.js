/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Spawn = {};

JP.Spawn.registry = {};

JP.Spawn.Load = function(data)
{
  var spawn = {};
  switch (data.class)
  {
    case "base":
      spawn.cstruct = JP.SpawnBase;
    break;
    case "item":
      spawn.cstruct = JP.SpawnItem;
    break;
    case "resource":
      spawn.cstruct = JP.SpawnResource;
    break;
    default:
      throw "Unknown spawn class for " + data.name + ". Class: " + data.class;
    break;
  }
  spawn.name = data.name;

  delete data.class;
  spawn.data = data;
  JP.Spawn.Register(spawn);
};

JP.Spawn.Register = function(spawn)
{
  if (JP.Spawn.registry[spawn.name] === undefined)
    JP.Spawn.registry[spawn.name] = spawn;
  else
    alert(spawn.name + " used more than once for spawners");
};

JP.Spawn.Create = function(spawner, x, y)
{
  var reg = JP.Spawn.registry[spawner];
  if (reg === undefined)
    throw "No such spawner: " + spawner;

  var spawn = new reg.cstruct(null, x, y);
  spawn.merge(reg.data);

  return spawn;
}

JP.SpawnBase = function(progeny, x, y)
{
  this.id = JP.SpawnBase.ID++;
  this.num = 1;
  this.interval = 1000;
  this.lastSpawn = -1;
  this.limited = -1;

  this.children = []; // id's of children, no direct access

  // spawner center
  this.relx = x || -1;
  this.rely = y || -1;

  // spawner area
  this.radius = 2;

  // what we can actually spawn
  this.progeny = progeny || null;

  // special spawning rules
  this.rules = null;
};
JP.SpawnBase.ID = 0;


JP.SpawnBase.prototype.ChildCount = function(valid)
{
  var ret = 0;
  for (var i = this.children.length - 1; i >= 0; i--)
  {
    var child = JP.Entity.FindByID(this.children[i]);
    if (child.seppuku === false) // only count those who aren't marked seppuku
      ret++;
  }
  return ret;
};

JP.SpawnBase.prototype.Idle = function()
{
  if (JP.isClipped({x: this.relx, y: this.relx}) === true)
    return;

  for (var i = this.children.length - 1; i >= 0; i--)
  {
    var child = JP.Entity.FindByID(this.children[i]);
    child.Idle();
    child.Move();
  };

  this.Spawn();
};

JP.SpawnBase.prototype.CanSpawn = function()
{
  if (this.progeny === null)
    return false;

  if (this.limit === 0) // hit our limit, no more spawns
    return false;

  var count = this.ChildCount();

  if (count >= this.num) // none free
    return false;

  if (this.lastSpawn >= 0 && this.lastSpawn + this.interval > JP.getTickCount())
    return false;

  return true;
};

JP.SpawnBase.prototype.Spawn = function()
{
  if (this.CanSpawn() === false)
    return;

  for (var i = this.ChildCount(); i < this.num && this.limit !== 0; ++i)
  {
    //var dir = randRange(-Math.PI, Math.PI); // pick a random direction
    //var dist = randRange(0, this.radius);   // and a random distance
    //var x = Math.cos(dir) * dist + this.relx; // and work out placement
    var x = this.relx * randRange(-this.radius/2, this.radius/2); // and work out placement
    //var y = Math.sin(dir) * dist + this.rely; // and work out placement
    var y = this.rely * randRange(-this.radius/2, this.radius/2); // and work out placement

    var ent = JP.Entity.Create(this.progeny, x, y, null);
    ent.spawner = this;

    this.children.push(ent.id);
    JP.world.entities.push(ent);

    if (this.limit > 0)
      this.limit--;
  }
  this.lastSpawn = JP.getTickCount();
};

JP.SpawnBase.prototype.SetLastSpawn = function()
{
  this.lastSpawn = JP.getTickCount();
}

JP.SpawnItem = function()
{
  JP.SpawnBase.apply(this, arguments)

  this.boxQuant = 1;
  this.boxImg = null;
};
JP.SpawnItem.prototype = Object.create(JP.SpawnBase.prototype);
JP.SpawnItem.prototype.constructor = JP.SpawnBase;

JP.SpawnItem.prototype.Spawn = function()
{
  if (this.CanSpawn() === false)
    return;

  for (var i = this.ChildCount(); i < this.num && this.limit !== 0; ++i)
  {
    //var dir = randRange(-Math.PI, Math.PI); // pick a random direction
    //var dist = randRange(0, this.radius);   // and a random distance
    //var x = Math.cos(dir) * dist + this.relx; // and work out placement
    var x = this.relx + randRange(-this.radius/2, this.radius/2); // and work out placement
    //var y = Math.sin(dir) * dist + this.rely; // and work out placement
    var y = this.rely + randRange(-this.radius/2, this.radius/2); // and work out placement

    var box = new JP.Entity.ItemBox(x, y);
    box.spawner = this;
    if (this.progeny === "Gold")
      box.SetGold(this.boxQuant);
    else
      box.SetItem(this.progeny, this.boxQuant);
    if (this.boxImg !== null)
      box.SetImage(this.boxImg);

    this.children.push(box.id);
    JP.world.entities.push(box);

    if (this.limit > 0)
      this.limit--;
  }
  this.lastSpawn = JP.getTickCount();
}

JP.SpawnResource = function()
{
  JP.SpawnBase.apply(this, arguments)

  this.minDist = 2;
};
JP.SpawnResource.prototype = Object.create(JP.SpawnBase.prototype);
JP.SpawnResource.prototype.constructor = JP.SpawnBase;

JP.SpawnResource.prototype.Spawn = function()
{
  if (this.CanSpawn() === false)
    return;

  if (this.ChildCount() !== 0)
    return;

  var ent = JP.Entity.Create(this.progeny, this.relx, this.rely, null);
  ent.spawner = this;

  this.children.push(ent.id);
  JP.world.entities.push(ent);
  JP.world.entities.sort(function(a, b) {
    return a.id - b.id;
  });

    if (this.limit > 0)
      this.limit--;
  this.lastSpawn = JP.getTickCount();
};
