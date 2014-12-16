/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.DB = JP.DB || {};

JP.DB.db = null;

var req = indexedDB.open("JaggedPath");
req.onerror = function(event)
{
  console.error(event.target.errorCode);
  alert(event.target.errorCode);
};
req.onsuccess = function(event)
{
  JP.DB.db = event.target.result;
};
req.onupgradeneeded = function(event)
{
  var db = event.target.result;

  var store = db.createObjectStore("name", {keyPath: "myKey"});
}