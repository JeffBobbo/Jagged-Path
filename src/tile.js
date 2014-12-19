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

JP.Tile.Create = function(tile, x, y)
{
  var reg = JP.Tile.registry[tile];
  if (reg === undefined)
    return undefined;
  var tile = new JP.Tile.Tile();
  tile.merge(reg.data);

  if (x !== undefined && y !== undefined)
    tile.data = JP.world.mapData[x][y];
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
  this.data = null;
};

JP.Tile.Tile.prototype.Colour = function()
{
  if (this.colour === null)
    return null;

  if (this.calcColour === undefined)
  {
    var min = null;
    var max = null;
    for (var i = JP.World.Generation.tiles.length - 1; i >= 0; i--)
    {
      var setting = JP.World.Generation.tiles[i];

      if (setting.tile !== this.name)
        continue;

      min = setting.minHeight || 0;
      max = setting.maxHeight || 100;
      break;
    }

    // for each tile above min, add COLOURINC
    var col = parseInt(this.colour.substr(1), 16);
    var diff = this.data.height - min;
    var COLOURINC = 1;
    var r = ((((col >> 16) & 0xFF) + (COLOURINC * diff)) & 0xFF) << 16;
    var g = ((((col >> 8) & 0xFF) + (COLOURINC * diff)) & 0xFF) << 8;
    var b = ((((col >> 0) & 0xFF) + (COLOURINC * diff)) & 0xFF) << 0;
    this.calcColour = r + g + b;
    /*
    var half = (max - min) / 2 + min;
    // now interpolate
    if (this.data.height > half)
      min = half;
    else
      max = half;

    var i = Interpolate(min, max, this.data.height);
    */
  }
  return "#" + this.calcColour.toString(16);
}

JP.Tile.Tile.prototype.Draw = function(x, y, xoffset, yoffset)
{
  var col = this.Colour();
  if (col !== null)
  {
    JP.context.fillStyle = this.col;
    JP.context.fillRect(
      (x - xoffset) * JP.zoomLevel,
      (y - yoffset) * JP.zoomLevel,
      JP.zoomLevel,
      JP.zoomLevel
    );
  }
  if (this.img !== null)
  {
    JP.context.drawImage(this.img,
      (x - xoffset) * JP.zoomLevel,
      (y - yoffset) * JP.zoomLevel,
      JP.zoomLevel,
      JP.zoomLevel
    );
  }
};

JP.Tile.Tile.prototype.IsPassable = function()
{
  if (this.swimmable === true)
    return JP.player.canSwim;
  if (this.climbable === true)
    return JP.player.CanClimb();

  return true;
};
