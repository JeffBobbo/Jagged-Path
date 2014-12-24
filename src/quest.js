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
  COMPLETE:   2
};

JP.Quest.Load = function(src)
{
  // src should be JSON data to parse into our quest structure
  if (src === undefined || src === null)
    return;

  var q = new JP.Quest();
  q.LoadData(src);

  JP.Quest.list.push(q);
};

JP.Quest = function()
{
  this.codename = "";
  this.fullname = "";
  this.description = "";

  this.requirements = [];
  this.goals        = [];
  this.rewards      = [];
};

JP.Quest.prototype.LoadData = function(data)
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
      return JP.Quest.list[i];
  }
  return null;
};

JP.Quest.prototype.GetStatus = function()
{
  // find the quest in the player list
  for (var i = JP.player.quests.length - 1; i >= 0; --i)
  {
    if (this.codename === JP.player.quests[i].codename)
      return JP.player.quests[i].status; // and return
  }
  return JP.Quest.Status.UNSTARTED; // if we didn't find it, it's not started
};

JP.Quest.prototype.SetStatus = function(status)
{
  var data = null;
  for (var i = JP.player.quests.length - 1; i >= 0; i--)
  {
    if (JP.player.quests[i].codename === this.codename)
    {
      data = JP.player.quests[i];
      break;
    }
  }
  if (data === null)
  {
    if (status === JP.Quest.Status.INPROGRESS)
      data = JP.player.quests.push({codename: this.codename, status: status, start: JP.getTickCount()});
  }
  else
  {
    data.status = status;
    if (status === JP.Quest.Status.COMPLETE)
      data.end = JP.getTickCount();
  }
}


JP.Quest.prototype.CanAccept = function()
{
  var status = this.GetStatus();
  if (status !== JP.Quest.Status.UNSTARTED)
    return false; // already doing it, or have done it

  if (this.requirements !== null)
  {
    var keys = Object.keys(this.requirements);
    for (var i = keys.length - 1; i >= 0; --i)
    {
      var key = keys[i];
      var a = this.requirements[key];
      switch (key)
      {
        case "questcomplete":
          for (var i = a.length - 1; i >= 0; i--)
          {
            if (JP.Quest.Find(a[i]).GetStatus() !== JP.Quest.Status.COMPLETE)
              return false;
          }
        break;
      }
    }
  }
  // if we're here, must be good
  return true;
};

JP.Quest.prototype.Accept = function()
{
  if (this.CanAccept() === false)
    return false;

  // otherwise, add it in
  this.SetStatus(JP.Quest.Status.INPROGRESS, JP.getTickCount());
};

JP.Quest.prototype.Update = function()
{
  var status = this.GetStatus();
  // check goals
  var goalsMet = true;
  if (this.goals !== null)
  {
    var keys = Object.keys(this.goals);
    for (var i = keys.length - 1; i >= 0; --i)
    {
      var key = keys[i];
      var a = this.goals[key];
      switch (key)
      {
        case "item":
          for (var i = a.length - 1; i >= 0; i--)
          {
            if (JP.player.ItemQuant(a[i].name) < a[i].quant)
              goalsMet = false;
          }
        break;
      }
      if (goalsMet === false) // no point continuing
        break;
    }
  }
  if (goalsMet === true && status === JP.Quest.Status.INPROGRESS)
  {
    this.SetStatus(JP.Quest.Status.COMPLETE);
    new JP.Logger.LogItem(this.fullname + " - All goals met").Post();
  }
  if (goalsMet === false && status === JP.Quest.Status.COMPLETE)
  {
    this.SetStatus(JP.Quest.Status.INPROGRESS);
    new JP.Logger.LogItem(this.fullname + " - Goals no longer met").Post();
  }
};