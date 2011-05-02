/*
---
 
script: Shape.js
 
description: Draw a widget with any SVG path you want
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Trait
  - ART/ART.Shape
  
provides: 
  - LSD.Module.Shape
 
...
*/

LSD.Module.Shape = new Class({
  options: {
    shape: 'rectangle'
  },
  
  initializers: {
    shape: function() {
      return {
        events: {
          shaped: {
            'render': function() {
              if (this.setSize()) this.resized = true;
            },
            'update': function() {
              delete this.resized;
            }
          }
        }
      }
    }
  },
  
  getShape: Macro.getter('shape', function(name) {
    return this.setShape(name);
  }),
  
  setShape: function(name) {    
    if (!name) name = this.options.shape;
    var shape = new ART.Shape[name.camelCase().capitalize()];
    shape.name = name;
    shape.widget = this;
    if (!this.shape) this.addEvents(this.options.events.shaped);
    this.shape = shape;
    return shape;
  },
  
  getCanvas: Macro.getter('canvas', function() {
    var art = new ART;
    art.toElement().inject(this.toElement(), 'top');
    return art;
  })
  
});