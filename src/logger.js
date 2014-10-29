/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

JP.Logger = JP.Logger || {};
JP.Logger.events = [];

JP.Logger.LoadData = function(text)
{
  var logs = undefined;
  if (typeof text === "string")
    logs = JSON.parse(text);
  else
    logs = JSON.parse(localStorage.getItem("JP.events"));
  if (logs === undefined || logs === null)
    return;
  
  logs.sort(function (a, b) {
    if (a.when < b.when)
      return 1;
    if (a.when > b.when)
      return -1;
    return 0;
  });

  for (var i = 0; i < logs.length; i++)
  {
    var log = new LogItem();
    log.merge(logs[i]);
    log.post();
  }
};

JP.Logger.DeleteData = function()
{
  localStorage.removeItem("JP.events");

  JP.Logger.events.clear();
};

JP.Logger.Draw = function()
{
  JP.guicontext.fillStyle = "#FFFFFF";
  var font = "8pt Courier New"; // need this later for bold/italics
  JP.guicontext.font = font;
  var w = JP.guiview.width - JP.ui_width + 8;
  var h = (JP.ui_height >> 1) + 8;
  // event log
  var i = JP.Logger.events.length - 1;
  var h2 = 16;
  while (i >= 0 && h2 < h - 16)
  {
    var words = JP.Logger.events[i].msg.split(" ");
    JP.guicontext.font = (JP.Logger.events[i].italic === true ? "italic " : "") + (JP.Logger.events[i].bold === true ? "bold " : "") + font;
    var line = "";
    for (var j = 0; j < words.length; ++j)
    {
      var test = line + words[j] + " ";
      var width = JP.guicontext.measureText(test).width;
      if (width > JP.ui_width && j > 0)
      {
        JP.guicontext.fillText(line, w, h2);
        line = " " + words[j] + " ";
        h2 += 16;
      }
      else
      {
        line = test;
      }
    }
    JP.guicontext.fillText(line, w, h2);
    i--;
    h2 += 16;
  }
}

JP.Logger.LogItem = function(text, save, bold, italic)
{
  this.msg  = text || "";
  this.save = save || false;
  this.bold = bold || false;
  this.italic = italic || false;
};

JP.Logger.LogItem.prototype.Post = function()
{
  if (this.msg.length === 0)
    return;
  if (this.when === -1)
    this.when = JP.getTickCount();

  JP.Logger.events.push(this);
/*
  var p = document.createElement("P");
  if (this.bold)
    p.style.fontWeight = "bold";
  if (this.italic)
    p.style.fontStyle = "italic";
  p.appendChild(document.createTextNode(this.msg));

  JP.Logger.logNode.insertBefore(p, JP.Logger.logNode.firstChild);
*/
  if (this.save === true) // save it
  {
    var tmp = JSON.parse(localStorage.getItem("JP.events"));
    if (tmp === undefined || tmp === null)
      tmp = new Array();
    tmp.push(this);
    localStorage.setItem("JP.events", JSON.stringify(tmp));
  }
  JP.needDraw = true;
};
