/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Module.Accessories
  - LSD.Module.Ambient
  - LSD.Module.Graphics
  - LSD.Mixin.Value
  - LSD.Logger

provides: 
  - LSD.Widget
 
...
*/

LSD.Widget = LSD.Struct(LSD.Properties);
LSD.Widget.implement(LSD.Module.Attributes);
LSD.Widget.implement(LSD.Module.DOM);

