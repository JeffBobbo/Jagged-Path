/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Data = JP.Data || {};

JP.Data.Request = function(url, callback)
{
  if (url === undefined || url === null || url.length === 0)
    return null;
  if (callback === undefined || callback === null)
    return null;

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function()
  {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
      callback(JSON.parse(xmlhttp.responseText));
  }
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
};

JP.Data.Load = function()
{
  JP.Data.Request("data/itemIndex.json", JP.Data.LoadItems);
  JP.Data.Request("data/questIndex.json", JP.Data.LoadQuests);
};

JP.Data.LoadItems = function(fileList)
{
  if (fileList === undefined || fileList === null)
    return;
  
  for (var i = 0; i < fileList.length; ++i)
    JP.Data.Request("data/items/" + fileList[i], JP.Data.LoadItemFile);
};

JP.Data.LoadItemFile = function(data)
{
  if (data === undefined || data === null)
    return;

  for (var i = 0; i < data.length; ++i)
    JP.Item.Load(data[i]);
};

JP.Data.LoadQuests = function(fileList)
{
  if (fileList === undefined || fileList === null)
    return;

  for (var i = 0; i < fileList.length; ++i)
    JP.Data.Request("data/quests/" + fileList[i], JP.Data.LoadQuestFile);
};

JP.Data.LoadQuestFile = function(data)
{
  if (data === undefined || data === null)
    return;

  for (var i = 0; i < data.length; ++i)
    JP.Quest.Load(data[i]);
}