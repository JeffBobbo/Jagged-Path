/*
  Jagged Path, javascript browser game
  Copyright (C) 2014 Jeff Bobbo
  All rights reserved
*/

/*
  visage system

  keeping things sinple for now
  a visage is made up for images which have offsets and relative sizes

*/

JP.Visage = function()
{
  this.images = []; // JP.Visage.Image
};

JP.Visage.prototype.AddImage = function(path, sizex, sizey, offx, offy)
{
  path = path || "";
  if (path === "")
    return;

  sizex = sizex || 1;
  sizey = sizey || 1;

  offx = offx || 0;
  offy = offy || 0;

  var img = new JP.Visage.Image(path, sizex, sizey, offx, offy);
  if (img.Valid() === true)
    this.images.push(img);
};

JP.Visage.prototype.Draw = function(x, y, size)
{
  x = x || null;
  y = y || null;
  size = size || 1;

  if (x === null || y === null)
    return; // can't draw that

  for (var i = this.images.length - 1; i >= 0; i--)
    this.images[i].Draw(x, y, size);
};

JP.Visage.Image = function(path, sizex, sizey, offx, offy)
{
  this.Set(path);

  this.sizex = sizex;
  this.sizey = sizey;

  this.offx = offx;
  this.offy = offy;
};

JP.Visage.Image.prototype.Set = function(path)
{
  this.path = path || this.path;
  this.img = this.img || new Image();
  this.img.src = 'img/' + this.path;
};

JP.Visage.Image.prototype.Draw = function(x, y, size)
{
  JP.context.drawImage(this.img,
    (x + this.offx) * JP.zoomLevel,
    (y + this.offy) * JP.zoomLevel,
    Math.floor(size * this.sizex * JP.zoomLevel),
    Math.floor(size * this.sizey * JP.zoomLevel)
  );
};