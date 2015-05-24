/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.World = function()
{
  this.terrain  = null;
  this.entities = null;
  this.spawners = null;
  this.mapData  = null;
  this.generationLevel = 0;
};

JP.World.Generation = {
  entities: [],
  spawnlist: [],
  tileset: []
};

JP.World.prototype.Save = function()
{
  var savePerRun = 100; // ents
/*  if (full === true)
  {
    var x = 0;
    while (this.mapData[x] !== undefined)
    {
      localStorage.setItem("JP.World.mapData." + x, LZString.compressToUTF16(JSON.stringify(this.mapData[x])));
      x++;
    }

    localStorage.setItem("JP.World.entities", JSON.parse(this.entities));
    localStorage.setItem("JP.World.Saved", "true");
    return;
  }*/

  if (localStorage.getItem("JP.World.Saved") === "true")
  {
    return true;
    // no idea what to do for saving ents
    if (JP.World.prototype.Save.ent === undefined)
      JP.World.prototype.Save.ent = 0;
    else
      JP.World.prototype.Save.ent += savePerRun;

    var ent = JP.World.prototype.Save.ent;
    var a = [];
    for (var i = 0; i < ent+savePerRun; i++)
    {
      if (i >= this.entities.length)
      {
        JP.World.prototype.Save.ent = 0;
        return;
      }
      // uhh?
    };
  }
  else
  {
    if (JP.World.prototype.Save.x === undefined)
      JP.World.prototype.Save.x = 0;
    else
      JP.World.prototype.Save.x++;

    var x = JP.World.prototype.Save.x;

    if (x === this.mapData.length)
    {
      localStorage.setItem("JP.WorldSize", JSON.stringify({x: JP.world.mapData.length, y: JP.world.mapData[0].length}));
      localStorage.setItem("JP.World.Saved", "true");
      return true;
    }
    for (var y = this.mapData[x].length - 1; y >= 0; y--)
      delete this.mapData[x][y].processed;

    if (useDB === true)
      JP.DB.SaveWorldX(x);
    else
      localStorage.setItem("JP.World.mapData." + x, LZString.compressToUTF16(JSON.stringify(this.mapData[x])));

    return x / this.mapData.length;
  }
};

JP.World.prototype.Load = function()
{
  if (localStorage.getItem("JP.World.Saved") === null)
    return false;
  if (useDB === false && localStorage.getItem("JP.World.mapData.0") === null)
  {
    console.error("'JP.World.Saved' wasn't null but no mapData found to load.");
    return false; // if we return here something bad is happening
  }

  if (JP.World.prototype.Load.x === undefined)
  {
    JP.World.prototype.Load.x = 0;
  }
  var x = JP.World.prototype.Load.x++;

  if (JP.World.prototype.Load.max === undefined)
  {
    var max = JSON.parse(localStorage.getItem("JP.WorldSize")).x;
    JP.World.prototype.Load.max = max - 1;
  }
  if (useDB === true)
  {
    JP.DB.LoadWorldX(x);
  }
  else
  {
    var arr = localStorage.getItem("JP.World.mapData." + x);
    if (arr !== null)
    {
      arr = JSON.parse(LZString.decompressFromUTF16(arr));
      this.mapData[x] = arr;
      return x / JP.World.prototype.Load.max;
    }
  }
  // need to do entity loading
  this.generationLevel = JP.World.Gen.TILING;
  return true;
};

JP.World.prototype.Delete = function()
{
  if (useDB)
  {
    JP.DB.DeleteWorld();
  }
  else
  {
    var x = 0;
    while (localStorage.getItem("JP.World.mapData." + x) !== null)
      localStorage.removeItem("JP.World.mapData." + x++)
  }
  localStorage.removeItem("JP.World.Saved");
}

JP.World.Gen = JP.World.Gen || {};

JP.World.Gen.NONE      = 0;
JP.World.Gen.LOAD      = 1;
JP.World.Gen.RADIAL    = 2;
JP.World.Gen.HEIGHT    = 3;
JP.World.Gen.HEAT      = 4;
JP.World.Gen.MOISTURE  = 5;
JP.World.Gen.FILTER    = 6;
JP.World.Gen.TILING    = 7;
JP.World.Gen.FEATURE   = 8;
JP.World.Gen.PLACEMENT = 9;
JP.World.Gen.SAVING    = 10;
JP.World.Gen.DONE      = 11;

JP.World.PERLINDIV = 200;

JP.World.prototype.GenerationTasks = function()
{
  var ret;
  var str;
  var target = Math.floor(1000 / 60);
  var start = getTime(); // using getTime instead JP.getTickCount due to FPS issues
  while (getTime() - start < target && ret !== true) // keep going until estimated frame time is up, or stage is done
  {
    switch (this.generationLevel)
    {
      case JP.World.Gen.NONE:
        str = "Creating World";
        ret = this.CreateMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.LOAD:
        str = "Loading World Data";
        ret = this.Load();
        if (ret === false)
        {
          this.generationLevel = JP.World.Gen.RADIAL;
        }
        else if (ret === true)
        {
          this.generationLevel = JP.World.Gen.TILING;
        }
      break;
      case JP.World.Gen.RADIAL:
        ret = true;
        this.generationLevel++;
        /*
        str = "Creating Radial Map";
        ret = this.CreateRadialMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
        */
      break;
      case JP.World.Gen.HEIGHT:
        str = "Creating Height Map";
        ret = this.CreateHeightMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.HEAT:
        str = "Creating Heat Map";
        ret = this.CreateHeatMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.MOISTURE:
        str = "Creating Moisture Map";
        ret = this.CreateMoistureMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.FILTER:
        str = "Filtering Map";
        ret = this.FilterMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.TILING:
        str = "Tiling Map";
        ret = this.TileMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.FEATURE:
        str = "Adding Map Features";
        ret = this.FeatureMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.PLACEMENT:
        str = "Placing Entities";
        ret = this.EntityMap();
        if (ret === true)
        {
          this.generationLevel++;
        }
      break;
      case JP.World.Gen.SAVING:
        str = "Saving the World";
        ret = this.Save();
        if (ret === true)
        {
          this.generationLevel++;
          JP.needDraw = true;
        }
      break;
    }
  }
  if (ret !== true)
  {
    document.getElementById('loadingTitle').textContent = str;
    document.getElementById('loadingDetail').textContent = (ret * 100).toFixed(0) + '%';
    document.getElementById('loadingExtra').textContent = 'Please Wait';
  }
};

JP.World.prototype.CreateMap = function()
{
  if (JP.World.prototype.CreateMap.x === undefined)
  {
    JP.World.prototype.CreateMap.x = 0;
    this.terrain = [];
    this.mapData = []; // this stores data while we generate the map
    this.tmpData = []; // this stores raw data
    this.entities = [];
    this.spawners = [];
  }

  var x = JP.World.prototype.CreateMap.x++;

  if (x === JP.WIDTH)
    return true; // return true when we're done

  this.terrain[x] = [];
  this.mapData[x] = [];
  this.tmpData[x] = [];
  for (var y = 0; y < JP.HEIGHT; ++y)
  {
    this.terrain[x][y] = {};
    this.mapData[x][y] = {};
    this.tmpData[x][y] = {};
  }

  return x / JP.WIDTH;
};


JP.World.prototype.CreateRadialMap = function()
{
  if (JP.World.prototype.CreateRadialMap.x === undefined)
    JP.World.prototype.CreateRadialMap.x = 0;

  var x = JP.World.prototype.CreateRadialMap.x++;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  for (var y = 0; y < this.tmpData[x].length; ++y)
    this.tmpData[x][y].radius = randIntRange(1, 5);

  return x / this.tmpData.length;
};

JP.World.prototype.CreateHeightMap = function()
{
  if (JP.World.prototype.CreateHeightMap.x === undefined)
  {
    JP.World.prototype.CreateHeightMap.x = 0;
    //JP.World.prototype.CreateHeightMap.noise = new Noise(4, 2, 4, 3, 5, -Math.PI, Math.PI, -Math.PI, Math.PI);
    noise.seed(Math.random());
  }

  var x = JP.World.prototype.CreateHeightMap.x++;
  var pn = JP.World.prototype.CreateHeightMap.noise;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  for (var y = 0; y < this.tmpData[x].length; ++y)
  {
    var xp = x / this.tmpData.length
    var yp = y / this.tmpData[0].length; // normalize
    var size = 2;  // pick a scaling value
    this.tmpData[x][y].height = noise.perlin2(xp*size, yp*size) * 100;
    //this.tmpData[x][y].height = pn.Value(x, y) * 5;
    //this.tmpData[x][y].height = PerlinNoise.noise(xp * size, yp * size, 0.5) * 100;
  }
  return x / this.tmpData.length;
};

JP.World.prototype.CreateHeatMap = function()
{
  if (JP.World.prototype.CreateHeatMap.x === undefined)
  {
    JP.World.prototype.CreateHeatMap.x = 0;
    JP.World.prototype.CreateHeatMap.belt = randRange(2 / 5, 3 / 5); // equator
  }

  var x = JP.World.prototype.CreateHeatMap.x++;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  var hotSpotBelt = JP.World.prototype.CreateHeatMap.belt;
  var DIST_MOD = 2; // change this changes how fat the belt is

  for (var y = 0; y < this.tmpData[x].length; ++y)
  {
    var p = y / this.tmpData[x].length; // position as a fraction comparable to hotSpotBelt
    var dist = 1 - ((Math.abs(hotSpotBelt - p) * randRange(0.75, 1.25)) * DIST_MOD); // distance from the equator
    var heat = Bound(0, 100, dist * 100);
    this.tmpData[x][y].heat = heat;
  }
  return x / this.tmpData.length;
};

JP.World.prototype.CreateMoistureMap = function()
{
  if (JP.World.prototype.CreateMoistureMap.x === undefined)
  {
    JP.World.prototype.CreateMoistureMap.x = 0;
    noise.seed(Math.random());
  }

  var x = JP.World.prototype.CreateMoistureMap.x++;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  for (var y = 0; y < this.tmpData[x].length; ++y)
  {
    var xp = x / this.tmpData.length
    var yp = y / this.tmpData[0].length; // normalize
    var size = 3;  // pick a scaling value
    this.tmpData[x][y].moisture = noise.perlin2(xp*size, yp*size) * 100;
    //this.tmpData[x][y].moisture = pn.Value(x, y) * 5;
    //this.tmpData[x][y].moisture = PerlinNoise.noise(xp * size, yp * size, 0.5) * 100;
  }
  return x / this.tmpData.length;
};

JP.World.prototype.FilterMap = function()
{
  if (JP.World.prototype.FilterMap.x === undefined)
    JP.World.prototype.FilterMap.x = 0;

  var x = JP.World.prototype.FilterMap.x++;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  for (var y = 0; y < this.tmpData[x].length; ++y)
  {
    var radius = 5;// this means a kernel size of 11*11
    var filter = JP.Gaussian.getFilter(radius);
    var x0 = x - (radius - 1);
    var y0 = y - (radius - 1);

    var height = 0;
    var heat = 0;
    var moisture = 0;
    for (var rx = 0; rx < (radius << 1) + 1; ++rx)
    {
      for (var ry = 0; ry < (radius << 1) + 1; ++ry)
      {
        var tx = x0 + rx;
        var ty = y0 + ry;
        // if we go off the side, bounce back the other way
        if (tx < 0)
          tx *= -1;
        if (ty < 0)
          ty *= -1;
        if (tx >= JP.WIDTH)
          tx = JP.WIDTH - (tx - JP.WIDTH) - 1;
        if (ty >= JP.HEIGHT)
          ty = JP.HEIGHT - (ty - JP.HEIGHT) - 1;

        height   += this.tmpData[tx][ty].height   * filter[rx][ry];
        heat     += this.tmpData[tx][ty].heat     * filter[rx][ry];
        moisture += this.tmpData[tx][ty].moisture * filter[rx][ry];
      }
    }
    this.mapData[x][y].height   = (height).toFixed(3);
    //this.mapData[x][y].height   = Math.floor(this.tmpData[x][y].height);
    this.mapData[x][y].heat     = Math.floor(heat);
    this.mapData[x][y].moisture = Math.floor(moisture);
    //this.mapData[x][y].moisture = Math.floor(this.tmpData[x][y].moisture);
  }
  return x / this.tmpData.length;
};

JP.World.prototype.TileMap = function()
{
  if (JP.World.prototype.TileMap.x === undefined)
    JP.World.prototype.TileMap.x = 0;

  var x = JP.World.prototype.TileMap.x++;

  if (x === this.mapData.length)
    return true; // return true when we're done

  for (var y = 0; y < this.mapData[x].length; ++y)
  {
    var height = this.mapData[x][y].height;
    var heat = this.mapData[x][y].heat;
    var moisture = this.mapData[x][y].moisture;
    var tile = null;

    var possibleTiles = [];
    for (var i = JP.World.Generation.tileset.length - 1; i >= 0; i--)
    {
      // data about where one particular tile should appear
      var setting = JP.World.Generation.tileset[i];

      // note, using two instead of three comparison to cover null and undefined
      if (setting.minHeight != null && height < setting.minHeight)
        continue;
      if (setting.maxHeight != null && height >= setting.maxHeight)
        continue;
      if (setting.minHeat != null && heat < setting.minHeat)
        continue;
      if (setting.maxHeat != null && heat >= setting.maxHeat)
        continue;
      if (setting.minMoisture != null && moisture < setting.minMoisture)
        continue;
      if (setting.maxMoisture != null && moisture >= setting.maxMoisture)
        continue;
      possibleTiles.push(setting.tile);
    }
    if (possibleTiles.length > 0)
      tile = possibleTiles[randIntRange(0, possibleTiles.length-1)];
    this.terrain[x][y] = (tile === null ? JP.Tile.Create("Invalid", x, y) : JP.Tile.Create(tile, x, y));
  }
  return x / this.mapData.length;
};


JP.World.prototype.FeatureMap = function()
{
  var prog = 1.0;

  var ret = this.AddRivers();
  if (ret !== true)
    prog *= ret;

  ret = this.SpawnerMap();
  if (ret !== true)
    prog *= ret;

  if (prog === 1)
    return true;
  return prog;
};

JP.World.prototype.AddRivers = function()
{
  if (JP.World.prototype.AddRivers.numRivers === undefined)
  {
    JP.World.prototype.AddRivers.i = 0; // progress tracking

    // find out if we need to make new river points
    JP.World.prototype.AddRivers.points = [];
    var needToMake = true;
    for (var x = this.mapData.length - 1; x >= 0 && needToMake === true; x--)
    {
      for (var y = this.mapData[x].length - 1; y >= 0 && needToMake === true; y--)
      {
        if (this.mapData[x][y].river === true)
          needToMake = false;
      }
    }

    // if we didn't find any, lets make some
    if (needToMake === true)
    {
      var num = randIntRange(24, 36);
      for (var n = num - 1; n >= 0; n--)
      {
        while (true)
        {
          var x = randIntRange(0, this.terrain.length - 1);
          var y = randIntRange(0, this.terrain[0].length - 1);

          var name = this.terrain[x][y].name;
          if (name === "Sea" || name === "Snow" || name === "Ice" || name === "Desert")
            continue;

          JP.World.prototype.AddRivers.points.push({x: x, y: y});
          break;
        }

      }
    }
    JP.World.prototype.AddRivers.numRivers = JP.World.prototype.AddRivers.points.length; // progress tracking
  }


  if (JP.World.prototype.AddRivers.i < JP.World.prototype.AddRivers.numRivers)
  {
    var i = JP.World.prototype.AddRivers.i++;

    var point = JP.World.prototype.AddRivers.points[i];

    var cpos = {x: point.x, y: point.y};
    var river = [];
    for (var j = 0; j < 1; ++j)
    {
      while (true)
      {
        river.push(cpos); // push this onto the river
        this.mapData[cpos.x][cpos.y].processed = true;
        /*
        var next = null;
        var possibleNext = [];
        */
        var weightedNext = new JP.WeightedList();
        for (var x = -1; x <= 1; x++)
        {
          for (var y = -1; y <= 1; y++)
          {
            if (x * y !== 0 || (x === 0 && y === 0)) // skip edges and middle
              continue;

            if (cpos.x + x >= this.mapData.length || cpos.x + x < 0)
              break;
            if (cpos.y + y >= this.mapData[0].length || cpos.y + y < 0)
              break;

            var tile = this.terrain[cpos.x + x][cpos.y + y];
            if (tile.name === "Sea" || tile.name === "Ice") // if we're next to sea or ice, stop
              break;
            if (tile.name === "River") // skip river tiles, allows for contribs
              break;
            var sdata = this.mapData[cpos.x][cpos.y];
            var ddata = this.mapData[cpos.x + x][cpos.y + y];

            if (ddata.processed === true)
              continue;

            /*
            if (j === 0 ? ddata.height > sdata.height : ddata.height < sdata.height)
              next = {x: cpos.x + x, y: cpos.y + y};
            if (ddata.processed !== true && ddata.height === sdata.height)
              possibleNext.push({x: cpos.x + x, y: cpos.y + y});
            */

            var deltaHeight = (sdata.height - ddata.height);
            if (j === 0 && deltaHeight <= 0)
              weightedNext.Insert({x: cpos.x + x, y: cpos.y + y}, deltaHeight * -1 + 1) // make weights positive and non-zero
            if (j === 1 && deltaHeight >= 0)
              weightedNext.Insert({x: cpos.x + x, y: cpos.y + y}, deltaHeight + 1) // make weights non-zero
          }
        }
        /*
        if (next !== null)
          cpos = next;
        else if (possibleNext.length > 0)
          cpos = possibleNext[randIntRange(0, possibleNext.length - 1)];
        */
        if (weightedNext.Size() > 0)
          cpos = weightedNext.ChooseRandom();
        else
          break;
      }
    }

    // river is now a list of coords for our river
    river.sort(function(a, b) {
      if (a.height > b.height)
        return 1;
      if (a.height < b.height)
        return -1;
      return 0;
    });

    // river is now sorted from low to high height
    var truncate = randIntRange(10, 20);
    river.splice(river.length - truncate, Infinity); // remove truncate off the end

    // mark the tiles as river
    for (var k = river.length - 1; k >= 0; k--)
    {
      var pos = river[k];
      this.mapData[pos.x][pos.y].river = true;
    }
  }

  // if there's more to do return a progress
  if (i < JP.World.prototype.AddRivers.numRivers)
    return i / JP.World.prototype.AddRivers.numRivers;

  // otherwise, set all tiles to be river
  for (var x = this.mapData.length - 1; x >= 0; x--)
  {
    for (var y = this.mapData[x].length - 1; y >= 0; y--)
    {
      if (this.mapData[x][y].river === true)
        this.terrain[x][y] = JP.Tile.Create("River", x, y);
    }
  }
  return true; // and we're done
};

JP.World.prototype.SpawnerMap = function()
{
  if (JP.World.prototype.SpawnerMap.i === undefined)
    JP.World.prototype.SpawnerMap.i = 0;

  var i = JP.World.prototype.SpawnerMap.i++;

  var spawnList = JP.World.Generation.spawnlist;

  if (i >= spawnList.length)
    return true;

  var spawnLocations = [];
  var spawncfg = spawnList[i];

  var tiles = spawncfg.tiles;
  for (var x = this.mapData.length - 1; x >= 0; x--)
  {
    for (var y = this.mapData[x].length - 1; y >= 0; y--)
    {
      for (var j = tiles.length - 1; j >= 0; j--) {
        if (tiles[j] === this.terrain[x][y].name)
          spawnLocations.push({x: x, y: y});
      }
    }
  }
  var spawnsToMake = Math.min(spawnLocations.length, (spawncfg.quant > 0 ? spawncfg.quant : Math.floor(spawnLocations.length * spawncfg.quantfrac)));
  while (--spawnsToMake > 0)
  {
    var r = randIntRange(0, spawnLocations.length - 1);
    var spawn = JP.Spawn.Create(spawncfg.name, spawnLocations[r].x, spawnLocations[r].y);
    spawnLocations.splice(r, 1); // remote it from the list
    if (spawncfg.override != null)
    {
      var keys = Object.keys(spawncfg.override);
      for (var j = keys.length - 1; j >= 0; j--)
        spawn[keys[j]] = spawncfg.override[keys[j]];
    }

    JP.world.spawners.unshift(spawn);
  }
  JP.world.spawners.sort(function(a, b) { // sort spawners afterwards
    return a.id - b.id;
  });
  return i / spawnLocations.length;
}

JP.World.prototype.EntityMap = function()
{
  if (JP.World.prototype.EntityMap.x === undefined)
    JP.World.prototype.EntityMap.x = 0;

  var x = JP.World.prototype.EntityMap.x++;

  if (x === this.mapData.length)
  {
    JP.player.Place();
    return true; // return true when we're done
  }

  for (var y = 0; y < this.mapData[x].length; ++y)
  {
    var possibleEntities = [];
    for (var i = JP.World.Generation.entities.length - 1; i >= 0; i--)
    {
      var setting = JP.World.Generation.entities[i];
      var tiles = Object.keys(setting.tiles);
      for (var j = tiles.length - 1; j >= 0; j--)
      {
        if (tiles[j] === this.terrain[x][y].name && setting.tiles[tiles[j]] >= Math.random())
          possibleEntities.push(setting.entity);
      }
    }
    if (possibleEntities.length > 0)
      this.entities.push(JP.Entity.Create(possibleEntities[randIntRange(0, possibleEntities.length - 1)], x, y));
  }
  return x / this.mapData.length;
};

JP.World.prototype.Prerender = function()
{
  var xoffset = JP.player.relx - ((JP.canvas.width / JP.zoomLevel) / 2);
  var yoffset = JP.player.rely - ((JP.canvas.height / JP.zoomLevel) / 2);
  // set offsets to stay inside the map
  xoffset = Bound(0, this.terrain.length    - (JP.canvas.width / JP.zoomLevel), xoffset);
  yoffset = Bound(0, this.terrain[0].length - (JP.canvas.height / JP.zoomLevel), yoffset);
  var xmax = JP.canvas.width  / JP.zoomLevel + xoffset;
  var ymax = JP.canvas.height / JP.zoomLevel + yoffset;
  if (xmax > this.terrain.length)
  {
    xmax = this.terrain.length;
    xoffset = JP.canvas.width / JP.zoomLevel;
  }
  if (ymax > this.terrain.length)
  {
    ymax = this.terrain[xoffset].length;
    yoffset = JP.canvas.height / JP.zoomLevel;
  }
  for (var x = xoffset | 0; x < xmax; ++x)
  {
    for (var y = yoffset | 0; y < ymax; ++y)
    {
//      this.terrain[x][y].Draw(x, y, xoffset, yoffset);
      var tile = this.terrain[x][y];
      var col = tile.Colour();
      if (tile.img === null)
      {
        var group = 1;
        while ((y + group) < ymax && col === this.terrain[x][y+group].Colour())
          group++;
        JP.tcontext.fillStyle = col;
        JP.tcontext.fillRect(
          (x - xoffset) * JP.zoomLevel,
          (y - yoffset) * JP.zoomLevel,
          JP.zoomLevel,
          JP.zoomLevel * group
        );
        if (group > 1)
          y += group - 1;
      }
      else
      {
        if (col !== null)
        {
          JP.tcontext.fillStyle = col;
          JP.tcontext.fillRect(
            (x - xoffset) * JP.zoomLevel,
            (y - yoffset) * JP.zoomLevel,
            JP.zoomLevel,
            JP.zoomLevel
          );
        }
        JP.tcontext.drawImage(tile.img,
          (x - xoffset) * JP.zoomLevel,
          (y - yoffset) * JP.zoomLevel
        );
      }
    }
  }
};

JP.World.prototype.Draw = function()
{
  // draw terrain
  var xoffset = JP.player.relx - ((JP.canvas.width / JP.zoomLevel) / 2);
  var yoffset = JP.player.rely - ((JP.canvas.height / JP.zoomLevel) / 2);
  // set offsets to stay inside the map
  xoffset = Bound(0, JP.WIDTH  - (JP.canvas.width / JP.zoomLevel), xoffset);
  yoffset = Bound(0, JP.HEIGHT - (JP.canvas.height / JP.zoomLevel), yoffset);
  var xmax = JP.canvas.width / JP.zoomLevel + xoffset;
  var ymax = JP.canvas.height / JP.zoomLevel + yoffset;

  JP.context.drawImage(JP.tcanvas, 0, 0);
  // prerender ents
  for (var i = this.entities.length - 1; i >= 0; i--)
    this.entities[i].Draw(xoffset, yoffset);

  // draw player
  var mx = (JP.MouseState.vx - JP.zoomLevel / 2) / JP.zoomLevel;
  var my = (JP.MouseState.vy - JP.zoomLevel / 2) / JP.zoomLevel;

  if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.ARCADE)
  {
    var img = null;
    switch (JP.player.direction)
    {
      case JP.Keys.W:
        img = JP.player.imgUp;
      break;
      case JP.Keys.A:
        img = JP.player.imgLeft;
      break;
      case JP.Keys.D:
        img = JP.player.imgRight;
      break;
      case JP.Keys.S:
      default:
        img = JP.player.imgDown;
      break;
    }
    JP.context.drawImage(img,
      (JP.player.relx - xoffset) * JP.zoomLevel,
      (JP.player.rely - yoffset) * JP.zoomLevel,
      JP.zoomLevel,
      JP.zoomLevel
    );
  }
  else
  {
    if (JP.Option.Get("controlStyle") === JP.Option.ControlStyle.FPS)
      JP.player.direction = JP.atan(((JP.player.relx - xoffset) - mx), ((JP.player.rely - yoffset) - my));

    JP.context.translate((JP.player.relx - xoffset) * JP.zoomLevel + JP.zoomLevel / 2, (JP.player.rely - yoffset) * JP.zoomLevel + JP.zoomLevel / 2);
    JP.context.rotate(JP.player.direction);
    JP.context.drawImage(JP.player.img, -(JP.zoomLevel / 2), -(JP.zoomLevel / 2), JP.zoomLevel, JP.zoomLevel);
    JP.context.rotate(-(JP.player.direction));
    JP.context.translate(-((JP.player.relx - xoffset) * JP.zoomLevel + JP.zoomLevel / 2), -((JP.player.rely - yoffset) * JP.zoomLevel + JP.zoomLevel / 2));
  }
};
