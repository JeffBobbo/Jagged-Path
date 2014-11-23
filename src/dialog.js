/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Dialog = JP.Dialog || {};

JP.Dialog.registry = {};

JP.Dialog.Load = function(data)
{
  var dia = data;
  JP.Dialog.Register(dia);
};

JP.Dialog.Register = function(dialog)
{
  if (JP.Dialog.registry[dialog.codename] === undefined)
    JP.Dialog.registry[dialog.codename] = dialog;
  else
    alert(dialog.codename + " used more than once for dialogs");
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
}