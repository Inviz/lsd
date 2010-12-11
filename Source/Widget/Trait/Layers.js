/*
---
 
script: Layers.js
 
description: Make widget use layers for all the SVG
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
- LSD.Layer
- ART.Shape
- LSD.Widget.Module.Styles

provides: [LSD.Widget.Trait.Layers]
 
...
*/


(function() {

LSD.Widget.Trait.Layers = new Class({
  options: {
    layers: {}
  },
  
  initialize: function() {
    this.offset = {};
    this.layers = {};
    this.parent.apply(this, arguments);
  },
  
  attach: Macro.onion(function() {
    this.style.layers = {};
    var layers = this.options.layers;
    for (var name in layers) layers[name] = this.addLayer.apply(this, Array.from(layers[name]).concat(name));
  }),

  addLayer: function() {
    var options = LSD.Layer.prepare.apply(this, arguments);
    var slots = this.style.layers, properties = options.properties;
    for (var type in properties) {
      for (var group = properties[type], i = 0, property; property = group[i++];) {
        if (!slots[property]) slots[property] = [];
        slots[property].push(options.name);
      }
    }
    return options;
  },
  
  getLayer: function(name) {
    if (this.layers[name]) return this.layers[name];
    var options = this.options.layers[name];
    var layer = this.layers[name] = new options.klass;
    layer.name = options.name;
    layer.properties = options.properties;
    if (options.paint) instance.paint = options.paint;
    return layer
  },
  
  renderLayers: function(dirty) {
    var style = this.style, layers = style.layers, offset = this.offset;
    var updated = new FastArray, definitions = this.options.layers;
    this.getShape().setStyles(this.getStyles.apply(this, this.getShape().properties));
    offset.outside = {left: 0, right: 0, top: 0, bottom: 0};
    offset.inside = {left: 0, right: 0, top: 0, bottom: 0};
    offset.shape = this.shape.getOffset ? this.shape.getOffset(style.current) : {left: 0, right: 0, top: 0, bottom: 0};
    for (var property in dirty) if (layers[property]) updated.push.apply(updated, layers[property]);
    var outside = offset.outside, inside = offset.inside;
    for (var name in definitions) {
      var value = updated[name] ? LSD.Layer.render(definitions[name], this) : null;
      var layer = this.layers[name];
      if (!layer) continue;
      if (value === false) {
        if (layer.injected) layer.eject();
      } else {
        if (!layer.injected) {
          for (var layers = Object.keys(definitions), i = layers.indexOf(layer.name), key, next; key = layers[++i];) {
            if ((next = this.layers[key]) && next.injected && next.shape) {
              layer.inject(next.shape, 'before');
              break;
            }
          }
          if (!layer.injected) layer.inject(this.getCanvas());
        } else {
          if (layer.update) layer.update(this.getCanvas())
        }
        if (!value) value = layer.value;
        layer.value = value;
        layer.translate(value.translate.x + outside.left + inside.left, value.translate.y + outside.top + inside.top);
        for (side in value.inside) {  
          outside[side] += value.outside[side];
          inside[side] += value.inside[side]
        }
      }
    }
  },
  
  repaint: function() {
    var dirty, style = this.style, last = style.last, old = style.size, paint = style.paint, dirty = paint
    this.parent.apply(this, arguments);
    this.setSize(this.getStyles('height', 'width'));
    var size = this.size;
    if (old) {
      if (old.width == size.width && old.height == size.height) {
        last = Object.append({}, style.last);
        dirty = style.dirty = {};
        for (var property in paint) {
          var value = paint[property];
          if (!$equals(value, last[property])) dirty[property] = paint[property];
          delete last[property];
        }
        for (var property in last) dirty[property] = window.undefined;
      } else this.fireEvent('resize', [size, old]);
    }
    if (Object.getLength(dirty) > 0) this.renderLayers(dirty);
    style.last = Object.append({}, paint);
    style.size = Object.append({}, size);
    this.renderOffsets();
  },
  
  renderStyles: function() {
    this.parent.apply(this, arguments);
    var style = this.style, current = style.current;
    Object.append(this.offset, {
      padding: {left: current.paddingLeft || 0, right: current.paddingRight || 0, top: current.paddingTop || 0, bottom: current.paddingBottom || 0},
      margin: {left: current.marginLeft || 0, right: current.marginRight || 0, top: current.marginTop || 0, bottom: current.marginBottom || 0}
    });
  },
  
  renderOffsets: function() {
    var element = this.element,
        current = this.style.current, 
        offset  = this.offset,         // Offset that is provided by:
        inside  = offset.inside,       // layers, inside the widget
        outside = offset.outside,      // layers, outside of the widget
        shape   = offset.shape,        // shape
        padding = offset.padding,      // padding style declarations
        margin  = offset.margin,       // margin style declarations
        inner   = {},                  // all inside offsets above, converted to padding
        outer   = {};                  // all outside offsets above, converted to margin
        
    for (var property in inside) {
      var cc = property.capitalize();
      if (offset.inner) var last = offset.inner[property];
      inner[property] = padding[property] + inside[property] + shape[property] + outside[property];
      if ($defined(last) ? last != inner[property] : inner[property]) element.style['padding' + cc] = inner[property] + 'px';
      if (offset.outer) last = offset.outer[property];
      outer[property] = margin[property] - outside[property];
      if ($defined(last) ? last != outer[property] : outer[property]) element.style['margin' + cc] = outer[property] + 'px';
    }
    $extend(offset, {inner: inner, outer: outer});
  }
});

})();
