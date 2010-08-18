ART.Shape.implement({
  produce: function(delta, shape) {
    if (!shape) shape = new this.$constructor;
    if (this.style) shape.draw(delta.push ? this.change.apply(this, delta) : this.change(delta))
    return shape;
  }
});