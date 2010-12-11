/*
---
 
script: Layer.js
 
description: Adds a piece of SVG that can be drawn with widget styles
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- ART.Shape
 
provides: [LSD.Layer, LSD.Layer.Shaped]
 
...
*/

LSD.Layer = new Class({
  initialize: function(shape) {
    if (shape) this.base = shape;
  },
  
  produce: function(delta) {
    if (!delta) delta = 0;
    this.delta = delta;
    this.shape = this.base.produce(delta, this.shape);
  },
  
  setShape: function(shape) {
    this.base = shape;
  }
});

LSD.Layer.Shaped = new Class({ //layer that produce svg element (some dont, e.g. shadow)
  Extends: LSD.Layer,
  
  initialize: function() {
    this.shape = new ART.Shape;
  }
});

LSD.Layer.implement({
  inject: function() {
    this.injected = true;
    if (this.shape) return this.shape.inject.apply(this.shape, arguments);
  },
  
  eject: function() {
    delete this.injected
    if (this.shape) return this.shape.eject.apply(this.shape, arguments);
  }
});

['translate', 'fill', 'stroke'].each(function(method) {
  LSD.Layer.implement(method, function() {
    if (!this.shape) return;
    return this.shape[method].apply(this.shape, arguments);
  })
});


//Styles
(function() {
  
LSD.Layer.prepare = function() {
  var options = Array.link(arguments, {
    layer: String.type,
    name: String.type,
    klass: Class.type,
    paint: Function.type,
    options: Object.type, 
    properties: Array.type
  });
  if (options.options) {
    $extend(options, options.options);
    delete options.options;
  }
  if (!options.name) options.name = options.layer;
  if (!options.klass) options.klass = LSD.Layer[options.layer.camelCase().capitalize()];
  var properties = options.klass.prototype.properties || {};
  var props = options.properties || {};
  if (props.push) { // [ required[, numerical], optional ] 
    var props, first = props[0];
    if (first && first.push) {
      var array = props;
      props = {required: first};
      if (props.length > 1) props.optional = array.pop();
      if (props[1]) props.numerical = array[1];
      if (props[2]) props.alternative = array[2];
    } else {
      props = {required: props};
    }
  }
  for (var type in props) properties[type] = properties[type] ? properties[type].concat(props[type]) : props[type];
  options.properties = properties;
  return options;
};

LSD.Layer.render = function(definition, widget) {
  var styles = {};
  var properties = definition.properties;
  var fallback = properties.alternative && widget.getStyles.apply(widget, properties.alternative)
  for (var type in properties) {
    if (type != 'alternative') {
      var subset = widget.getStyles.apply(widget, properties[type]);
      var kind = Properties[type];
      if (kind.transformation) for (property in subset) subset[property] = styles[property] = kind.transformation(subset[property]);
      else Object.append(styles, subset);
      if (kind.condition && !kind.condition(subset) && !fallback) return false; 
    } else Object.append(styles, fallback);        
  }
  var layer = widget.getLayer(definition.name);
  layer.setShape(widget.shape);
  var value = layer.paint.apply(layer, Hash.getValues(styles));
  if (value === false) return false;
  return Object.merge({translate: {x: 0, y: 0}, outside: {left: 0, right: 0, top: 0, bottom: 0}, inside: {left: 0, right: 0, top: 0, bottom: 0}}, value);
};

var Properties = LSD.Layer.Properties = {
  required: {
    condition: function(styles) {
      for (var property in styles) if (!styles[property]) return false;
      return true;
    }
  },
  numerical: {
    condition: function(styles) {
      for (var property in styles) if (styles[property] > 0) return true;
      return false;
    },
    transformation: function(value) {
      return parseInt(value) || 0;
    },
  },
  alternative: {
    condition: function(styles) {
      for (var property in styles) if (!styles[property]) return false;
      return true;
    }
  },
  optional: {}
}

})();