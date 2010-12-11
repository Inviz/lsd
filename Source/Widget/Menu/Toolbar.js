/*
---
 
script: Toolbar.js
 
description: Menu widget to be used as a drop down
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Menu
- LSD.Widget.Button
- Base/Widget.Trait.Focus
- Base/Widget.Trait.List

provides:
- LSD.Widget.Menu.Toolbar

 
...
*/
LSD.Widget.Menu.Toolbar = new Class({
  Includes: [
    LSD.Widget.Menu,
    Widget.Trait.Focus.Stateful,
    Widget.Trait.List,
    Widget.Trait.Accessibility
  ],
  
  options: {
    attributes: {
      type: 'toolbar'
    },
    layers: {
      shadow:  ['shadow'],
      stroke:  ['stroke'],
      background:  [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection],
    }
  }
});