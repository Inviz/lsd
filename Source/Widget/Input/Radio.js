/*
---
 
script: Radio.js
 
description: A radio button, set of connected widgets that steal checkedness from each other
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD.Widget.Paint
- LSD.Widget.Module.Command.Radio
- Base/Widget.Trait.Touchable
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [LSD.Widget.Input.Radio]
 
...
*/

LSD.Widget.Input.Radio = new Class({
  Includes: [
    LSD.Widget.Paint,
    LSD.Widget.Module.Command.Radio,
    Widget.Trait.Touchable.Stateful,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.Accessibility
  ],
  
  options: {
    tag: 'input',
    layers: {
      shadow:  ['shadow'],
      stroke: ['stroke'],
      background:  [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection],
      glyph: ['glyph']
    },
    shortcuts: {
      space: 'click'
    },
    events: {
      command: {
        'check': 'check',
        'uncheck': 'uncheck'
      }
    }
  }
  
  //retain: function() {
  //  this.check();
  //  return this.parent.apply(this, arguments);
  //}
});