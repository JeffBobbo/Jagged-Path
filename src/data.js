/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

/**
 * @namespace
 */
JP.Data = JP.Data || {};

/**
 * Number of files that have been requested using {@link JP.Data.Request}
 * @type {Number}
 */
JP.Data.filesReq = 0; // how many files we've requested
/**
 * Number of files that been received from {@link JP.Data.Request}
 * @type {Number}
 */
JP.Data.filesRec = 0; // and how many we've got back

/**
 * Request a file ("data/" + path + file) from the server
 * @param {string} file     - file name
 * @param {Function} listcb - callback to process data in the form of function(json, filecb, path)
 * @param {Function} filecb - callback to process data from listcb in the form of function(json)
 * @param {string} path     - for the file
 */
JP.Data.Request = function(file, listcb, filecb, path)
{
  path = path || "";
  if (file === undefined || file === null || file.length === 0)
    return null;

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function()
  {
    if (xmlhttp.readyState === 4)
    {
      if (xmlhttp.status === 200)
      {
        JP.Data.filesRec++;
        listcb(JSON.parse(xmlhttp.responseText), filecb, path);
      }
      else
      {
        console.error("Couldn't retrieve file");
        alert("File retrieval failed, please try again");
        location.reload();
      }
    }
  }
  xmlhttp.open("GET", "data/" + path + file, true);
  xmlhttp.send();
  JP.Data.filesReq++;
};

/**
 * Convenience function to request everything.
 */
JP.Data.Load = function()
{
  JP.Data.Request("tile.json", JP.Data.LoadTileFile);
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadItemFile, "items/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadEntityFile, "entities/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadQuestFile, "quests/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadDialogsFile, "dialogs/");
  JP.Data.Request("index.json", JP.Data.LoadListFile, JP.Data.LoadSpawnerFile, "spawners/");
  JP.Data.RequestWorldGen();
};

/**
 * Request world generation data -- These files are handled differently to everything else so they get their own function.
 * @param {string} [worldType="normal"] - The type of world, only one option which is normal currently.
 */
JP.Data.RequestWorldGen = function(worldType)
{
  worldType = worldType || "normal";
  JP.Data.Request("generation/" + worldType + ".json", JP.Data.LoadWorldGen, null, "");
};
/**
 * Callback for {@link JP.Data.RequestWorldGen}.
 * Possibly convert this to one file.
 * @param {json} data
 */
JP.Data.LoadWorldGen = function(data)
{
  JP.Data.Request("generation/" + data.tileset, function(data){JP.World.Generation.tileset = data});
  if (data.entities.length > 0)
    JP.Data.Request("generation/" + data.entities, function(data){JP.World.Generation.entities = data});
  if (data.spawnlist.length > 0)
  JP.Data.Request("generation/" + data.spawnlist, function(data){JP.World.Generation.spawnlist = data});
};

/**
 * A generic function to load a list of files in an array
 * @param {string[]} filelist
 * @param {Function} callback - Function to use to process the data in these files
 * @param {string} path
 */
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

JP.Data.LoadSpawnerFile = function(data)
{
  for (var i = data.length - 1; i >= 0; i--)
    JP.Spawn.Load(data[i]);
}
