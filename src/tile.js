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
    JP.context.fillStyle = this.colour;
    JP.context.fillRect(
      (x - xoffset) * JP.zoomLevel,
      (y - yoffset) * JP.zoomLevel,
      JP.zoomLevel,
      JP.zoomLevel
    );
  }
  JP.context.drawImage(this.img,
    (x - xoffset) * JP.zoomLevel,
    (y - yoffset) * JP.zoomLevel
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
