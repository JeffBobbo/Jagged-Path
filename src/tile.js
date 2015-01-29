/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

/**
 * @class
 * @this {JP.Tile}
 * @memberOf JP
 */
JP.Tile = function()
{
  /* @instance */
  this.name = null;
  /* @instance */
  this.colourMin = null;
  /* @instance */
  this.colourMax = null;
  /* @instance */
  this.colour = null;
  /* @instance */
  this.img = null;
  /* @instance */
  this.imgPath = null;
  /* @instance */
  this.spawnSafe = false;
  /* @instance */
  this.swimmable = false;
  /* @instance */
  this.climbable = false;
  /* @instance */
  this.data = null;
};

/**
 * @static
 */
JP.Tile.registry = {};

/**
 * Load tile data and register a tile
 * @function
 * @param {object} data
 */
JP.Tile.Load = function(data)
{
  if (data === undefined || data === null)
    return;

  var tile = {};
  tile.name = data.name;
  tile.data = data;
  JP.Tile.Register(tile);
};

/**
 * Adds a tile to the registry, throws if the tile already exists (indexed by name)
 * @function
 * @param {object} tile
 */
JP.Tile.Register = function(tile)
{
  if (JP.Tile.registry[tile.name] === undefined)
    JP.Tile.registry[tile.name] = tile;
  else
    throw tile.name + " used more than once for tiles";
};

/**
 * Creates a new tile
 * @function
 * @param {string} tileName
 * @param {number} x
 * @param {number} y
 * @returns {JP.Tile} tile
 */
JP.Tile.Create = function(tile, x, y)
{
  var reg = JP.Tile.registry[tile];
  if (reg === undefined)
    return undefined;
  var tile = new JP.Tile();
  tile.merge(reg.data);

  if (x !== undefined && y !== undefined)
    tile.data = JP.world.mapData[x][y];
  return tile;
}

/**
 * Obtains the css-style colour this tile should be rendered as on the map; calculates it if it's not already been calculated
 * @function
 * @returns {string} colour
 */
JP.Tile.prototype.Colour = function()
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
    for (var i = JP.World.Generation.tileset.length - 1; i >= 0; i--)
    {
      var setting = JP.World.Generation.tileset[i];

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

/**
 * Draws the tile
 * @deprecated
 */
JP.Tile.prototype.Draw = function(x, y, xoffset, yoffset)
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

/**
 * Test if the player can walk on this tile
 * @function
 * @returns {boolean}
 */
JP.Tile.prototype.IsPassable = function()
{
  if (this.swimmable === true)
    return JP.player.canSwim;
  if (this.climbable === true)
    return JP.player.CanClimb();

  return true;
};
