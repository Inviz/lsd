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



LSD.Widget = function(Properties) {
  
  Object.append(Properties, {
    events:       LSD.Type.Events,
    states:       LSD.Type.States,
    pseudos:      LSD.Type.Pseudos,
    attributes:   LSD.Type.Attributes,
    classes:      LSD.Type.Classes,
    dataset:      LSD.Type.Dataset,
    variables:    LSD.Type.Variables,
    mixins:       LSD.Type.Mixins,
    properties:   LSD.Type.Properties,
    shortcuts:    LSD.Type.Shortcuts,
    styles:       LSD.Type.Styles,
    layouts:      LSD.Type.Layout,
    allocations:  LSD.Type.Allocations,
    relations:    LSD.Type.Relations,
    expectations: LSD.Type.Expectations,
    matches:      LSD.Type.Matches,
    mutations:    LSD.Type.Mutations,
    proxies:      LSD.Type.Proxies,
    layers:       LSD.Type.Layers,
    shape:        LSD.Type.Shape
  });
  
  return LSD.Struct(Properties);

}(LSD.Properties || (LSD.Properties = {}));


LSD.Widget.implement(LSD.Module.Attributes);
LSD.Widget.implement(LSD.Module.DOM);

