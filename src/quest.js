/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Quest = JP.Quest || {};

JP.Quest.list = [];

JP.Quest.Status = {
  UNKNOWN:   -1,
  UNSTARTED:  0,
  INPROGRESS: 1,
  COMPLETE:   2,
  FINISHED:   3
};

JP.Quest.Create = function(src)
{
  // src should be JSON data to parse into our quest structure
  if (src === undefined || src === null || src.length === 0)
    return;

  var o = undefined;
  if (typeof(src) === "string")
    o = JSON.parse(src);
  else
    o = src;
  if (o === undefined || o === null)
    return;

  var q = new JP.Quest.Quest();
  q.LoadData(o);

  JP.Quest.list.push(q);
};

JP.Quest.Quest = function()
{
  this.codename = "";
  this.fullname = "";
  this.description = "";

  this.requirements = [];
  this.goals        = [];
  this.rewards      = [];
};

JP.Quest.Quest.prototype.LoadData = function(data)
{
  if (data === undefined || data === null)
    return;

  this.codename = data.codename;
  this.fullname = data.fullname;
  this.description = data.description;

  this.requirements = data.requirements;
  this.goals = data.goals;
  this.rewards = data.rewards;
};

JP.Quest.Find = function(codename)
{
  for (var i = JP.Quest.list.length - 1; i >= 0; --i)
  {
    if (JP.Quest.list[i].codename === codename)
      return i;
  }
  return -1;
};

JP.Quest.Quest.prototype.CanAccept = function()
{
  if (this.Status() !== JP.Quest.Quest.Status.UNSTARTED)
    return false; // already on it

  if (this.requirements === null)
    return true;

  var keys = Object.keys(this.requirements);
  for (var i = keys.length - 1; i >= 0; --i)
  {
    var key = this.requirements[i];
    switch (key)
    {
      case "questcomplete":
        if (this.Status() !== JP.Quest.Quest.Status.FINISHED)
          return false;
      break;
    }
  }

  // if we're here, must be good
  return true;
};
JP.Quest.CanAccept = function(quest)
{
  return (JP.Quest.list[quest].CanAccept());
};


JP.Quest.Quest.prototype.GetStatus = function()
{
  for (var i = JP.player.quests.length - 1; i >= 0; --i)
  {
    if (this.codename === JP.player.quests[i].codename)
      return JP.player.quests[i].status;
  }
  return JP.Quest.Quest.Status.UNKNOWN;
}
JP.Quest.GetStatus = function(quest)
{
  return (JP.Quest.list[quest].GetStatus());
};