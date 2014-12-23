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
  this.colourMin = null;
  this.colourMax = null;
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
  if (this.name === "Invalid") // invalid tiles are always black
    return "#000000";

  if (this.calcColour === undefined)
  {
    if (this.colourMin == null || this.colourMax == null)
    {
      this.calcColour = this.colour;
      return this.calcColour;
    }

    var min = null;
    var max = null;
    for (var i = JP.World.Generation.tiles.length - 1; i >= 0; i--)
    {
      var setting = JP.World.Generation.tiles[i];

      if (setting.tile !== this.name)
        continue;

      min = setting.minHeight || -100;
      max = setting.maxHeight || 100;
      break;
    }



    var colMin = parseInt(this.colourMin.substr(1), 16);
    var colMax = parseInt(this.colourMax.substr(1), 16);

    var lR = ((colMin >> 16) & 0xFF);
    var hR = ((colMax >> 16) & 0xFF);
    var lG = ((colMin >>  8) & 0xFF);
    var hG = ((colMax >>  8) & 0xFF);
    var lB = ((colMin >>  0) & 0xFF);
    var hB = ((colMax >>  0) & 0xFF);

    var heightP = (this.data.height - min) / (max - min);

    var r = Interpolate(lR, hR, heightP) << 16;
    var g = Interpolate(lG, hG, heightP) <<  8;
    var b = Interpolate(lB, hB, heightP) <<  0;
    this.calcColour = r + g + b;

    /*
    if (this.data.height > 5)
      return "#FF0000";
    if (this.data.height < -5)
      return "#0000FF";
    var r = ((this.data.height + 5) / 10 * 0x7F + 0x7F) << 16;
    var g = ((this.data.height + 5) / 10 * 0x7F + 0x7F) <<  8;
    var b = ((this.data.height + 5) / 10 * 0x7F + 0x7F) <<  0;
    this.calcColour = r + g + b;
    */

    // clean it up for use
    this.calcColour = this.calcColour.toString(16);
    while (this.calcColour.length < 6)
      this.calcColour = "0" + this.calcColour;
    this.calcColour = "#" + this.calcColour;
  }
  return this.calcColour;
}

JP.Tile.Tile.prototype.Draw = function(x, y, xoffset, yoffset)
{
  var col = this.Colour();
  if (col !== null)
  {
    JP.context.fillStyle = col;
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
