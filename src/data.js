/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Data = JP.Data || {};

JP.Data.filesReq = 0; // how many files we've requested
JP.Data.filesRec = 0; // and how many we've got back

JP.Data.Request = function(url, listcb, filecb)
{
  if (url === undefined || url === null || url.length === 0)
    return null;

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function()
  {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
    {
      JP.Data.filesRec++;
      listcb(JSON.parse(xmlhttp.responseText), filecb);
    }
  }
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  JP.Data.filesReq++;
};

JP.Data.Load = function()
{
  JP.Data.Request("data/tile.json", JP.Data.LoadTileFile);
  JP.Data.Request("data/worldGen.json", JP.Data.LoadWorldGen);
  JP.Data.Request("data/itemIndex.json", JP.Data.LoadListFile, JP.Data.LoadItemFile);
  JP.Data.Request("data/questIndex.json", JP.Data.LoadListFile, JP.Data.LoadQuestFile);
  JP.Data.Request("data/entityIndex.json", JP.Data.LoadListFile, JP.Data.LoadEntityFile);
};

JP.Data.LoadWorldGen = function(data)
{
  JP.World.generationSettings = data;
};

JP.Data.LoadTileFile = function(data)
{
  for (var i = data.length - 1; i >= 0; i--)
    JP.Tile.Load(data[i]);
};

JP.Data.LoadListFile = function(list, callback)
{
  if (list === undefined || list === null)
    return;
  
  for (var i = list.length - 1; i >= 0; i--)
    JP.Data.Request("data/" + list[i], callback);  
};

JP.Data.LoadItemFile = function(data)
{
  if (data === undefined || data === null)
    return;

  for (var i = data.length - 1; i >= 0; i--)
    JP.Item.Load(data[i]);
};

JP.Data.LoadQuestFile = function(data)
{
  if (data === undefined || data === null)
      return;

  for (var i = data.length - 1; i >= 0; i--)
    JP.Quest.Load(data[i]);
};

JP.Data.LoadEntityFile = function(data)
{
  if (data === undefined || data === null)
    return;

//  for (var i = list.length - 1; i >= 0; i--)
//    JP.Entity.Create(data[i]);
};
