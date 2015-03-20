/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.DB = JP.DB || {};

JP.DB.db = new Dexie("TestDB3");

JP.DB.db.version(1).stores({
  player: '[fName+sName]'
});

JP.DB.db.open().catch(function(e) {
  console.log(e);
});


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
  JP.DB.db.player.where('[fName+sName]').equals([fName, sName]).delete();
}