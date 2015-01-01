/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Dialog = function()
{
  this.codename = "";
  this.message = "";

  this.options = {};

  this.requirements = []; // JP.Dialog.Requirement*
  this.rewards = [];      // JP.Dialog.Reward*
}

JP.Dialog.registry = {};

JP.Dialog.Load = function(src)
{
  if (src === undefined || src === null)
    return;

  var dialog = new JP.Dialog();
  dialog.LoadData(src);
  JP.Dialog.Register(dialog);
};

JP.Dialog.Register = function(dialog)
{
  if (JP.Dialog.registry[dialog.codename] === undefined)
    JP.Dialog.registry[dialog.codename] = dialog;
  else
    alert(dialog.codename + " used more than once for dialogs");
};

JP.Dialog.Find = function(codename)
{
  return JP.Dialog.registry[codename] || null;
};

JP.Dialog.prototype.LoadData = function(data)
{
  this.codename = data.codename;
  this.message = data.message;

  // refactor this
  if (data.options !== undefined && data.options !== null)
    this.options = data.options;

  if (data.requirements !== undefined && data.requirements !== null)
  {
    var dreqs = data.requirements; // save some typing
    for (var i = dreqs.length - 1; i >= 0; i--)
    {
      var dreq = dreqs[i];
      if (dreq.itemType !== undefined)
      {
        var req = new JP.Dialog.RequirementType(dreq.itemType, dreq.itemQuantMin, dreq.itemQuantMax);
        this.requirements.push(req);
        continue;
      }
      if (dreq.itemName !== undefined)
      {
        var req = new JP.Dialog.RequirementItem(dreq.itemName, dreq.itemQuantMin, dreq.itemQuantMax);
        this.requirements.push(req);
        continue;
      }

      if (dreq.gold !== undefined)
      {
        var req = new JP.Dialog.RequirementGold(dreq.min, dreq.max);
        this.requirements.push(req);
        continue;
      }

      if (dreq.playerStat !== undefined)
      {
        var req = new JP.Dialog.RequirementStat(dreq.stat, dreq.value);
        this.requirements.push(req);
        continue;
      }
    }
  }
};

JP.Dialog.prototype.Satisfied = function()
{
  if (this.requirements.length === 0)
    return true;

  for (var i = this.requirements.length - 1; i >= 0; i--)
  {
    if (this.requirements[i].Satisfied() === false)
      return false;
  }
  return true;
};


JP.Dialog.Get = function(dialog)
{
  var dialog = JP.Dialog.registry[dialog];

  if (dialog === undefined)
    return null;

  // check for requirements
  var reqs = dialog.requirements;
  if (reqs !== undefined)
  {
    for (var i = reqs.length - 1; i >= 0; i--)
    {
      var req = reqs[i];
      if (req.itemType !== undefined)
      {
        if (InRange(req.itemQuantMin, req.itemQuantMax, JP.player.ItemQuantOfClass(JP.Item.Class[req.itemType])) === false)
          return null;
      }
      if (req.itemName !== undefined)
      {
        if (InRange(req.itemQuantMin, req.itemQuantMax, JP.player.ItemQuant(req.itemName)) === false)
          return null;
      }
      if (req.goldMin !== undefined || req.goldMax !== undefined)
      {
        if (InRange(req.goldMin, req.goldMax, JP.player.gold) === false)
          return null;
      }
      if (req.playerStat !== undefined)
      {
        var keys = Object.keys(req.playerStat);
        for (var i = keys.length - 1; i >= 0; i--)
        {
          if (JP.player[keys[i]] !== req.playerStat[keys[i]])
            return null; 
        }
      }
    }
  }
  return dialog;
};

// REQUIREMENTS
JP.Dialog.RequirementType = function(itemClass, min, max)
{
  this.itemClass = itemClass;
  this.min = min || -Infinity;
  this.max = max ||  Infinity;
};
JP.Dialog.RequirementType.prototype.Satisfied = function()
{
  return InRange(this.min, this.max, JP.player.ItemQuantOfClass(this.itemClass));
};

JP.Dialog.RequirementItem = function(item, min, max)
{
  this.item = item;
  this.min = min || -Infinity;
  this.max = max ||  Infinity;
};
JP.Dialog.RequirementItem.prototype.Satisfied = function()
{
  return InRange(this.min, this.max, JP.player.ItemQuant(this.item));
};

JP.Dialog.RequirementGold = function(gold, min, max)
{
  this.min = min || -Infinity;
  this.max = max ||  Infinity;
};
JP.Dialog.RequirementGold.prototype.Satisfied = function()
{
  return InRange(this.min, this.max, JP.player.gold);
};

JP.Dialog.RequirementStat = function(stat, value)
{
  this.stat = stat;
  this.value = value;
};
JP.Dialog.RequirementStat.prototype.Satisfied = function()
{
  return JP.player[this.stat] === value;
};
