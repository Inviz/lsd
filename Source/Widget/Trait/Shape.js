ART.Widget.Trait.Shape = new Class({
  options: {
    shape: 'rectangle'
  },
  
  getShape: function(name) {
    if (!this.shape) {
      this.shape = new ART.Shape[(name || this.options.shape).camelCase().capitalize()];
      this.addEvent('redraw', function() {
        var style = this.getChangedStyles.apply(this, this.shape.properties);
        if (style) this.shape.style = style;
      }.bind(this))
    }
    return this.shape;
  }  
  
});