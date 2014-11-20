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

JP.Convo = JP.Convo || {};
JP.Convo.registry = {};

JP.Convo.Load = function(data)
{
  var convo = data;
  JP.Convo.Register(convo);
};

JP.Convo.Register = function(convo)
{
  if (JP.Convo.registry[convo.codename] === undefined)
    JP.Convo.registry[convo.codename] = convo;
  else
    alert(convo.codename + " used more than once for convo");
};
