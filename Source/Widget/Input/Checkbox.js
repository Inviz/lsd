/*
---
 
script: Checkbox.js
 
description: Boolean checkbox type of input
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Input
- LSD.Widget.Module.Command.Checkbox
- Base/Widget.Trait.Touchable
- Base/Widget.Trait.Focus
- Base/Widget.Trait.Accessibility

provides: [LSD.Widget.Input.Checkbox]
 
...
*/
LSD.Widget.Input.Checkbox = new Class({
  Includes: [
    LSD.Widget.Paint,
    LSD.Widget.Module.Command.Checkbox,
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
      space: 'toggle'
    }
  }
});