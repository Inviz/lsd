ART.Layer.Fill = new Class({
  Extends: ART.Layer,
  
	paint: function(color) {
	  if (!color) return false;
	  this.produce();
		this.shape.fill.apply(this.shape, $splat(color));
	}

})
