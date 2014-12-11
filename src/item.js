/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Item = JP.Item || {};

JP.Item.Class = {
  NO_CLASS: 0,
  AXE: 1,
  WOOD: 2,
  TINDERBOX: 3,
};

JP.Item.registry = {};

JP.Item.Load = function(data)
{
  if (data === undefined || data === null)
    return;

  var item;
  switch (data.class)
  {
    case "axe":
      item = new JP.Item.Axe();
    break;
    case "log":
      item = new JP.Item.Log();
    break;
    case "tinderbox":
      item = new JP.Item.Tinderbox();
    break;
    default:
      alert("Unknown item class for " + data.name + ". Class: " + data.class);
      return;
    break;
  }
  delete data.class;
  item.merge(data);
  JP.Item.Register(item);
};

JP.Item.Register = function(item)
{
  if (JP.Item.registry[item.name] === undefined)
    JP.Item.registry[item.name] =  item;
  else
    alert(item.name + " used more than once for items");
};

JP.Item.Spec = function(name, spec)
{
  if (JP.Item.registry[name] === undefined)
    return undefined;

  return JP.Item.registry[name].GetSpec(spec);
}
JP.Item.StatString = function(name)
{
  return JP.Item.registry[name].GetStatString();
}

JP.Item.Use = function(name)
{
  if (JP.Item.registry[name] === undefined)
    return;

  return JP.Item.registry[name].Use();
}

JP.Item.Item = function()
{
  this.name = "";

  // look up item by class
  this.class = JP.Item.Class.NO_CLASS;

  this.value = 0;

  // tool settings
  this.power = 0;
  this.reach = 0;

  // combat settings
  this.attack  = 0;
  this.defence = 0;
  this.range   = 0;
};

JP.Item.Item.prototype.Use = function()
{
  return true;
};
JP.Item.Item.prototype.GetSpec = function(spec)
{
  return this[spec] || null;
}
JP.Item.Item.prototype.GetStatString = function()
{
  var str = "";
  str + this.name;

  var attributes = Object.keys(this);
  var len = attributes.length;
  for (var i = 0; i < len; ++i)
  {
    if (this[attributes[i]] === 0 || this[attributes[i]] === "") // skip empty/0 values
      continue;
    if (attributes[i] === "class") // ignore the class - replace with GetClassString or such
      continue;

    if (str.length > 0)
      str += "\n";
    str += attributes[i].toTitleCase() + ": " + Commify(this[attributes[i]]);
  }
  return str;
}


JP.Item.Axe = function()
{
  JP.Item.Item.apply(this, arguments);
  this.name = "Axe";
  this.class = JP.Item.Class.AXE;
  
  this.value = 350;

  this.power = 1;
  this.reach = 2;
};
JP.Item.Axe.prototype = Object.create(JP.Item.Item.prototype);
JP.Item.Axe.prototype.constructor = JP.Item.Axe;
JP.Item.Axe.prototype.Use = function()
{
  var tree = null;
  if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.ARCADE)
  {
    switch (JP.player.direction)
    {
      case JP.Keys.A:
        tree = JP.Entity.FindAroundPlayer(JP.Entity.Type.TREE, this.reach, JP.rad(-45), JP.rad(45), 0);
      break;
      case JP.Keys.D:
        tree = JP.Entity.FindAroundPlayer(JP.Entity.Type.TREE, this.reach, JP.rad(-45), JP.rad(45), Math.PI/2);
      break;
      case JP.Keys.W:
        tree = JP.Entity.FindAroundPlayer(JP.Entity.Type.TREE, this.reach, JP.rad(-45), JP.rad(45), Math.PI);
      break;
      case JP.Keys.S:
      default:
        tree = JP.Entity.FindAroundPlayer(JP.Entity.Type.TREE, this.reach, JP.rad(-45), JP.rad(45), -Math.PI/2);
      break;
    }
  }
  else
  {
    tree = JP.Entity.FindAroundPlayer(JP.Entity.Type.TREE, this.reach, JP.rad(-45), JP.rad(45));
  }
  if (tree !== null)
  {
    if (tree.canChop === true)
    {
      if (tree.Impact(this.power))
        new JP.Logger.LogItem("You cut down the tree.").Post();
      else
        new JP.Logger.LogItem("You swing at the tree.").Post();
      return true;
    }
    else
    {
      new JP.Logger.LogItem("You can't cut that.").Post();
      return false;    
    }
  }
  else
  {
    new JP.Logger.LogItem("There's nothing to cut.").Post();
    return false;
  }
};


JP.Item.Log = function()
{
  JP.Item.Item.apply(this, arguments);
  this.name = "Oak Log";
  this.class = JP.Item.Class.WOOD;

  this.value = 30;
  // burn time = this * 10s
  this.power = 3;
};
JP.Item.Log.prototype = Object.create(JP.Item.Item.prototype);
JP.Item.Log.prototype.constructor = JP.Item.Log;

JP.Item.Tinderbox = function()
{
  JP.Item.Item.apply(this, arguments);
  this.name = "Tinderbox";
  this.class = JP.Item.Class.TINDERBOX;
  this.value = 10;
};
JP.Item.Tinderbox.prototype = Object.create(JP.Item.Item.prototype);
JP.Item.Tinderbox.prototype.constructor = JP.Item.Tinderbox;

JP.Item.Tinderbox.prototype.Use = function()
{
  var wood = JP.player.ItemClass(JP.Item.Class.WOOD);
  if (wood === null)
  {
    new JP.Logger.LogItem("You have no wood.", false, false, false).Post();
    return;
  }

  var clearSpot = null;
  if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.ARCADE)
  {
    // check in front of us
    var x = JP.player.relx + 0.5;
    var y = JP.player.rely + 0.5;
    switch (JP.player.direction)
    {
      case JP.Keys.A:
        if (JP.Entity.FindByPos(x - 1, y) === null && JP.world.terrain[Math.floor(x - 1)][Math.floor(y)].name !== "Water")
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x - 1;
          clearSpot.y = y;
        }
      break;
      case JP.Keys.D:
        if (JP.Entity.FindByPos(x + 1, y) === null && JP.world.terrain[Math.floor(x + 1)][Math.floor(y)].name !== "Water")
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x + 1;
          clearSpot.y = y;
        }
      break;
      case JP.Keys.W:
        if (JP.Entity.FindByPos(x, y - 1) === null && JP.world.terrain[Math.floor(x)][Math.floor(y - 1)].name !== "Water")
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x;
          clearSpot.y = y - 1;
        }
      break;
      case JP.Keys.S:
      default:
        if (JP.Entity.FindByPos(x, y + 1) === null && JP.world.terrain[Math.floor(x)][Math.floor(y + 1)].name !== "Water")
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x;
          clearSpot.y = y + 1;
        }
      break;
    }
  }
  else
  {
    var px = JP.player.relx + 0.5;
    var py = JP.player.rely + 0.5;
    if (JP.Entity.FindByPos(px, py) === null)
    {
      clearSpot = {};
      clearSpot.x = px;
      clearSpot.y = py;
    }
  }
  if (clearSpot === null)
  {
    new JP.Logger.LogItem("There is nowhere clear to make a fire.", false, false, false).Post();
    return false;
  }
  JP.world.entities.push(new JP.Entity.Fire(clearSpot.x - 0.5, clearSpot.y - 0.5, 10000 * JP.Item.Spec(wood, "power")));
  JP.player.ItemDelta(wood, -1);
  new JP.Logger.LogItem("You started a fire.", false, false, false).Post();
  JP.needDraw = true;
};
