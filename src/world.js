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

JP.World.Generation = {};

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
      localStorage.setItem("JP.World.Saved", "true");
      return true;
    }
    localStorage.setItem("JP.World.mapData." + x, LZString.compressToUTF16(JSON.stringify(this.mapData[x])));
    return x / this.mapData.length;
  }
};

JP.World.prototype.Load = function()
{
  if (localStorage.getItem("JP.World.Saved") === null)
    return false;
  if (localStorage.getItem("JP.World.mapData.0") === null)
  {
    console.error("'JP.World.Saved' wasn't null but no mapData found to load.");
    return false; // if we return here something bad is happening
  }

  if (JP.World.prototype.Load.x === undefined)
  {
    JP.World.prototype.Load.x = 0;
    this.terrain = [];
    this.mapData = [];
    this.tmpData = [];
    this.entities = [];
    this.spawners = [];
  }
  var x = JP.World.prototype.Load.x++;

  if (JP.World.prototype.Load.max === undefined)
  {
    var max = 0;
    while (localStorage.getItem("JP.World.mapData." + max++));
    JP.World.prototype.Load.max = max - 1;
  }
  var arr = localStorage.getItem("JP.World.mapData." + x);
  if (arr !== null)
  {
    arr = JSON.parse(LZString.decompressFromUTF16(arr));
    this.terrain[x] = [];
    for (var y = this.terrain.length - 1; y >= 0; y--)
      this.terrain[x][y] = {};
    this.mapData[x] = arr;
    return x / JP.World.prototype.Load.max;
  }
  // need to do entity loading
  this.generationLevel = JP.World.Gen.TILING;
  return true;
};

JP.World.prototype.Delete = function()
{
  var x = 0;
  while (localStorage.getItem("JP.World.mapData." + x) !== null)
    localStorage.removeItem("JP.World.mapData." + x++)
  localStorage.removeItem("JP.World.Saved");
}

JP.World.Gen = JP.World.Gen || {};

JP.World.Gen.NONE      = 0;
JP.World.Gen.RADIAL    = 1;
JP.World.Gen.HEIGHT    = 2;
JP.World.Gen.HEAT      = 3;
JP.World.Gen.MOISTURE  = 4;
JP.World.Gen.FILTER    = 5;
JP.World.Gen.TILING    = 6;
JP.World.Gen.FEATURE   = 7;
JP.World.Gen.PLACEMENT = 8;
JP.World.Gen.SAVING    = 9;
JP.World.Gen.DONE      = 10;

JP.World.PERLINDIV = 200;

JP.World.prototype.GenerationTasks = function()
{
  var ret;
  var str;
  var target = Math.floor(1000 / JP.getFPS());
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
    noise.seed(Math.random());
  }

  var x = JP.World.prototype.CreateHeightMap.x++;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  for (var y = 0; y < this.tmpData[x].length; ++y)
  {
    this.tmpData[x][y].height = noise.perlin2(x/JP.World.PERLINDIV, y/JP.World.PERLINDIV) * 100;
  }
  return x / this.tmpData.length;
};

JP.World.prototype.CreateHeatMap = function()
{
  if (JP.World.prototype.CreateHeatMap.x === undefined)
  {
    JP.World.prototype.CreateHeatMap.x = 0;
    JP.World.prototype.CreateHeatMap.belt = randRange(1 / 3, 2 / 3);
  }

  var x = JP.World.prototype.CreateHeatMap.x++;

  if (x === this.tmpData.length)
    return true; // return true when we're done

  var hotSpotBelt = JP.World.prototype.CreateHeatMap.belt;
    
  for (var y = 0; y < this.tmpData[x].length; ++y)
  {
    var heat = y / this.tmpData[x].length;
    heat = 1 - (Math.abs(hotSpotBelt - heat) * 2);
    heat = Math.max(1.0, heat * randRange(0.5, 2.0) * 100);
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
    this.tmpData[x][y].moisture = noise.perlin2(x/JP.World.PERLINDIV, y/JP.World.PERLINDIV) * 100;
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
    var radius = 3;// this means a kernel size of 7x7
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
    this.mapData[x][y].height   = Math.floor(height);
    this.mapData[x][y].heat     = Math.floor(heat);
    this.mapData[x][y].moisture = Math.floor(moisture);
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
    var tile = undefined;

    var possibleTiles = [];
    for (var i = JP.World.Generation.tiles.length - 1; i >= 0; i--)
    {
      // data about where one particular tile should appear
      var setting = JP.World.Generation.tiles[i];

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
    this.terrain[x][y] = (tile === undefined ? JP.Tile.Create("Invalid") : JP.Tile.Create(tile));
  }
  return x / this.mapData.length;
};


JP.World.prototype.NextRiverNode = function(which, percMin, percMax, moisture)
{
  which = which || 1; // 0 = low, 1 = high
  if (which <= 1)
  {
    var best = null;
    var pos = {x: -1, y: -1};
    for (var x = this.mapData.length - 1; x >= 0; x--)
    {
      for (var y = this.mapData[x].length - 1; y >= 0; y--)
      {
        var tile = this.mapData[x][y];
        if (tile.processed === true)
          continue;
        if (best === null || (which === 1 ? tile.height > best.height : best.height > tile.height))
        {
          best = tile;
          pos.x = x;
          pos.y = y;
        }

      }
    }
    return {data: best, x: pos.x, y: pos.y};
  }
  else if (which === 2) // return any over perc
  {
    var highest = this.NextRiverNode(1).data.height;
    var ret = [];
    for (var x = this.mapData.length - 1; x >= 0; x--)
    {
      for (var y = this.mapData[x].length - 1; y >= 0; y--)
      {
        var tile = this.mapData[x][y];
        if (tile.moisture > moisture && tile.height >= highest * percMin && tile.height <= highest * percMax)
          ret.push({x: x, y: y});
      }
    }
    return ret;
  }
  else
  {
    return null;
  }
};

JP.World.prototype.FeatureMap = function()
{
  return this.AddRivers();

  if (JP.World.prototype.FeatureMap.processedCount === undefined)
  {
    JP.World.prototype.FeatureMap.processedCount = 0;
    JP.World.prototype.FeatureMap.processedTotal = this.terrain.length * this.terrain[0].length;
  }

  var DRAINAGE = 0.75; // how much water drains away on each tile as a percentage of what's there
  var RIVERAMT = 50; // how much water is needed to make a river

  var data = this.NextRiverNode();
  var src = data.data;

  // find lowest adjacent
  var dest;
  var spos = {x: data.x, y: data.y};
  this.mapData[spos.x][spos.y].processed = true;
  JP.World.prototype.FeatureMap.processedCount++;
  var dpos = {x: data.x, y: data.y};
  while(true)
  {
    dest = null;

    for (var x = -1; x <= 1; x++)
    {
      for (var y = -1; y <= 1; y++)
      {
        if (x * y !== 0 || (x === 0 && y === 0)) // skip edges and middle
          continue;

        if (spos.x + x >= this.mapData.length || spos.x + x < 0)
          continue;
        if (spos.y + y >= this.mapData[0].length || spos.y + y < 0)
          continue;

        var tile = this.mapData[spos.x + x][spos.y + y];
        if (dest === null || tile.height < dest.height)
        {
          dest = tile;
          dpos.x += x;
          dpos.y += y;
        }
      }
    }
    if (this.terrain[dpos.x][dpos.y].name === "Sea") // we're at the end of the river
      break;

    if (JP.World.prototype.FeatureMap.processedCount / JP.World.prototype.FeatureMap.processedTotal > 0.1)
      return true;

    var carry = this.mapData[spos.x][spos.y].moisture * (1 - DRAINAGE);
    this.mapData[spos.x][spos.y].moisture *= DRAINAGE;
    this.mapData[dpos.x][dpos.y].moisture += carry;
    this.mapData[dpos.x][dpos.y].processed = true;
    JP.World.prototype.FeatureMap.processedCount++;
    if (this.mapData[dpos.x][dpos.y].moisture > RIVERAMT)
      this.terrain[dpos.x][dpos.y] = JP.Tile.Create("River");
    src = dest;
    spos = dpos;
  }

  var progress = JP.World.prototype.FeatureMap.processedCount / JP.World.prototype.FeatureMap.processedTotal;
  if (progress >= 1)
    return true;
  return progress;
};

JP.World.prototype.AddRivers = function()
{
  if (JP.World.prototype.AddRivers.springs === undefined)
  {
    JP.World.prototype.AddRivers.springs = (this.NextRiverNode(2, 0.85, 0.95, 10)).concat(this.NextRiverNode(2, 0.4, 0.7, 10));
    JP.World.prototype.AddRivers.i = 0;
    JP.World.prototype.AddRivers.numRivers = randIntRange(16, 24);
  }
  if (JP.World.prototype.AddRivers.i++ === JP.World.prototype.AddRivers.numRivers)
    return true; // we done

  // pick the next spring
  var i = randIntRange(0, JP.World.prototype.AddRivers.springs.length - 1);
  var spring = JP.World.prototype.AddRivers.springs[i];


  if (this.terrain[spring.x][spring.y].name === "Sea" || this.terrain[spring.x][spring.y].name === "River") // skip water
    return JP.World.prototype.AddRivers.i-- / JP.World.prototype.AddRivers.numRivers; // decrement i to replace it though


  this.terrain[spring.x][spring.y] = JP.Tile.Create("River"); // turn it into a river
  console.log("Marking (" + spring.x + ", " + spring.y + ") as spring");

  var dest = null;
  var cpos = {x: spring.x, y: spring.y};
  // to the sea
  while(true)
  {
    dest = null;

    for (var x = -1; x <= 1; x++)
    {
      for (var y = -1; y <= 1; y++)
      {
        if (x * y !== 0 || (x === 0 && y === 0)) // skip edges and middle
          continue;

        if (cpos.x + x >= this.mapData.length || cpos.x + x < 0)
        {
          // potentially just stop, as we get funky results
          continue;
        }
        if (cpos.y + y >= this.mapData[0].length || cpos.y + y < 0)
        {
          // potentially just stop, as we get funky results
          continue;
        }

        var tile = this.mapData[cpos.x + x][cpos.y + y];
        if (dest === null || tile.height < dest.height)
        {
          dest = tile;
          cpos.x = cpos.x + x;
          cpos.y = cpos.y + y;
        }
      }
    }
    if (this.terrain[cpos.x][cpos.y].name === "Sea" || this.terrain[cpos.x][cpos.y].name === "River" || this.terrain[cpos.x][cpos.y].name === "Ice") // contributary
      break;
    else
      this.terrain[cpos.x][cpos.y] = JP.Tile.Create("River");
  }

  return JP.World.prototype.AddRivers.i / JP.World.prototype.AddRivers.numRivers;
};

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
      var tile = this.terrain[x][y];
      if (tile.img === null)
      {
        var group = 1;
        while ((y + group) < ymax && tile.colour === this.terrain[x][y+group].colour)
          group++;
        JP.tcontext.fillStyle = tile.colour;
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
        if (tile.colour !== null)
        {
          JP.tcontext.fillStyle = tile.colour;
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
  //console.log("Render took " + (getTime() - start) + "ms");
};
