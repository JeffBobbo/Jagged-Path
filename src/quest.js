/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

/*

  Quest system
  quests have requirements and rewards.
  quests are split up into sections.
  quests are given by dialog.
  sections have dialog tied to them

*/

JP.Quest = JP.Quest || {};

JP.Quest.registry = [];

JP.Quest.Status = {
  UNSTARTED:  0,
  INPROGRESS: 1,
  COMPLETE:   2
};

JP.Quest.Load = function(src)
{
  if (src === undefined || src === null)
    return;

  var quest = new JP.Quest();
  quest.LoadData(src); // load data
  JP.Quest.Register(quest); // reg
};

JP.Quest.Register = function(quest)
{
  if (JP.Quest.registry[quest.name] === undefined)
    JP.Quest.registry[quest.name] = quest;
  else
    throw quest.name + " used more than once for quest codename";
};

JP.Quest.Find = function(codename)
{
  var quest = JP.Quest.registry[codename];
  return quest || null;
};


JP.Quest = function()
{
  this.codename = "";
  this.fullname = "";
  this.description = "";

  this.requirements = []; // JP.Quest.Requiment*
  this.sections     = []; // JP.Quest.Section
  this.rewards      = []; // JP.Quest.Reward*
};

JP.Quest.prototype.LoadData = function(data)
{
  if (data === undefined || data === null)
    return;

  this.codename = data.codename;
  this.fullname = data.fullname;
  this.description = data.description;

  var sections = data.sections;
  var keys = Object.keys(sections);
  for (var i = keys.length - 1; i >= 0; i--)
  {
    var section = new JP.Quest.Section();
    section.LoadData(keys[i], sections[keys[i]]);
  }
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


// REQUIREMENTS
JP.Quest.RequirementQuest = function(quest, status)
{
  this.codename = quest;
  this.status = status;
};

JP.Quest.RequirementQuest.prototype.Satisfied = function()
{
  return JP.Quest.Find(this.quest).GetStatus() === this.status;
};


// SECTION
JP.Quest.Section = function()
{
  this.name = "";
  this.goals = [];
};

JP.Quest.Section.prototype.LoadData = function(name, section)
{
  this.name = name;

  var keys = Object.keys(section);
  for (var i = keys.length - 1; i >= 0; i--)
  {
    if (keys[i] === "goals")
    {
      var goals = Object.keys(section[keys[i]]);
      for (var j = goals.length - 1; j >= 0; j--)
      {
        var goal = section[keys[i][goals[j]];
        switch(goals[j])
        {
          case "item":
            this.goals.push(new JP.Quest.Section.GoalItem(goal.name, goal.quant, goal.target));
          break;
        }
      }
    }
  }
};

JP.Quest.Section.prototype.Satisfied = function()
{
  for (var i = this.goals.length - 1; i >= 0; i--)
  {
    if (this.goals[i].Satisfied() === false)
      return false;
  }
  return true;
};

// GOALS
JP.Quest.Section.GoalItem = function(item, quant, target)
{
  this.item = item;
  this.quant = quant || 1;
  this.target = target || null; // null means just get the item
};

JP.Quest.Section.GoalItem.prototype.Satisfied = function()
{
  var count = JP.player.ItemQuant(this.item);

  if (count >= this.quant)
    return true;
  return false;
};

