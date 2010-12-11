/*
---
 
script: Range.js
 
description: Range slider input
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD.Widget.Button
- LSD.Widget.Paint
- Base/Widget.Trait.Slider
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [LSD.Widget.Input.Range]
 
...
*/

LSD.Widget.Input.Range = new Class({
  Includes: [
    LSD.Widget.Paint,
    Widget.Trait.Slider,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility
  ],
  
  options: {
    tag: 'input',
    layers: {
      shadow: ['shadow'],
      border: ['stroke'],
      background: [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection]
    },
    shortcuts: {
      next: 'increment',
      previous: 'decrement'
    },
    layout: {
      children: {
        '>thumb[shape=arrow]#thumb': {}
      }
    },
  },
  
  initialize: function() {
    delete this.options.events.focus.element.mousedown;
    this.parent.apply(this, arguments);
    this.addPseudo(this.options.mode);
  },

  onSet: function() {
    this.focus();
  }
});

LSD.Widget.Input.Range.Thumb = new Class({
  Includes: [
    LSD.Widget.Button
  ],
  
  options: {
    tag: 'thumb'
  }
});