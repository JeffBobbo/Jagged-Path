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
JP.World.Gen.FILTER    = 4;
JP.World.Gen.TILING    = 5;
JP.World.Gen.PLACEMENT = 6;
JP.World.Gen.SAVING    = 7;
JP.World.Gen.DONE      = 8;

JP.World.prototype.GenerationTasks = function()
{
  var ret;
  var str;
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
    this.tmpData[x][y].height = noise.perlin2((x * 4) / this.tmpData.length, (y * 4) / this.tmpData[x].length) * 100;
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

        height += this.tmpData[tx][ty].height * filter[rx][ry];
        heat   += this.tmpData[tx][ty].heat   * filter[rx][ry];
      }
    }
    this.mapData[x][y].height = height;
    this.mapData[x][y].heat = heat;
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
    var tile = undefined;

    var possibleTiles = [];
    for (var i = JP.World.Generation.tiles.length - 1; i >= 0; i--)
    {
      // data about where one particular tile should appear
      var setting = JP.World.Generation.tiles[i];
      if (setting.minHeight !== null && height < setting.minHeight)
        continue;
      if (setting.maxHeight !== null && height >= setting.maxHeight)
        continue;
      if (setting.minHeat !== null && heat < setting.minHeat)
        continue;
      if (setting.maxHeat !== null && heat >= setting.maxHeat)
        continue;
      possibleTiles.push(setting.tile);
    }
    if (possibleTiles.length > 0)
      tile = possibleTiles[randIntRange(0, possibleTiles.length-1)];
    this.terrain[x][y] = (tile === undefined ? JP.Tile.Create("Water") : JP.Tile.Create(tile));
  }
  return x / this.mapData.length;
};

JP.World.prototype.EntityMap = function()
{
  if (JP.World.prototype.EntityMap.x === undefined)
    JP.World.prototype.EntityMap.x = 0;

  var x = JP.World.prototype.EntityMap.x++;
  
  if (x === this.mapData.length)
  {
    JP.player.Place();
    if (this.terrain[JP.player.posx][JP.player.posy].spawnSafe === true)
      this.entities.unshift(JP.Entity.Create("Lumberjack", JP.player.posx, JP.player.posy)); // place a woodsman with the player
    var testSpawn = new JP.SpawnItem("Gold", JP.player.posx+5, JP.player.posy+5);
    testSpawn.boxQuant = 30;
    this.spawners.unshift(testSpawn);
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
  var xoffset = JP.player.relx - ((JP.canvas.width / JP.PIXEL_SIZE) / 2);
  var yoffset = JP.player.rely - ((JP.canvas.height / JP.PIXEL_SIZE) / 2);
  // set offsets to stay inside the map
  xoffset = Bound(0, this.terrain.length    - (JP.canvas.width / JP.PIXEL_SIZE), xoffset);
  yoffset = Bound(0, this.terrain[0].length - (JP.canvas.height / JP.PIXEL_SIZE), yoffset);
  var xmax = JP.canvas.width  / JP.PIXEL_SIZE + xoffset;
  var ymax = JP.canvas.height / JP.PIXEL_SIZE + yoffset;
  if (xmax > this.terrain.length)
  {
    xmax = this.terrain.length;
    xoffset = JP.canvas.width / JP.PIXEL_SIZE;
  }
  if (ymax > this.terrain.length)
  {
    ymax = this.terrain[xoffset].length;
    yoffset = JP.canvas.height / JP.PIXEL_SIZE;
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
          (x - xoffset) * JP.PIXEL_SIZE,
          (y - yoffset) * JP.PIXEL_SIZE,
          JP.PIXEL_SIZE,
          JP.PIXEL_SIZE * group
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
            (x - xoffset) * JP.PIXEL_SIZE,
            (y - yoffset) * JP.PIXEL_SIZE,
            JP.PIXEL_SIZE,
            JP.PIXEL_SIZE
          );
        }
        JP.tcontext.drawImage(tile.img,
          (x - xoffset) * JP.PIXEL_SIZE,
          (y - yoffset) * JP.PIXEL_SIZE
        );
      }
    }
  }
};

JP.World.prototype.Draw = function() 
{
  // draw terrain
  var xoffset = JP.player.relx - ((JP.canvas.width / JP.PIXEL_SIZE) / 2);
  var yoffset = JP.player.rely - ((JP.canvas.height / JP.PIXEL_SIZE) / 2);
  // set offsets to stay inside the map
  xoffset = Bound(0, JP.WIDTH  - (JP.canvas.width / JP.PIXEL_SIZE), xoffset);
  yoffset = Bound(0, JP.HEIGHT - (JP.canvas.height / JP.PIXEL_SIZE), yoffset);
  var xmax = JP.canvas.width / JP.PIXEL_SIZE + xoffset;
  var ymax = JP.canvas.height / JP.PIXEL_SIZE + yoffset;

  JP.context.drawImage(JP.tcanvas, 0, 0);
  // prerender ents
  for (var i = this.entities.length - 1; i >= 0; i--)
    this.entities[i].Draw(xoffset, yoffset);

  // draw player
  var mx = (JP.MouseState.vx - JP.PIXEL_SIZE / 2) / JP.PIXEL_SIZE;
  var my = (JP.MouseState.vy - JP.PIXEL_SIZE / 2) / JP.PIXEL_SIZE;

  if (JP.USE_ARCADE_CONTROLS === true)
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
      (JP.player.relx - xoffset) * JP.PIXEL_SIZE,
      (JP.player.rely - yoffset) * JP.PIXEL_SIZE,
      JP.PIXEL_SIZE,
      JP.PIXEL_SIZE
    );
  }
  else
  {
    JP.player.direction = JP.atan(((JP.player.relx - xoffset) - mx), ((JP.player.rely - yoffset) - my));

    JP.context.translate((JP.player.relx - xoffset) * JP.PIXEL_SIZE + JP.PIXEL_SIZE / 2, (JP.player.rely - yoffset) * JP.PIXEL_SIZE + JP.PIXEL_SIZE / 2);
    JP.context.rotate(JP.player.direction);
    JP.context.drawImage(JP.player.img, -(JP.PIXEL_SIZE / 2), -(JP.PIXEL_SIZE / 2), JP.PIXEL_SIZE, JP.PIXEL_SIZE);
    JP.context.rotate(-(JP.player.direction));
    JP.context.translate(-((JP.player.relx - xoffset) * JP.PIXEL_SIZE + JP.PIXEL_SIZE / 2), -((JP.player.rely - yoffset) * JP.PIXEL_SIZE + JP.PIXEL_SIZE / 2));
  }
  //console.log("Render took " + (getTime() - start) + "ms");
};
