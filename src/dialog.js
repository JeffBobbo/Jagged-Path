/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

/**
 * Dialog is used for dialog trees for conversations with NPCs.
 * @class
 * @memberOf {JP}
 */
JP.Dialog = function()
{
  this.codename = "";
  this.message = "";

  this.options = {};

  this.requirements = []; // JP.Dialog.Requirement*
  this.actions = [];      // JP.Dialog.Action*
}

/**
 * Registry of dialogs
 * @type {Object}
 * @static
 * @private
 */
JP.Dialog.registry = {};

/**
 * Creates, loads and registers a dialog
 * @param {Object}
 * @static
 */
JP.Dialog.Load = function(src)
{
  if (src === undefined || src === null)
    return;

  var dialog = new JP.Dialog();
  dialog.LoadData(src);
  JP.Dialog.Register(dialog);
};

/**
 * Adds a dialog to the registry
 * @param {JP.Dialog}
 * @throws {String} If codename already exists
 */
JP.Dialog.Register = function(dialog)
{
  if (JP.Dialog.registry[dialog.codename] === undefined)
    JP.Dialog.registry[dialog.codename] = dialog;
  else
    throw dialog.codename + " used more than once for dialogs";
};

/**
 * Finds a dialog within the reigstry
 * @param {String}
 * @returns {JP.Dialog|null}
 */
JP.Dialog.Find = function(codename)
{
  return JP.Dialog.registry[codename] || null;
};

/**
 * Loads data from JSON object into this
 * @param {Object}
 * @this {JP.Dialog}
 */
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
    var requirements = data.requirements;
    var keys = Object.keys(requirements);
    for (var i = keys.length -1; i >= 0; --i)
    {
      for (var j = requirements[keys[i]].length - 1; j >= 0; j--)
      {
        var req = requirements[keys[i]][j];
        switch (keys[i])
        {
          case "itemtype":
            this.requirements.push(new JP.Dialog.RequirementType(req.type, req.min, req.max));
          break;
          case "item":
            this.requirements.push(new JP.Dialog.RequirementItem(req.item, req.min, req.max));
          break;
          case "gold":
            this.requirements.push(new JP.Dialog.RequirementGold(req.min, req.max));
          break;
          case "playerstat":
            this.requirements.push(new JP.Dialog.RequirementStat(req.stat, req.value));
          break;
          case "quest":
            var status = -1;
            switch (req.status)
            {
              case "completed":
               status = JP.Quest.Status.COMPLETE;
              break;
              case "unstarted":
                status = JP.Quest.Status.UNSTARTED;
              break;
              case "inprogress":
                status = JP.Quest.Status.INPROGRESS;
              break;
              default:
                throw "Uknown quest progress, " + req.status + ", for " + this.codename;
              break;
            }
            this.requirements.push(new JP.Dialog.RequirementQuest(req.codename, req.section, status));
          break;
          default:
            throw "Uknown dialog requirement, " + keys[i] + ", for dialog " + this.codename;
          break;
        }
      }
    }
  }

  // actions
  if (data.actions !== undefined && data.actions !== null)
  {
    var actions = data.actions;
    var keys = Object.keys(actions);
    for (var i = keys.length - 1; i >= 0; i--)
    {
      for (var j = actions[keys[i]].length - 1; j >= 0; j--)
      {
        var act = actions[keys[i]][j];
        switch (keys[i])
        {
          case "giveitem":
            var quant = act.quant;
            this.actions.push(new JP.Dialog.ActionItem(act.item, quant));
            break;
          case "takeitem":
            var quant = -act.quant;
            this.actions.push(new JP.Dialog.ActionItem(act.item, quant));
          break;
          case "givegold":
            this.actions.push(new JP.Dialog.ActionGold(act.amount));
            break;
          case "takegold":
            this.actions.push(new JP.Dialog.ActionGold(-act.amount));
            break;
          case "setstat":
            this.actions.push(new JP.Dialog.ActionStat(act.stat, act.value));
          break;
          case "quest":
            var status = -1;
            switch (act.status)
            {
              case "completed":
                status = JP.Quest.Status.COMPLETE;
              break;
              case "unstarted":
                status = JP.Quest.Status.UNSTARTED;
              break;
              case "inprogress":
                status = JP.Quest.Status.INPROGRESS;
              break;
            }
            this.actions.push(new JP.Dialog.ActionQuest(act.codename, act.section, status));
          break;
        }
      }
    }
  }
};

/**
 * Tests if the player meets all the requirements of the dialog
 * @returns {Boolean}
 * @this {JP.Dialog}
 */
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

/**
 * Convenience action for executing all the actions
 * @this {JP.Dialog}
 */
JP.Dialog.prototype.DoActions = function()
{
  for (var i = this.actions.length - 1; i >= 0; i--)
    this.actions[i].DoAction();
};


// REQUIREMENTS
/**
 * @class Requirement to obtain a certain amount of an item class
 * @param {string} itemClass
 * @param {number} [min=0]
 * @param {number} [max=Infinity]
 * @this {JP.Dialog}
 */
JP.Dialog.RequirementType = function(itemClass, min, max)
{
  this.itemClass = itemClass;
  this.min = (min != null ? min : 0);
  this.max = (max != null ? max : Infinity);
};
/**
 * Test if this condition is satisfied
 * @returns {Boolean}
 * @this {JP.Dialog.RequirementType}
 */
JP.Dialog.RequirementType.prototype.Satisfied = function()
{
  return InRange(this.min, this.max, JP.player.ItemQuantOfClass(this.itemClass));
};

/**
 * @class Requirement to obtain a certain amount of an item
 * @param {string} itemName
 * @param {number} [min=0]
 * @param {number} [max=Infinity]
 * @this {JP.Dialog}
 */
JP.Dialog.RequirementItem = function(item, min, max)
{
  this.item = item;
  this.min = (min != null ? min : 0);
  this.max = (max != null ? max : Infinity);
};
/**
 * Test if this condition is satisfied
 * @returns {Boolean}
 * @this {JP.Dialog.RequirementItem}
 */
JP.Dialog.RequirementItem.prototype.Satisfied = function()
{
  return InRange(this.min, this.max, JP.player.ItemQuant(this.item));
};

/**
 * @class JP.Dialog.RequirementGold
 * @param {number} [min=0]
 * @param {number} [max=Infinity]
 * @this {JP.Dialog.RequirementGold}
 */
JP.Dialog.RequirementGold = function(min, max)
{
  this.min = (min != null ? min : 0);
  this.max = (max != null ? max : Infinity);
};
/**
 * Test if this condition is satisfied
 * @returns {Boolean}
 * @this {JP.Dialog.RequirementGold}
 */
JP.Dialog.RequirementGold.prototype.Satisfied = function()
{
  return InRange(this.min, this.max, JP.player.gold);
};

/**
 * @class Test if the player a particular stat
 * @param {string} stat
 * @param {*} value The value stat must equal, using the === comparison
 */
JP.Dialog.RequirementStat = function(stat, value)
{
  this.stat = stat;
  this.value = value;
};
/**
 * Test if this condition is satisfied
 * @returns {Boolean}
 * @this {JP.Dialog.RequirementStat}
 */
JP.Dialog.RequirementStat.prototype.Satisfied = function()
{
  return JP.player[this.stat] === this.value;
};

/**
 * @class Test if the player has a particular quest progress
 * @param {string} quest
 * @param {String} section
 * @param {JP.Quest.Status} status
 * @this {JP.Dialog.RequirementQuest}
 */
JP.Dialog.RequirementQuest = function(quest, section, status)
{
  this.quest = quest;
  this.section = section === -1 ? null : section;
  this.status = status === undefined ? -1 : status;
};
/**
 * Test if this condition is met
 * @returns {Boolean}
 * @this {JP.Dialog.RequirementQuest}
 */
JP.Dialog.RequirementQuest.prototype.Satisfied = function()
{
  var qp = JP.player.QuestProgress(this.quest);

  if (qp === null)
  {
    if (this.status === JP.Quest.Status.UNSTARTED)
      return true;
    return false;
  }
  if (qp.status === this.status)
    return true;
  if (this.seciton !== null && this.section === qp.section)
    return true;

  return false;
};


// ACTIONS
/**
 * @class Give or take a certain amount of item
 * @param {string} itemname
 * @param {Number} quant - negative numbers to take
 * @this {JP.Dialog.ActionItem}
 */
JP.Dialog.ActionItem = function(item, quant)
{
  this.item = item;
  this.quant = quant || 1;
};
/**
 * Do this action
 * @returns {Boolean} success
 * @this {JP.Dialog.ActionItem}
 */
JP.Dialog.ActionItem.prototype.DoAction = function()
{
  if (this.quant < 0 && JP.player.ItemQuant(this.item) < -this.quant)
    return false; // they don't have enough to take
  JP.player.ItemDelta(this.item, this.quant);
  return true;
};

/**
 * @class Give or take a certain amount of gold
 * @param {Number} amount - negative numbers to take
 * @this {JP.Dialog.ActionGold}
 */
JP.Dialog.ActionGold = function(amount)
{
  this.amount = amount || 1;
};
/**
 * Do this action
 * @returns {Boolean} success
 * @this {JP.Dialog.ActionGold}
 */
JP.Dialog.ActionGold.prototype.DoAction = function()
{
  if (JP.player.gold < -this.amount) // they don't have enough to take
    return false;
  JP.player.GoldDelta(this.amount);
  return true;
};

/**
 * @class Set the player's stat to this value
 * @param {string} stat
 * @param {*} value
 * @this {JP.Dialog.ActionStat}
 */
JP.Dialog.ActionStat = function(stat, value)
{
  this.stat = stat;
  this.value = value;
};
/**
 * Do this action
 * @returns {Boolean} success
 * @this {JP.Dialog.ActionStat}
 */
JP.Dialog.ActionStat.prototype.DoAction = function()
{
  JP.player[this.stat] = this.value;
  return true;
};

/**
 * @class Manipulate the state of a quest -- must be called with section or status -- section overrides status
 * @param {string} quest
 * @param {(string|null)} section
 * @param {JP.Quest.Status|null} status
 * @this {JP.Dialog.ActionQuest}
 */
JP.Dialog.ActionQuest = function(quest, section, status)
{
  this.quest = quest;
  this.section = section || null;
  this.status = (status === undefined ? -1 : status);
};
/**
 * Do this action
 * @returns {Boolean} success
 * @this {JP.Dialog.ActionQuest}
 */
JP.Dialog.ActionQuest.prototype.DoAction = function()
{
  var q = JP.Quest.Find(this.quest);
  if (q === null)
    return false;

  if (this.section !== null)
    return q.SetSection(this.section);
  else if (this.status === JP.Quest.Status.COMPLETE)
    return q.Complete();
  else if (this.status === JP.Quest.Status.INPROGRESS)
    return q.Accept();
};
