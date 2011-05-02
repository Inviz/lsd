/*
---

script: Behavior.js

description: Modules that do interactions 

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.Actions
  - LSD.Module.Chain
  - LSD.Module.Command
  - LSD.Module.Target

provides: 
  - LSD.Module.Behavior

...
*/

LSD.Module.Behavior = new Class({
  Implements: [
    LSD.Module.Actions, 
    LSD.Module.Chain, 
    LSD.Module.Command, 
    LSD.Module.Target
  ]
});