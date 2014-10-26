/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Skills = JP.Skills || {};

// this was never finished, not sure if there's a better way of doing skills atm

JP.Skills.Skill = {
  max: 10,
  actionXP: 200,   // how much xp you get per action
  toolType: JP.Item.Class.NO_CLASS;
  powerBonus: 0.05, // for tools/action
};

JP.Skills.Woodcutting = JP.Skills.Skill;
JP.Skills.Woodcutting.actionXP = 25; // average 10 trees per level
JP.Skills.Woodcutting.toolType = JP.Item.Class.AXE;

JP.Skills.Swimming = JP.Skills.Skill;
JP.Skills.Swimming.actionXP = 100; // per square
