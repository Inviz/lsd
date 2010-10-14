/*
---
 
script: Fill.js
 
description: Fills shape with color
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Layer
 
provides: [ART.Layer.Fill]
 
...
*/

ART.Layer.Fill = new Class({
  Extends: ART.Layer,
  
  paint: function(color) {
    if (!color) return false;
    this.produce();
    this.shape.fill.apply(this.shape, $splat(color));
  }

});

ART.Layer.Fill.Offset = new Class({
  Extends: ART.Layer.Fill,

  paint: function(color, offset, radius) {
    if (!color) return false;
    var top = offset[0], right = offset[1], bottom = offset[2], left = offset[3];
    if (!(top || right || bottom || left)) return ART.Layer.Fill.prototype.paint.call(this, color);
    var style = this.base.style;
    top = (top && top.toString().indexOf('%') > -1) ? (style.height / 100 * top.toInt()) : (top || 0).toInt();
    bottom = (bottom && bottom.toString().indexOf('%') > -1) ? (style.height / 100 * bottom.toInt()) : (bottom || 0).toInt();
    right = (right && right.toString().indexOf('%') > -1) ? (style.width / 100 * right.toInt()) : (right || 0).toInt();
    left = (left && left.toString().indexOf('%') > -1) ? (style.width / 100 * left.toInt()) : (left || 0).toInt();
    if (radius == null) {
      radius = Math.min(- left - right, - top - bottom) / 2
    } else {
      var r = style.cornerRadius ? style.cornerRadius[0] : 0;
      if (radius.toString().indexOf('%') > -1) radius = (r / 100 * radius.toInt())
      radius -= r;
    }
    this.produce([(- left - right) / 2, (- top - bottom) / 2, radius]);
    this.shape.fill.apply(this.shape, $splat(color));
    
    return {
      translate: {
        x: left, 
        y: top
      }
    }
  }
});

['reflection', 'background'].each(function(type) {
  var camel = type.capitalize();
  ART.Layer.Fill[camel] = ['fill', type + 'Color'];
  
  ART.Layer.Fill[camel].Offset = new Class({
    Extends: ART.Layer.Fill.Offset,

    properties: [type + 'Color', type + 'Offset', type + 'CornerRadius']
  });
  Widget.Styles.Paint.push(type + 'Offset', type + 'Color', type + 'OffsetTop', type + 'OffsetRight', type + 'OffsetBottom', type + 'OffsetLeft', type + 'CornerRadius')
  
  
  Widget.Styles.Complex[type + 'Offset'] = {
    set: [type + 'OffsetTop', type + 'OffsetLeft', type + 'OffsetBottom', type + 'OffsetRight'],
    get: [type + 'OffsetTop', type + 'OffsetRight', type + 'OffsetBottom', type + 'OffsetLeft']
  }
})
