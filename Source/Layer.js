ART.Layer = new Class({
  initialize: function(shape) {
    this.base = shape;
  },
  
  produce: function(delta) {
    if (!delta) delta = 0;
    this.delta = delta;
    this.shape = this.base.produce(delta, this.shape);
  }
});

ART.Layer.Shaped = new Class({
  Extends: ART.Layer,
  
  initialize: function() {
    this.shape = new ART.Shape;
  }
});


['inject', 'eject', 'translate', 'fill', 'stroke'].each(function(method) {
  ART.Layer.implement(method, function() {
    if (!this.shape) return;
    return this.shape[method].apply(this.shape, arguments);
  })
})