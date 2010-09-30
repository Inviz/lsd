/*
---
 
script: Layers.js
 
description: Make widget use layers for all the SVG
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- ART.Layer
- ART.Shape

provides: [ART.Widget.Trait.Layers]
 
...
*/


(function() {

var empty = {translate: {x: 0, y: 0}, outside: {x: 0, y: 0}, inside: {x: 0, y: 0}};

ART.Widget.Trait.Layers = new Class({

  layers: {},

  build: Macro.onion(function() {
    if (this.layered) {
      for (var name in this.layered) {
        this.layers[name] = this.buildLayer.apply(this, this.layered[name].concat([name]));
      }
    }
  }),
  
  update: Macro.onion(function() {
    this.outside = {x: 0, y: 0};
    this.inside = {x: 0, y: 0};
    delete this.lastLayer;
  }),
  
  getLayer: function() {
    
  },
  
  buildLayer: function() {
    var args = Array.link($splat(arguments), {
      layer: String.type,
      name: String.type,
      klass: Class.type,
      draw: Function.type,
      options: Object.type, 
      properties: Array.type
    });
    var shape = this.getShape();
    var type = (args.klass || ART.Layer[args.layer.camelCase().capitalize()]);
    var instance = new type(shape); //combine shape & layer classes
    
    var properties = (instance.properties || []).concat(args.properties || [])
    
    this.addEvent('redraw', function() {
      value = instance.value || empty;
      var styles = this.getChangedStyles(args.name || args.layer, properties)
      //console.log('redraw', args.layer, this.selector, styles)
      if (styles) {
        instance.padding = this.inside;
        value = (args.draw || instance.paint).apply(instance, Hash.getValues(styles))
        if (value === false) {
          value = empty;
          if (instance.injected) instance.eject();
        } else {  
          value = $merge(empty, value);
          if (!instance.injected) {
            if (this.lastLayer) {
              var shape = this.lastLayer.shape;
              if (!shape.container) shape.container = this.paint;
              instance.inject(shape, 'after')
            } else {
              for (var name in this.layers) {
                if (this.layers[name].injected) {
                  console.log('inject before', this.layers[name])
                  instance.inject(this.layers[name].shape, 'before');
                  break;
                }
              }
              if (!instance.injected) instance.inject(this.paint);
            }
          } else {
            if (instance.update) instance.update(this.paint)
          }  
        }  
        instance.value = value;
      }   
      
      if (instance.injected) {
        var layers = instance.layers
        if (layers) {
          for (var i = 0, j = layers.length; i < j; i++) {
            if (layers[i]) {
              this.lastLayer = layers[i];
              break;
            }
          }
        } else this.lastLayer = instance;
      }
      instance.translate(value.translate.x + this.outside.x, value.translate.y + this.outside.y);
      this.outside.x += value.outside.x;
      this.outside.y += value.outside.y;
      //this.inside.x += value.inside.x;
      //this.inside.y += value.inside.y;
    });
    return instance;  
  }
});

})();
