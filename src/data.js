/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Data = JP.Data || {};

JP.Data.filesReq = 0; // how many files we've requested
JP.Data.filesRec = 0; // and how many we've got back

JP.Data.Request = function(url, listcb, filecb, path)
{
  path = path || "";
  if (url === undefined || url === null || url.length === 0)
    return null;

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function()
  {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
    {
      JP.Data.filesRec++;
      listcb(JSON.parse(xmlhttp.responseText), filecb, path);
    }
  }
  xmlhttp.open("GET", "data/" + path + url, true);
  xmlhttp.send();
  JP.Data.filesReq++;
};

JP.Data.Load = function()
{
  JP.Data.Request("tile.json", JP.Data.LoadTileFile);
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadItemFile, "items/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadEntityFile, "entities/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadQuestFile, "quests/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadDialogsFile, "dialogs/");
  JP.Data.RequestWorldGen();
};

JP.Data.RequestWorldGen = function(worldType)
{
  worldType = worldType || "normal";
  JP.Data.Request("generation/" + worldType + "_tiles.json", JP.Data.LoadWorldGen, "tiles", "");
  JP.Data.Request("generation/" + worldType + "_entities.json", JP.Data.LoadWorldGen, "entities", "");
};
JP.Data.LoadWorldGen = function(data, which)
{
  if (which === "tiles")
    JP.World.Generation.tiles = data;
  else
    JP.World.Generation.entities = data;
};

JP.Data.LoadListFile = function(list, callback, path)
{
  if (list === undefined || list === null)
    return;
  path = path || "";
  
  for (var i = list.length - 1; i >= 0; i--)
    JP.Data.Request(path + "/" + list[i], callback);  
};

JP.Data.LoadTileFile = function(data)
{
  for (var i = data.length - 1; i >= 0; i--)
    JP.Tile.Load(data[i]);
};

JP.Data.LoadItemFile = function(data)
{
  if (data === undefined || data === null)
    return;

  for (var i = data.length - 1; i >= 0; i--)
    JP.Item.Load(data[i]);
};

JP.Data.LoadEntityFile = function(data)
{
  if (data === undefined || data === null)
    return;

  for (var i = data.length - 1; i >= 0; i--)
    JP.Entity.Load(data[i]);
};

JP.Data.LoadQuestFile = function(data)
{
  if (data === undefined || data === null)
      return;

  for (var i = data.length - 1; i >= 0; i--)
    JP.Quest.Load(data[i]);
};

JP.Data.LoadDialogsFile = function(data)
{
  if (data === undefined || data === null)
      return;

  for (var i = data.length - 1; i >= 0; i--)
    JP.Dialog.Load(data[i]);
};
