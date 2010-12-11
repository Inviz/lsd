/*
---
 
script: Menu.js
 
description: Menu widget base class
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Paint
  - LSD.Widget.Command

provides: 
  - LSD.Widget.Menu
 
...
*/
LSD.Widget.Menu = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'menu',
    element: {
      tag: 'menu'
    }
  }
});

LSD.Widget.Menu.Command = new Class({
  Extends: LSD.Widget.Paint,
  
  options: {
    tag: 'command',
    element: {
      tag: 'command'
    }
  }
});
LSD.Widget.Menu.Command.Command = LSD.Widget.Menu.Command
LSD.Widget.Menu.Command.Checkbox = new Class({
  Includes: [
    LSD.Widget.Menu.Command,
    LSD.Widget.Module.Command.Checkbox
  ]
});
LSD.Widget.Menu.Command.Radio = new Class({
  Includes: [
    LSD.Widget.Menu.Command,
    LSD.Widget.Module.Command.Radio
  ]
});