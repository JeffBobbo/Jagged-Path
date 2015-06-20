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
  this.generationLevel = 0;
};

JP.World.Generation = {
  entities: [],
  spawnlist: [],
  tileset: []
};

JP.World.prototype.Save = function()
{
  localStorage.setItem("JP.Saved", true);
  return true;
};

JP.World.prototype.Load = function()
{
  var seed = localStorage.getItem("JP.World.seed") || getTime();
  this.mt = new MT();
  seed = this.mt.seed(seed); // bit weird, but
  localStorage.setItem("JP.World.seed", seed);
  return true;
};

JP.World.prototype.Delete = function()
{
  var x = 0;
  localStorage.removeItem("JP.Saved");
  localStorage.removeItem("JP.World.seed");
}

JP.World.Gen = JP.World.Gen || {};

JP.World.Gen.NONE      = 0;
JP.World.Gen.LOAD      = 1;
JP.World.Gen.CHUNK     = 2;
JP.World.Gen.FEATURE   = 3;
JP.World.Gen.PLACEMENT = 4;
JP.World.Gen.SAVING    = 5;
JP.World.Gen.DONE      = 6;

JP.World.PERLINDIV = 200;

JP.World.prototype.GenerationTasks = function(x, y)
{
  x = x || 0;
  y = y || 0;

  var ret;
  var str;
  var target = Math.floor(1000 / 60);
  var start = getTime(); // using getTime instead JP.getTickCount due to FPS issues
  var chunks;
  while (getTime() - start < target && ret !== true) // keep going until estimated frame time is up, or stage is done
  {
    switch (this.generationLevel)
    {
      case JP.World.Gen.NONE:
        str = "Creating World";
        ret = this.CreateMap();
        if (ret === true)
          this.generationLevel++;
      break;
      case JP.World.Gen.LOAD:
        str = "Loading World";
        ret = this.Load();
        if (ret === true)
          this.generationLevel++;
      break;
      case JP.World.Gen.CHUNK:
        str = "Creating Chunks";
        ret = this.CreateChunk();
        if (ret === true)
          this.generationLevel++;
      break;
      case JP.World.Gen.FEATURE:
        str = "Adding Map Features";
        ret = this.FeatureMap();
        if (ret === true)
          this.generationLevel++;
      break;
      case JP.World.Gen.PLACEMENT:
        str = "Placing Entities";
        ret = this.EntityMap();
        if (ret === true)
          this.generationLevel++;
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
  this.terrain = [];
  this.entities = [];
  this.spawners = [];

  this.terrain[0] = [];
  return true;
};

JP.World.prototype.CalcChunks = function()
{
  var w = Math.ceil(JP.canvas.width  / JP.zoomLevel);
  var h = Math.ceil(JP.canvas.height / JP.zoomLevel);

  var area = w * h;

  return Math.ceil(area / (chunkSize * chunkSize));
};

JP.World.prototype.CreateChunk = function()
{
  if (JP.World.prototype.CreateChunk.x === undefined)
    JP.World.prototype.CreateChunk.x = 0;

  var x = JP.World.prototype.CreateChunk.x++;

  if (x >= JP.canvas.width / JP.zoomLevel)
    return true;

  var num = (JP.canvas.height / JP.zoomLevel) / chunkSize;
  for (var y = 0; y < num; y++)
  {
    var chunk = JP.GenerateChunk(x * chunkSize, y * chunkSize);
    for (var i = chunk.length - 1; i >= 0; i--)
    {
      for (var j = chunk[i].length - 1; j >= 0; j--)
      {
        if (this.terrain[x * chunkSize + i] === undefined)
          this.terrain[x * chunkSize + i] = [];
        this.terrain[x * chunkSize + i][y * chunkSize + j] = chunk[i][j];
      }
    }
  }
  return ((x / chunkSize) * num) / this.CalcChunks();
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
    for (var x = this.terrain.length - 1; x >= 0 && needToMake === true; x--)
    {
      for (var y = this.terrain[x].length - 1; y >= 0 && needToMake === true; y--)
      {
        if (this.terrain[x][y].data.river === true)
          needToMake = false;
      }
    }

    // if we didn't find any, lets make some
    if (needToMake === true)
    {
      var num = this.mt.randRange(24, 36);
      for (var n = num - 1; n >= 0; n--)
      {
        while (true)
        {
          var x = this.mt.randRange(0, this.terrain.length - 1);
          var y = this.mt.randRange(0, this.terrain[0].length - 1);

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
        this.terrain[cpos.x][cpos.y].data.processed = true;
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

            if (cpos.x + x >= this.terrain.length || cpos.x + x < 0)
              break;
            if (cpos.y + y >= this.terrain[0].length || cpos.y + y < 0)
              break;

            var tile = this.terrain[cpos.x + x][cpos.y + y];
            if (tile.name === "Sea" || tile.name === "Ice") // if we're next to sea or ice, stop
              break;
            if (tile.name === "River") // skip river tiles, allows for contribs
              break;
            var sdata = this.terrain[cpos.x][cpos.y].data;
            var ddata = this.terrain[cpos.x + x][cpos.y + y].data;

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
          cpos = possibleNext[this.mt.randRange(0, possibleNext.length - 1)];
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
    var truncate = this.mt.randRange(10, 20);
    river.splice(river.length - truncate, Infinity); // remove truncate off the end

    // mark the tiles as river
    for (var k = river.length - 1; k >= 0; k--)
    {
      var pos = river[k];
      this.terrain[pos.x][pos.y].data.river = true;
    }
  }

  // if there's more to do return a progress
  if (i < JP.World.prototype.AddRivers.numRivers)
    return i / JP.World.prototype.AddRivers.numRivers;

  // otherwise, set all tiles to be river
  for (var x = this.terrain.length - 1; x >= 0; x--)
  {
    for (var y = this.terrain[x].length - 1; y >= 0; y--)
    {
      if (this.terrain[x][y].data.river === true)
        this.terrain[x][y] = JP.Tile.Create("River", this.terrain[x][y].data);
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
  for (var x = this.terrain.length - 1; x >= 0; x--)
  {
    for (var y = this.terrain[x].length - 1; y >= 0; y--)
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
    var r = this.mt.randRange(0, spawnLocations.length - 1);
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

  if (x === this.terrain.length)
  {
    return true; // return true when we're done
  }

  for (var y = 0; y < this.terrain[x].length; ++y)
  {
    var possibleEntities = [];
    for (var i = JP.World.Generation.entities.length - 1; i >= 0; i--)
    {
      var setting = JP.World.Generation.entities[i];
      var tiles = Object.keys(setting.tiles);
      for (var j = tiles.length - 1; j >= 0; j--)
      {
        if (tiles[j] === this.terrain[x][y].name && setting.tiles[tiles[j]] >= this.mt.random())
          possibleEntities.push(setting.entity);
      }
    }
    if (possibleEntities.length > 0)
      this.entities.push(JP.Entity.Create(possibleEntities[this.mt.randRange(0, possibleEntities.length - 1)], x, y));
  }
  return x / this.terrain.length;
};

JP.World.prototype.Prerender = function()
{
  var xoffset = JP.player.relx - ((JP.canvas.width / JP.zoomLevel) / 2);
  var yoffset = JP.player.rely - ((JP.canvas.height / JP.zoomLevel) / 2);
  var xmax = JP.canvas.width  / JP.zoomLevel + xoffset;
  var ymax = JP.canvas.height / JP.zoomLevel + yoffset;
  for (var x = Math.floor(xoffset); x < xmax; ++x)
  {
    for (var y = Math.floor(yoffset); y < ymax; ++y)
    {
      var tile = this.terrain[x] && this.terrain[x][y] ? this.terrain[x][y] : null;
      if (tile === null)
      {
        JP.tcontext.fillStyle = "#000000";
        JP.tcontext.fillRect(
          (x - xoffset) * JP.zoomLevel,
          (y - yoffset) * JP.zoomLevel,
          JP.zoomLevel,
          JP.zoomLevel
          );
      }
      else
      {
        var col = tile.Colour();
        if (tile.img === null)
        {
          var group = 1;
          while ((y + group) < ymax && this.terrain[x] && this.terrain[x][y+group] && col === this.terrain[x][y+group].Colour())
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
  }
};

JP.World.prototype.Draw = function()
{
  var xoffset = JP.player.relx - ((JP.canvas.width / JP.zoomLevel) / 2);
  var yoffset = JP.player.rely - ((JP.canvas.height / JP.zoomLevel) / 2);
  var xmax = JP.canvas.width  / JP.zoomLevel + xoffset;
  var ymax = JP.canvas.height / JP.zoomLevel + yoffset;

  JP.context.drawImage(JP.tcanvas, 0, 0);
  // render ents
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
