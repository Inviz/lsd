ART.Widget.Module.Position = new Class({
  
  attach: Macro.onion(function() {
    if (this.options.at) this.positionAt(this.options.at)
  }),
  
  positionAt: function(position) {
    position.split(/\s+/).each(function(property) {
      this.element.setStyle(property, 0)
    }, this);
    this.position = 'absolute';
    return true;
  }
  
});

ART.Widget.Ignore.attributes.push('at');