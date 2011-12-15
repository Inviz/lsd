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
    events:       LSD.Module.Events,
    states:       LSD.Module.States,
    pseudos:      LSD.Module.Pseudos,
    attributes:   LSD.Module.Attributes,
    classes:      LSD.Module.Classes,
    dataset:      LSD.Module.Dataset,
    variables:    LSD.Module.Variables,
    mixins:       LSD.Module.Mixins,
    properties:   LSD.Module.Properties,
    shortcuts:    LSD.Module.Shortcuts,
    styles:       LSD.Module.Styles,
    layouts:      LSD.Module.Layout,
    allocations:  LSD.Module.Allocations,
    relations:    LSD.Module.Relations,
    expectations: LSD.Module.Expectations,
    matches:      LSD.Module.Matches,
    mutations:    LSD.Module.Mutations,
    proxies:      LSD.Module.Proxies,
    layers:       LSD.Module.Layers,
    shape:        LSD.Module.Shape
  });
  
  return LSD.Struct(Properties);

}(LSD.Properties || (LSD.Properties = {}));


LSD.Widget.implement(LSD.Module.Attributes);
LSD.Widget.implement(LSD.Module.DOM);

