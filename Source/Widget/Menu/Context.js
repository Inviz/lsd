/*
---
 
script: Context.js
 
description: Menu widget to be used as a drop down
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Menu
  - Base/Widget.Trait.Animation
  - LSD.Widget.Module.Command.Checkbox
  - LSD.Widget.Module.Command.Radio

provides:
  - LSD.Widget.Menu.Context
  - LSD.Widget.Menu.Context.Command
  - LSD.Widget.Menu.Context.Command.Command
  - LSD.Widget.Menu.Context.Command.Checkbox
  - LSD.Widget.Menu.Context.Command.Radio
 
...
*/
LSD.Widget.Menu.Context = new Class({
  Includes: [
    LSD.Widget.Menu,
    Widget.Trait.Animation
  ],

  options: {    
    layers: {
      shadow:  ['shadow'],
      stroke:  ['stroke'],
      background:  [LSD.Layer.Fill.Background],
      reflection:  [LSD.Layer.Fill.Reflection],
    },

    attributes: {
      type: 'context'
    },
    
    animation: {
      duration: 200
    }
  }
});

LSD.Widget.Menu.Context.Command = new Class({
  Includes: [
    LSD.Widget.Menu.Command,
    Widget.Trait.Item.Stateful
  ],
  
  options: {
    layers: {
      fill:  ['stroke'],
      reflection:  [LSD.Layer.Fill.Reflection],
      background: [LSD.Layer.Fill.Background],
      glyph: ['glyph']
    }
  }
});

LSD.Widget.Menu.Context.Command.Command = LSD.Widget.Menu.Context.Command;

LSD.Widget.Menu.Context.Command.Checkbox = new Class({
  Includes: [
    LSD.Widget.Menu.Context.Command,
    LSD.Widget.Module.Command.Checkbox
  ]
});

LSD.Widget.Menu.Context.Command.Radio = new Class({
  Includes: [
    LSD.Widget.Menu.Context.Command,
    LSD.Widget.Module.Command.Radio
  ]
});

LSD.Widget.Menu.Button = LSD.Widget.Menu.Context.Command

