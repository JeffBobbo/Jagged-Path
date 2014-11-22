var CGUI = CGUI || {}
CGUI.id = 0;

CGUI.CGUI = function(canvas)
{
  this.windows = [];
  this.canvas = canvas || null;
  this.context = this.canvas ? this.canvas.getContext('2d') : null;
};
CGUI.CGUI.prototype.Draw = function(clean)
{
  clean = clean || true;
  if (clean === true)
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  for (var i = this.windows.length - 1; i >= 0; i--)
  {
    var win = this.windows[i];
    if (win.visible === false)
      continue;
    win.Draw();
  }
};
CGUI.CGUI.prototype.OnEvent = function(event)
{
  for (var i = this.windows.length - 1; i >= 0; i--)
  {
    var win = this.windows[i];
    if (win.enabled === false)
      continue;
    win.OnEvent(event);
  };
};

CGUI.Window = function()
{
  this.id = CGUI.id++;
  this.visible === true;
  this.enabled === true;
  this.nodes = [];
  this.position = {x1: -1, y1: -1, x2: -1, y2: -1};
  this.percentage = {x1: 0.0, y1: 0.0, x2: 0.0, y2: 0.0};
};
CGUI.Window.prototype.Draw = function()
{
  for (var i = this.nodes.length - 1; i >= 0; i--)
  {
    var node = this.nodes[i];
    if (node.visible === false)
      continue;
    node.Draw();
  }
};
CGUI.Window.prototype.OnEvent = function(event)
{
  for (var i = this.nodes.length - 1; i >= 0; i--)
  {
    var node = this.nodes[i];
    if (node.enabled === false)
      continue;
    node.OnEvent(event);
  }
};

CGUI.Node = function()
{
  this.id = CGUI.id++;
  this.title = "";
  this.position = {x1: -1, y1: -1, x2: -1, y2: -1};
  this.percentage = {x1: 0.0, y1: 0.0, x2: 0.0, y2: 0.0};
  this.font = null;

  this.parent = null;

  this.enabled = true;
  this.visible = true;
};

CGUI.Node.prototype.Draw = function()
{

}

