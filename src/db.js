/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.DB = JP.DB || {};

JP.DB.db = new Dexie("TestDB5");

JP.DB.db.version(1).stores({
  player: '[fName+sName]',
  mapData: '[x+y]'
});

JP.DB.db.open().catch(function(e) {
  console.log(e);
});

JP.DB.SaveWorldX = function(x)
{
  for (var y = JP.world.mapData[x].length - 1; y >= 0; y--)
  {
    var data = JP.world.mapData[x][y];
    data.x = x;
    data.y = y;
    JP.DB.db.mapData.put(data).then(function(){console.log("done")}).catch(function(e){console.log(e)});
  }
};

JP.DB.LoadWorldX = function(x)
{
  var size = JSON.parse(localStorage.getItem("JP.WorldSize"));
  for (var y = size.y - 1; y >= 0; y--)
  {
    JP.DB.db.mapData.where('[x+y]').equals([x, y]).first(function(data){
      console.log(data);
      JP.world.mapData[x][y] = data;
    });
  }
};

JP.DB.DeleteWorld = function()
{
  JP.DB.db.mapData.clear();
}

JP.DB.SavePlayer = function()
{
  var o = {};
  for (var i = JP.player.saveKeys.length - 1; i >= 0; --i)
  {
    var key = JP.player.saveKeys[i];
    o[key] = JP.player[key];
  }
  o.inventory = JP.player.inventory;

  JP.DB.db.player.put(o);
};

JP.DB.LoadPlayer = function(fName, sName)
{
  JP.DB.db.player.where('[fName+sName]').equals([fName, sName]).first(function(player){
    if (player == null)
      return;
    var invent = player.inventory;
    player.inventory = undefined;
    JP.player.merge(player);

    var keys = Object.keys(invent);
    for (var i = keys.length - 1; i >= 0; --i)
      JP.player.ItemDelta(keys[i], invent[keys[i]], true, false);
  });

  JP.player.ItemUpdate();
  JP.player.GoldUpdate();

  JP.player.posx = Math.floor(JP.player.relx);
  JP.player.poxy = Math.floor(JP.player.rely);
};

JP.DB.DeletePlayer = function(fName, sName)
{
  JP.DB.db.player.clear();
}
