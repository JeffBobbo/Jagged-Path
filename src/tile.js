/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Tile = JP.Tile || {};

JP.Tile.registry = {};

JP.Tile.Load = function(data)
{
  if (data === undefined || data === null)
    return;

  var tile = {};
  tile.name = data.name;
  tile.data = data;
  JP.Tile.Register(tile);
};

JP.Tile.Register = function(tile)
{
  if (JP.Tile.registry[tile.name] === undefined)
    JP.Tile.registry[tile.name] = tile;
  else
    throw tile.name + " used more than once for tiles";
};

JP.Tile.Create = function(tile)
{
  var reg = JP.Tile.registry[tile];
  if (reg === undefined)
    return undefined;
  var tile = new JP.Tile.Tile();
  tile.merge(reg.data);
  return tile;
}

JP.Tile.Tile = function()
{
  this.name = null;
  this.colour = null;
  this.img = null;
  this.imgPath = null;
  this.spawnSafe = false;
  this.swimmable = false;
  this.climbable = false;
};

JP.Tile.Tile.prototype.Draw = function(x, y, xoffset, yoffset)
{
  if (this.colour !== null)
  {
    JP.gamecontext.fillStyle = this.colour;
    JP.gamecontext.fillRect(
      (x - xoffset) * JP.PIXEL_SIZE,
      (y - yoffset) * JP.PIXEL_SIZE,
      JP.PIXEL_SIZE,
      JP.PIXEL_SIZE
    );
  }
  JP.gamecontext.drawImage(this.img, 
    (x - xoffset) * JP.PIXEL_SIZE,
    (y - yoffset) * JP.PIXEL_SIZE
  );
};

JP.Tile.Tile.prototype.IsPassable = function()
{
  if (this.swimmable === true)
    return JP.player.canSwim;
  if (this.climbable === true)
    return JP.player.CanClimb();

  return true;
};

/*
JP.Tile.Dirt = function()
{
  JP.Tile.Tile.apply(this, arguments);
  this.colour = "#836539"; // brown
  this.spawnSafe = true;
};
JP.Tile.Dirt.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Dirt.prototype.constructor = JP.Tile.Dirt;

JP.Tile.Snow = function()
{
  JP.Tile.Tile.apply(this, arguments);
  this.colour = "#ffffff";
  this.spawnSafe = true;
};
JP.Tile.Snow.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Snow.prototype.constructor = JP.Tile.Snow;

JP.Tile.Grass = function()
{
  this.colour = "#35682D"; // grassy-green
  this.spawnSafe = true;
};
JP.Tile.Grass.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Grass.prototype.constructor = JP.Tile.Grass;

JP.Tile.Desert = function()
{
  this.colour = "#C19A6B"; // deserty orange-brown
  this.spawnSafe = false;
};
JP.Tile.Desert.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Desert.prototype.constructor = JP.Tile.Desert;

JP.Tile.Savanna = function()
{
  this.colour = "#97C16B"; // olive-y green
  this.spawnSafe = false;
};
JP.Tile.Savanna.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Savanna.prototype.constructor = JP.Tile.Savanna;

JP.Tile.Water = function()
{
  this.colour = "#003fff";
  this.spawnSafe = false;
};
JP.Tile.Water.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Water.prototype.constructor = JP.Tile.Water;

JP.Tile.Water.prototype.IsPassable = function()
{
  return JP.player.canSwim;
};

JP.Tile.Ice = function()
{
  this.colour = "#A5F2F3";
  this.spawnSafe = false;
};
JP.Tile.Ice.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Ice.prototype.constructor = JP.Tile.Ice;

JP.Tile.Mountain = function()
{
  this.colour = "#999999";
  this.spawnSafe = false;
};
JP.Tile.Mountain.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.Mountain.prototype.constructor = JP.Tile.Mountain;

JP.Tile.Mountain.prototype.IsPassable = function()
{
  return JP.player.CanClimb();
};

JP.Tile.SnowyMountain = function()

{
  this.imgPath = 'snowyMountain.png';
  this.spawnSafe = false;
};
JP.Tile.SnowyMountain.prototype = Object.create(JP.Tile.Tile.prototype);
JP.Tile.SnowyMountain.prototype.constructor = JP.Tile.SnowyMountain;

JP.Tile.SnowyMountain.prototype.IsPassable = function()
{
  return JP.player.CanClimb(1);
};
*/