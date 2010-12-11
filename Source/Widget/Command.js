/*
---
 
script: Command.js
 
description: Command node creates accessible command
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Widget.Module.Command
  - LSD.Widget.Module.DOM

provides:
  - LSD.Widget.Command
  - LSD.Widget.Command.Command
  - LSD.Widget.Command.Checkbox
  - LSD.Widget.Command.Radio
 
...
*/

LSD.Widget.Command = new Class({
  Includes: [
    LSD.Node,
    LSD.Widget.Module.DOM,
    LSD.Widget.Module.Command
  ]
});

LSD.Widget.Command.Command = LSD.Widget.Command;

LSD.Widget.Command.Checkbox = new Class({
  Includes: [
    LSD.Widget.Command,
    LSD.Widget.Module.Command.Checkbox
  ]
});

LSD.Widget.Command.Radio = new Class({
  Includes: [
    LSD.Widget.Command,
    LSD.Widget.Module.Command.Radio
  ]
});
