/*
---
 
script: Layer.js
 
description: Adds a piece of SVG that can be drawn with widget styles
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
  - LSD.Module.Styles
  - Sheet/Sheet.Styles
 
provides: 
  - LSD.Layer
  - LSD.Layer.Shaped
 
...
*/

!function() {
  
LSD.Layer = function(name, styles, painters) {
  this.name = name;
  this.styles = styles;
  this.painters = painters;
}

LSD.Layer.prototype = {
  render: function(widget, commands) {
    var canvas = widget.getCanvas();
    var shape = commands.shape;
    if (shape == 'none') return;
    if (!shape) shape = widget.getStyle('shape') || 'rectangle';
    var layer = widget.shapes[this.name];
    if (shape.glyph) {
      var glyph = ART.Glyphs[shape.glyph];
      if (!glyph) return;    
      var path = new ART.Path(glyph);
      var box = path.measure();
      if (!layer) layer = new ART.Shape(path, box.width, box.height);
      if (commands.size && !Object.equals(previous ? previous.size : box, commands.size))
        layer.resizeTo(commands.size.width, commands.size.height)
        
    } else if (!shape.indexOf){
      for (var name in shape) {
        var values = shape[name];
        if (!values.push) values = [values];
        shape = name;
      }
    }
    if (!layer) {
      var path = ART.Shape[shape.capitalize()];
      if (!path) return;
      var layer = new path;
      layer.render(commands)
    } else {
      var previous = layer.commands;
      if (layer.draw && layer.render) layer.render(commands)
    }
    layer.commands = commands;
    widget.shapes[this.name] = layer;
    for (var command in commands) {
      var value = commands[command];
      if (layer[command] && command != 'move') {
        if (!value || !previous || !Object.equals(previous[command], value)) layer[command][value && value.push ? 'apply' : 'call'](layer, value);
      }
    }
    var translate = commands.translate = {x: 0, y: 0}
    if (commands.inside) {
      translate.x += commands.inside.left
      translate.y += commands.inside.top;
    };
    //if (commands.outside) {
    //  top += commands.outside.top;
    //  left += commands.outside.left
    //};
    if (commands.move) {
      translate.x += commands.move.x;
      translate.y += commands.move.y;
    }
    if (!previous || !Object.equals(previous.translate, translate)) layer.moveTo(translate.x, translate.y)
  },
  
  draw: function(widget, context, previous) {
    context = Object.append({size: widget.size, style: widget.style.current}, context || {});
    if (context.style.cornerRadiusTopLeft !== null) {
      context.radius = widget.getStyle('cornerRadius')
    }
    var inherited = {}, overwritten = {};
    for (var painter, i = 0; painter = this.painters[i++];) {
      var commands = painter.paint.apply(context, painter.keys.map(function(prop) { return widget.getStyle(prop)}));
      for (var name in commands) {
        var value = commands[name];
        if (Inherit[name]) {;
          inherited[name] = merge(value, context[name])
        } else {
          if (!Accumulate[name]) overwritten[name] = context[name]
          context[name] = (Accumulate[name] || Merge[name]) ? merge(value, context[name]) : value;
        }
      }
      //for (var command in value) this[command](command[value]);
    }    
    this.render(widget, context);
    return Object.append(context, overwritten, inherited);;
  }
}

var merge = function(value, old) {
  if (typeof value == "object") {
    if (value.push) {
      for (var j = 0, k = value.length; j < k; j++) {
        var item = value[j] || 0;
        if (old) old[j] = (old[j] || 0) + item;
        else old = [item]
      }
      return old;
    } else if (!value.indexOf) {
      for (var prop in value) {
        var item = value[prop] || 0;
        if (!old) old = {}
        old[prop] = (old[prop] || 0) + item;
      }
      return old;
    }
  }  
  return value;
}

var Accumulate = LSD.Layer.accumulated = new Object.Array('translate', 'radius');
var Inherit = LSD.Layer.inherited = new Object.Array('inside', 'outside')
var Merge = LSD.Layer.merged = new Object.Array('size')

var Styles = LSD.Styles;
var Map = LSD.Layer.Map = {};
var Cache = LSD.Layer.Cache = {};

LSD.Layer.generate = function(name, layers) {
  if (arguments.length > 2) layers = Array.prototype.splice.call(arguments, 1);
  var painters = [];
  var styles = LSD.Layer.prepare(name, layers, function(painter) {
    painters.push(painter)
  })
  return new LSD.Layer(name, styles, painters);
};

LSD.Layer.prepare = function(name, layers, callback) {
  var properties = [], styles = {};
  for (var i = 0, layer; layer = layers[i++];) {
    var definition = LSD.Layer[layer.capitalize()];
    if (!definition ) continue;
    var properties = definition.properties && Object.clone(definition.properties);
    if (!properties) continue;
    definition = Object.append({styles: {}, keys: []}, definition);
    var prefix = definition.prefix;
    if (prefix === false || layer == name) prefix = name;
    else if (!prefix) prefix = name + layer.capitalize();
    var length = 0;
    for (var property in properties) length++
    var simple = (length == 1);
    Object.each(properties, function(value, property) {
      if (property == layer) {
        if (simple) var style = prefix
        else return;
      } else var style = prefix + property.capitalize()
      definition.styles[style] = styles[style] = Sheet.Property.compile(value, properties);
      definition.keys.push(style);
    });
    var shorthand = properties[layer];
    if (shorthand && !simple) {
      var style = (layer == name) ? name : name + layer.capitalize();
      if (length) {
        for (var j = 0, k = 0, l = 0, prop; prop = shorthand[j]; j++) {
          if (!prop.push) { 
            if (properties[prop]) {
              shorthand[j] = prefix + prop.capitalize();
              k++
            }
          } else for (var m = 0, sub; sub = prop[m]; m++) {
            if (properties[sub]) {
              prop[m] = prefix + sub.capitalize();
              l++;
            }
          }
        }
      }
      definition.styles[style] = styles[style] = Sheet.Property.compile(((l > 0 && (k > 0 || j == 1)) ) ? [shorthand] : shorthand, styles);
      definition.shorthand = style;
    }
    if (definition.onCompile) definition.onCompile(name);
    if (callback) callback(definition);
  }
  for (var property in styles) {
    Styles[property] = styles[property];
    Map[property] = name;
  }
  return styles;
}

LSD.Layer.get = function(name) {
  var key = name//Array.flatten(arguments).join('');
  if (Cache[key]) return Cache[key];
  else return (Cache[key] = LSD.Layer.generate.apply(LSD.Layer, arguments))
}

}();