var JP = JP || {};

var chunkSize = 16;

var mt = new MT(5);
var hNoise = new SimplexNoise(new MT(mt.random()));
var tNoise = new SimplexNoise(new MT(mt.random()));
var mNoise = new SimplexNoise(new MT(mt.random()));

var XRATIO = 920; // world width/height ratios
var YRATIO = 480;
var sz = 2;   // scaling factor

JP.GenerateChunk = function(x0, y0)
{
  // create the chunk 2d array
  var terrain = new Array(chunkSize);
  for (var x = 0; x < chunkSize; ++x)
  {
    terrain[x] = new Array(chunkSize);
  }

  for (var x = 0; x < chunkSize; ++x)
  {
    for (var y = 0; y < chunkSize; ++y)
    {
      // fill mapData
      var xp = (x0+x) / 200
      var yp = (y0+y) / 200
      var mapData = {};
      mapData.height   = hNoise.noise(xp * sz, yp * sz) * 100;
      mapData.heat     = tNoise.noise(xp * sz, yp * sz) * 100;
      mapData.moisture = mNoise.noise(xp * sz, yp * sz) * 100;

      // fill tiles
      var tile = null;
      var possibleTile = [];
      for (var i = JP.World.Generation.tileset.length - 1; i >= 0; i--)
      {
        var setting = JP.World.Generation.tileset[i];

        if (setting.minHeight != null && mapData.height < setting.minHeight)
          continue;
        if (setting.maxHeight != null && mapData.height >= setting.maxHeight)
          continue;
        if (setting.minHeat != null && mapData.heat < setting.minHeat)
          continue;
        if (setting.maxHeat != null && mapData.heat >= setting.maxHeat)
          continue;
        if (setting.minMoisture != null && mapData.moisture < setting.minMoisture)
          continue;
        if (setting.maxMoisture != null && mapData.moisture >= setting.maxMoisture)
          continue;
        possibleTile.push(setting.tile);
      }
      if (possibleTile.length > 0)
        tile = possibleTile[mt.randRange(0, possibleTile.length-1)];
      terrain[x][y] = JP.Tile.Create(tile === null ? "Invalid" : tile, mapData)
    }
  }
  return terrain;
};
