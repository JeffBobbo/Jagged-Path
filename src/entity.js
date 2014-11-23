/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Entity = JP.Entity || {};
JP.Entity.ID = 0;

JP.Entity.Type = JP.Entity.Type || {};
JP.Entity.Type.NONE       = 0x00;
//trees
JP.Entity.Type.OAK        = 0x01;
JP.Entity.Type.EVERGREEN  = 0x02;
JP.Entity.Type.TREE       = JP.Entity.Type.OAK + JP.Entity.Type.EVERGREEN;
// npcs
JP.Entity.Type.LUMBERJACK = 0x04;
JP.Entity.Type.NPC        = JP.Entity.Type.LUMBERJACK;
//misc
JP.Entity.Type.FIRE       = 0x08;
JP.Entity.Type.MISC       = JP.Entity.Type.FIRE;

JP.Entity.Type.ITEM       = 0x10;

JP.Entity.registry = {};

JP.Entity.Load = function(data)
{
  if (data === undefined || data === null)
    return;

  var entity = {};
  switch (data.class)
  {
    case "tree":
      entity.cstruct = JP.Entity.Tree;
    break;
    case "npc":
      entity.cstruct = JP.Entity.NPC;
    break;
    default:
      alert("Unkown entity class for " + data.name + ". Class: " + data.class);
    break;  
  }
  entity.name = data.name

  delete data.class;
  entity.data = data;
  JP.Entity.Register(entity);
};

JP.Entity.Register = function(entity)
{  
  if (JP.Entity.registry[entity.name] === undefined)
    JP.Entity.registry[entity.name] = entity;
  else
    alert(entity.name + " used more than once for entities");
};

JP.Entity.Create = function(entity, x, y, lifespan)
{
  var reg = JP.Entity.registry[entity];
  if (reg === undefined)
    throw "No such entity: " + entity;
  var ent = new reg.cstruct(x, y, lifespan);
  ent.merge(reg.data);
  if (reg.data.giveName === true)
  {
    var name = JP.Entity.RandomName(this.gender);
    ent.givenFName = name.first;
    ent.givenSName = name.last;
  }
  return ent;
}

JP.Entity.RandomName = function(s)
{
  var firstNames = [];
  if (s)
    firstNames = [
      "John",
      "Wilberforce",
      "Steven",
      "Albert",
      "Roger",
      "Arthur"
    ];
  else
    firstNames = [
      "Mary",
      "Wendy",
      "Katrina",
      "Susan",
      "Joan"
    ];

  var lastNames = [
    "Melvil",
    "Smith",
    "Richards",
    "Page",
    "Lucas"
  ];

  return {first: firstNames[randIntRange(0, firstNames.length-1)], last: lastNames[randIntRange(0, lastNames.length-1)]};
}


JP.Entity.Entity = function(x, y, lifespan)
{
  this.name = "";
  this.givenFName = "";
  this.givenSName = "";
  this.gender = randTrue(); // 0 female, 1 male
  this.id = JP.Entity.ID++;
  this.img = undefined;
  this.imgPath = undefined;
  this.colour = "#ffffff";
  this.hpMax = 10;
  this.hp = this.hpMax;
  this.canMove = false;
  this.canChop = false;
  this.relx = x || -1;
  this.posx = this.relx | 0;
  this.rely = y || -1;
  this.posy = this.rely | 0;
  this.size = 1.0;
  this.moveGoal = {x: x, y: y, cx: x, cy: y};
  this.timeToLive = JP.getTickCount() + lifespan || -1;

  // dialog stuff
  this.conversation = null;
  this.convoState = null;

  // item drops on death
  // array of objects like: {item, chance};
  this.drops = [];
  this.goldMin = 0;
  this.goldMax = 0;

  this.seppuku = false;
};

JP.Entity.Entity.prototype.SetImage = function(imgPath)
{
  this.imgPath = this.imgPath || imgPath;
  this.img = this.img || new Image();
  this.img.src = 'img/' + this.imgPath;
};

JP.Entity.Entity.prototype.Draw = function(xoffset, yoffset)
{
  if (this.seppuku)
    return;
  if (this.relx < Math.floor(xoffset) || this.relx > JP.canvas.width / JP.PIXEL_SIZE + xoffset)
    return;
  if (this.rely < Math.floor(yoffset) || this.rely > JP.canvas.height / JP.PIXEL_SIZE + yoffset)
    return;
  if (this.imgPath !== undefined)
  {
    if (this.img === undefined)
      this.SetImage();
    JP.context.drawImage(this.img,
      (this.relx - xoffset) * JP.PIXEL_SIZE,
      (this.rely - yoffset) * JP.PIXEL_SIZE,
      Math.floor(JP.PIXEL_SIZE * this.size),
      Math.floor(JP.PIXEL_SIZE * this.size)
    );
  }
  else
  {
    JP.context.fillStyle = this.colour;
    JP.context.fillRect(
      (this.relx - xoffset) * JP.PIXEL_SIZE,
      (this.rely - yoffset) * JP.PIXEL_SIZE,
      JP.PIXEL_SIZE,
      JP.PIXEL_SIZE
    );
  }
};

JP.Entity.Entity.prototype.Impact = function(damage)
{
  this.hp -= damage;
  if (this.hp <= 0)
  {
    this.Death();
    return true;
  }
  return false;
};

JP.Entity.Entity.prototype.Idle = function()
{
  if (this.timeToLive !== -1 && this.timeToLive < JP.getTickCount())
  {
    this.Death();
    return;
  }
};

JP.Entity.Entity.prototype.Death = function(dropLevel)
{
  dropLevel = dropLevel || 1; // 0 = no drops, 1 = direct xfer, 2 = itembox

  if (dropLevel > 0 && this.drops !== undefined && this.drops.length > 0)
  {
    for (var i = this.drops.length - 1; i >= 0; i--)
    {
      if (this.drops[i].chance >= 1.0 || this.drops[i].chance > Math.random())
      {
        if (dropLevel === 2)
        {
          var box = new JP.Entity.ItemBox(this.relx + (Math.random() - 0.5), this.rely + (Math.random() - 0.5));
          box.SetItem(this.drops[i].name, this.drops[i].quant);
          JP.world.entities.push(box);
        }
        else
        {
          JP.player.ItemDelta(this.drops[i].name, this.drops[i].quant);
        }
      }
    }

    if (this.goldMax > 0)
    {
      if (dropLevel === 2)
      {
        var box = new JP.Entity.ItemBox(this.relx + (Math.random() - 0.5), this.rely + (Math.random() - 0.5));
        box.SetGold(randIntRange(this.goldMin, this.goldMax));
      }
      else
      {
        JP.player.DeltaGold(randIntRange(this.goldMin, this.goldMax));
      }
    }
  }

  this.seppuku = true;
//  JP.world.entities.splice(JP.Entity.FindByID(this.id), 1);
  JP.needDraw = true;
};

JP.Entity.Entity.prototype.InRangeOfPlayer = function(range)
{
  range = range || 1;
  if (Distance(JP.player.posx, JP.player.posy, this.posx, this.posy) > range)
    return false;
  return true;
};

JP.Entity.FindByID = function(id)
{
  for (var i = JP.world.entities.length - 1; i >= 0; --i)
  {
    if (JP.world.entities[i].id === id)
      return JP.world.entities[i];
  };
  return null;
};

JP.Entity.FindByPos = function(x, y, type, xtol, ytol)
{
  xtol = xtol || 0.5;
  ytol = ytol || 0.5;
  for (var i = JP.world.entities.length - 1; i >= 0; --i)
  {
    var ent = JP.world.entities[i];
    if (ent.type !== type)
      continue;
    if (InRange(x - xtol, x + xtol, ent.relx) === false)
      continue;
    if (InRange(y - ytol, y + ytol, ent.rely) === false)
      continue;
    return ent;
  };
  return null;
};

JP.Entity.FindAroundPlayer = function(type, range, st, et)
{
  type = type || 0;
  range = range || 1;
  st = st || JP.rad(-60);
  et = et || JP.rad( 60);

  st += JP.player.direction;
  et += JP.player.direction;

  for (var i = JP.world.entities.length - 1; i >= 0; --i)
  {
    var ent = JP.world.entities[i];
    if (type > 0 && (ent.type !== type))
      continue;

    var o = {x: JP.player.relx + 0.5, y: JP.player.rely + 0.5};
    var p = {x: ent.relx + 0.5, y: ent.rely + 0.5};

    if (JP.InsideSegment(o, p, st, et, range) === true)
      return ent;
  };
  return null;
};

JP.Entity.TalkPane = function(ent)
{
  ent = typeof ent === "number" ? JP.Entity.FindByID(ent) : ent;

  var name = document.getElementById("convoName");
  var message = document.getElementById("convoMessage");
  var options = document.getElementById("convoOptions");

  // reset the pane before adding stuff
  name.textContent = "";
  message.textContent = "";
  options.textContent = "";

  var dialog = JP.Dialog.Get(ent.convoState);

  if (ent !== null && dialog !== null)
  {
    var str = ""; // probably a much cleaner way to do this, but cba to think logic atm
    if (ent.givenFName === "" && ent.givenSName === "")
      str = ent.name;
    else if (ent.givenFName === "" && ent.givenSName !== "")
      str = (ent.gender ? "Mr." : "Miss") + ent.givenSName;
    else if (ent.givenFName !== "" && ent.givenSName === "")
      str = ent.givenFName;
    else
      str = ent.givenFName + " " + ent.givenSName;
    name.textContent = str;

    // add the message
    message.textContent = dialog.message;


    // Do transfers which needs to be done for the requirements on the options
    if (dialog.itemTransfer !== undefined)
    {
      for (var i = dialog.itemTransfer.length - 1; i >= 0; i--)
        JP.player.ItemDelta(dialog.itemTransfer[i].itemName, dialog.itemTransfer[i].itemQuant);
    }
    if (dialog.goldTransfer !== undefined)
      JP.player.DeltaGold(dialog.goldTransfer);

    // temporary measure for tweaking player stats until skills are done
    if (dialog.playerStat !== undefined)
    {
      var keys = Object.keys(dialog.playerStat);
      for (var i = keys.length - 1; i >= 0; i--)
        JP.player[keys[i]] = dialog.playerStat[keys[i]];
    }

    // add options
    if (dialog.options !== undefined)
    {
      var keys = Object.keys(dialog.options);
      var len = keys.length;
      for (var i = 0; i < len; ++i)
      {
        if (JP.Dialog.Get(keys[i]) === null) // don't add it if we don't meet the requirements
          continue;
        var opt = document.createElement("a");
        opt.textContent = dialog.options[keys[i]];
        opt.href = "#";
        opt.setAttribute("data-option", keys[i]);
        opt.onclick = function() { JP.Entity.TalkOption(ent.id, this); };
        options.appendChild(opt);
        options.appendChild(document.createElement("br"));
      }
    }
  }
};

JP.Entity.TalkOption = function(ent, opt)
{
  var ent = typeof ent === "number" ? JP.Entity.FindByID(ent) : ent;

  if (ent === null)
    return;
  var dialog = JP.Dialog.registry[opt.getAttribute("data-option")];

  ent.convoState = dialog.codename;
  JP.Entity.TalkPane(ent);
};

JP.Entity.Entity.prototype.Talk = function()
{
  if (this.conversation === undefined)
    return false;

  var dialog = JP.Dialog.Get(this.conversation);

  // we want the conversation to start again if they hit T
//  if (this.convoState !== null)
//    return;

  this.convoState = this.conversation;
  JP.Entity.TalkPane(this);

  return true;
};

JP.Entity.Entity.prototype.Move = function()
{
  this.posx = Math.floor(this.relx);
  this.posy = Math.floor(this.rely);
  return;
};

JP.Entity.Tree = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.TREE;
  this.canChop = true;
  this.hpMax = 5;
  this.imgPath = 'oak.png';
  this.hp = randIntRange(3, 5); // how many hits to farm/kill
  this.drops = [{name: "Oak Log", chance: 1.0}];

  // reposition slightly so trees don't sit uniformly
  this.size = (randIntRange((JP.PIXEL_SIZE >> 1) - 2, (JP.PIXEL_SIZE >> 1) + 2) << 1) / JP.PIXEL_SIZE;
};
JP.Entity.Tree.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.Tree.prototype.constructor = JP.Entity.Tree;

JP.Entity.NPC = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.NPC;
  this.imgPath ='lumberjack.png';
  this.canMove = false;
};
JP.Entity.NPC.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.NPC.prototype.constructor = JP.Entity.NPC;
JP.Entity.NPC.prototype.Move = function()
{
  return; // this works but it's too fast and cba to work on this atm

  // move towards our moveGoal
  if (this.relx === this.moveGoal.x && this.rely === this.moveGoal.y)
  {
    var nx = randIntRange(-10, 10);
    var ny = randIntRange(-10, 10);
    this.moveGoal.x = this.moveGoal.cx + nx;
    this.moveGoal.y = this.moveGoal.cy + ny;
  }
  var dx = this.relx - this.moveGoal.x;
  var dy = this.rely - this.moveGoal.y;
  if (Math.abs(dx > dy) || dx === dy && randTrue())
  {
    if (dx > 0)
      this.relx++;
    else
      this.relx--;
  }
  else
  {
    if (dy > 0)
      this.rely++;
    else
      this.rely--;
  }
};


JP.Entity.Fire = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.FIRE;
  this.imgPath = 'fire.png';
  this.canMove = false;
};
JP.Entity.Fire.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.Fire.prototype.constructor = JP.Entity.Fire;

JP.Entity.ItemBox = function()
{
  JP.Entity.Entity.apply(this, arguments);
  this.type = JP.Entity.Type.ITEM;
  this.imgPath = 'item.png';
  this.item = null;
  this.quant = null;
};
JP.Entity.ItemBox.prototype = Object.create(JP.Entity.Entity.prototype);
JP.Entity.ItemBox.prototype.constructor = JP.Entity.ItemBox;
JP.Entity.ItemBox.prototype.SetItem = function(item, quant)
{
  if (JP.Item.Spec(item, "name") === undefined)
  {
    this.item = null;
    this.quant = null;
    this.SetImage("item.png");
  }
  else
  {
    this.item = item;
    this.quant = quant || 1;
  }
};
JP.Entity.ItemBox.prototype.SetGold = function(quant)
{
  this.item = null;
  this.quant = quant;
  this.SetImage("gold.png");
};
JP.Entity.ItemBox.prototype.Move = function()
{
  var distance = Distance(this.relx, this.rely, JP.player.relx, JP.player.rely);

  if (distance < 0.5) // give the item
  {
    var msg;
    if (this.item !== null && this.quant > 0)
    {
      JP.player.ItemDelta(this.item, this.quant);
      msg = "You picked up " + Commify(this.quant) + " " + this.item + (this.quant > 1 ? "s" : "");
    }
    else if (this.quant > 0)
    {
      JP.player.DeltaGold(this.quant);
      msg = "You picked up " + Commify(this.quant) + " Gold Coins";
    }
    else
      msg = "There doesn't seem to be anything here";
    new JP.Logger.LogItem(msg).Post();
    this.Death(0);
    return;
  }
  if (distance < 6) // step towards the player
  {
    var dx = (JP.player.relx - this.relx) / distance;
    var dy = (JP.player.rely - this.rely) / distance;
    var speed = 30 / 1000;
    dx = Normalize([dx, dy])[0] * speed * JP.getTickDelta();
    dy = Normalize([dx, dy])[1] * speed * JP.getTickDelta();
    this.relx += dx;
    this.rely += dy;
    JP.needDraw = true;
  }
  this.posx = Math.floor(this.relx);
  this.posy = Math.floor(this.rely);
};
