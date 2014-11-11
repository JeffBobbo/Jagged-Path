var CGUI = CGUI || {}

CGUI.CGUI = function()
{
  this.windows = [];
};
CGUI.CGUI.prototype.Draw = function()
{
  for (var i = this.windows.length - 1; i >= 0; i--)
  {
    const win = this.windows[i];
    if (win.visible === false)
      continue;
    win.Draw();
  }
};
CGUI.CGUI.prototype.OnEvent = function(event)
{

};

CGUI.Window = function()
{

}