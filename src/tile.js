/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Tile = JP.Tile || {};

JP.Tile.Tile = function()
{
  this.colour = "#000000";
  this.img = undefined;
  this.imgPath = undefined;
  this.spawnSafe = false;
};

JP.Tile.Tile.prototype.Draw = function(x, y, xoffset, yoffset)
{
  if (this.imgPath !== undefined)
  {
    if (this.img === undefined)
    {
      this.img = new Image();
      this.img.src = 'img/' + this.imgPath;
    }
    JP.gamecontext.drawImage(this.img, 
      (x - xoffset) * JP.PIXEL_SIZE,
      (y - yoffset) * JP.PIXEL_SIZE
    );
  }
};

JP.Tile.Tile.prototype.IsPassable = function()
{
  return true;
};


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