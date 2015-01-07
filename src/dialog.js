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
  this.actions = [];      // JP.Dialog.Action*
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

  // options
  if (data.options !== undefined && data.options !== null)
    this.options = data.options;

  // requirements
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

  // actions
  if (data.actions !== undefined && data.actions !== null)
  {
    var dacts = data.actions;
    for (var i = dacts.length - 1; i >= 0; i--)
    {
      var dact = dacts[i];
      if (dact.giveItem !== undefined || dact.takeItem !== undefined)
      {
        var quant = dact.quant * (dact.takeItem === undefined ? 1 : -1);
        var act = new JP.Dialog.ActionItem(dact.giveItem, quant);
        this.actions.push(act);
        continue;
      }
      if (dact.giveGold !== undefined || dact.takeGold !== undefined)
      {
        var amount = dact.giveGold || -dact.takeGold;
        var act = new JP.Dialog.ActionItem(amount);
        this.actions.push(act);
        continue;
      }
      if (dact.setStat !== undefined)
      {
        var act = new JP.Dialog.ActionStat(dact.setStat, dact.value);
        this.actions.push(act);
        continue;
      }
      if (dact.quest !== undefined)
      {
        var act = new JP.Dialog.ActionQuest(dact.quest, dact.section || null, dact.start === true ? 0 : 1);
        this.actions.push(act);
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

JP.Dialog.prototype.DoActions = function()
{
  for (var i = this.actions.length - 1; i >= 0; i--)
    this.actions[i].DoAction();
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


// ACTIONS
JP.Dialog.ActionItem = function(item, quant)
{
  this.item = item;
  this.quant = quant || 1;
};
JP.Dialog.ActionItem.prototype.DoAction = function()
{
  if (this.quant < 0 && JP.player.ItemQuant(this.item) < -this.quant)
    return false; // they don't have enough to take
  JP.player.ItemDelta(this.item, this.quant);
  return true;
};

JP.Dialog.ActionGold = function(amount)
{
  this.amount = amount;
};
JP.Dialog.ActionGold.prototype.DoAction = function()
{
  if (JP.player.gold < -this.amount) // they don't have enough to take
    return false;
  JP.player.GoldDelta(this.amount);
  return true;
};

JP.Dialog.ActionStat = function(stat, value)
{
  this.stat = stat;
  this.value = value;
};
JP.Dialog.ActionStat.prototype.DoAction = function()
{
  JP.player[this.stat] = this.value;
};

JP.Dialog.ActionQuest = function(quest, section, state)
{
  this.quest = quest;
  this.section = section || null;
  this.state = state || -1;
};
JP.Dialog.ActionQuest.prototype.DoAction = function()
{
  var q = JP.Quest.Find(this.quest);
  if (q === null)
    return;

  if (this.state === 0)
    q.Accept();
  else if (this.state === 1)
    q.Complete();
  else
    q.SetSection(this.section);
};
