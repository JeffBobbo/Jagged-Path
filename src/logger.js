/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

/** Logger namespace
 * @namespace Logger
 * @memberOf JP
 */
JP.Logger = JP.Logger || {};

/**
 * Constructs a LogItem object used to log events and actions with to player
 * @constructor
 * @this {JP.Logger.LogItem}
 * @param {string} [text=""] - Log message text
 * @param {boolean} [bold=false] - Message formatting bold
 * @param {boolean} [italic=false] - Message formatting italics
 * @memberOf JP.Logger
 */
JP.Logger.LogItem = function(text, bold, italic)
{
  this.msg  = text || "";
  this.bold = bold || false;
  this.italic = italic || false;
};

/**
 * Post the message to the player
 * @this {JP.Logger.LogItem}
 */
JP.Logger.LogItem.prototype.Post = function()
{
  if (this.msg.length === 0)
    return;
  if (this.when === -1)
    this.when = JP.getTickCount();

//  JP.Logger.events.push(this);

  var p = document.createElement("P");
  if (this.bold)
    p.style.fontWeight = "bold";
  if (this.italic)
    p.style.fontStyle = "italic";
  p.appendChild(document.createTextNode(this.msg));
  JP.Logger.logNode.insertBefore(p, JP.Logger.logNode.firstChild);

  JP.needDraw = true;
};
