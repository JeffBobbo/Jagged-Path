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

JP.Item.Spec = function(item, spec)
{
  if (JP.Item.registry[item] === undefined)
    return undefined;

  return JP.Item.registry[item][spec];
}
JP.Item.StatString = function(item)
{
  return JP.Item.registry[item].GetStatString();
}

JP.Item.Use = function(item)
{
  if (JP.Item.registry[item] === undefined)
    return;

  return JP.Item.registry[item].Use();
}

JP.Item.Item = function()
{
  this.name = "";

  // look up item by class
  this.class = JP.Item.Class.NO_CLASS;

  this.value = 0;

  // tool power
  this.power = 0;
  this.reach = 0; // tool range

  // combat values
  this.attack  = 0;
  this.defence = 0;
  this.range   = 0;
};

JP.Item.Item.prototype.Use = function()
{
  return true;
};
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
  var treeID = -1;
  if (JP.USE_ARCADE_CONTROLS)
  {
    var x = JP.player.relx;
    var y = JP.player.rely;
    switch (JP.player.direction)
    {
      case JP.Keys.A:
        treeID = JP.Entity.FindByPos(x - 0.5, y + 0.5);
      break;
      case JP.Keys.D:
        treeID = JP.Entity.FindByPos(x + 1.5, y + 0.5);
      break;
      case JP.Keys.W:
        treeID = JP.Entity.FindByPos(x + 0.5, y - 0.5);
      break;
      case JP.Keys.S:
      default:
        treeID = JP.Entity.FindByPos(x + 0.5, y + 1.5);
      break;
    }
  }
  else
  {
    treeID = JP.Entity.FindAroundPlayer(JP.Entity.Type.TREE, this.reach, JP.rad(-45), JP.rad(45));
  }
  if (treeID !== -1)
  {
    if (JP.world.entities[treeID].canChop === true)
    {
      if (JP.world.entities[treeID].Impact(this.power))
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

  /*
  var a = [];
  for (var i = 0; i < JP.world.entities.length; ++i)
  {
    if (JP.world.entities[i].InRangeOfPlayer() === true)
      a.push(i);
  }
  for (var i = 0; i < a.length; ++i)
  {
    if (Object.getPrototypeOf(JP.world.entities[a[i]]) !== JP.Entity.Tree.prototype)
      continue;

    // so this is a tree, let's chop it
    JP.world.entities[a[i]].hp--;
    if (JP.world.entities[a[i]].hp <= 0)
    {
      JP.world.entities.splice(a[i], 1);
      this.ItemDelta("Wood", 1);
      JP.needDraw = true;
      new JP.Logger.LogItem("You cut down the tree.", false, true, false).Post();
    }
    else
      new JP.Logger.LogItem("You swing at the tree.", false, true, false).Post();
    return;
  }
  new JP.Logger.LogItem("There's nothing to cut.", false, true, false).Post();
  */
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
  if (wood === undefined)
  {
    new JP.Logger.LogItem("You have no wood.", false, false, false).Post();
    return;
  }

  var clearSpot = undefined;
  if (JP.USE_ARCADE_CONTROLS)
  {
    // check in front of us
    var x = JP.player.posx;
    var y = JP.player.posy;
    switch (JP.player.direction)
    {
      case JP.Keys.A:
        if (JP.Entity.FindByPos(x - 1, y) === -1 && JP.world.terrain[x - 1][y].constructor !== JP.Tile.Water)
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x - 1;
          clearSpot.y = y;
        }
      break;
      case JP.Keys.D:
        if (JP.Entity.FindByPos(x + 1, y) === -1 && JP.world.terrain[x + 1][y].constructor !== JP.Tile.Water)
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x + 1;
          clearSpot.y = y;
        }
      break;
      case JP.Keys.W:
        if (JP.Entity.FindByPos(x, y - 1) === -1 && JP.world.terrain[x][y - 1].constructor !== JP.Tile.Water)
        {
          clearSpot = clearSpot || {};
          clearSpot.x = x;
          clearSpot.y = y - 1;
        }
      break;
      case JP.Keys.S:
      default:
        if (JP.Entity.FindByPos(x, y + 1) === -1 && JP.world.terrain[x][y + 1].constructor !== JP.Tile.Water)
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
    if (JP.Entity.FindByPos(px, py) === -1)
    {
      clearSpot = {};
      clearSpot.x = px;
      clearSpot.y = py;
    }
  }
  if (clearSpot === undefined)
  {
    new JP.Logger.LogItem("There is nowhere clear to make a fire.", false, false, false).Post();
    return false;
  }

  JP.world.entities.push(new JP.Entity.Fire(clearSpot.x - 0.5, clearSpot.y - 0.5, 10000 * JP.Item.Spec(wood, "power")));
  JP.player.ItemDelta(wood, -1);
  new JP.Logger.LogItem("You started a fire.", false, false, false).Post();
  JP.needDraw = true;
};
