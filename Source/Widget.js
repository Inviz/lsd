/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Type
  - LSD.Module.Layout
  - LSD.Module.Styles
  - LSD.Module.Attributes
  - LSD.Module.Events
  - LSD.Module.DOM
  - LSD.Module.Proxies
  - LSD.Module.Expectations
  - LSD.Module.Relations
  - LSD.Module.Container
  - LSD.Module.Actions
  - LSD.Module.Command
  - LSD.Module.Render
  - LSD.Module.Target
  - LSD.Module.Shape
  - LSD.Module.Dimensions
  - LSD.Module.Layers
  - LSD.Mixin.Value

provides: 
  - LSD.Widget
  - LSD.Widget.create
 
...
*/

/*
  LSD.Widget autoloads all of the modules that are defined in Old.Module namespace
  unless LSD.modules array is provided.
  
  So if a new module needs to be included into the base class, then it only needs
  to be *require*d.
*/
  
if (!LSD.modules) {
  LSD.modules = [];
  LSD.Module.each(function(module, name) {
    LSD.modules.push(module);
  })
}

/*
  Pre-generate CSS grammar for layers.
  
  It is not required for rendering process itself, because
  this action is taken automatically when the first
  widget gets rendered. Declaring layer css styles upfront
  lets us use it in other parts of the framework
  (e.g. in stylesheets to validate styles)
*/

for (var layer in LSD.Layers) LSD.Layer.get(layer, LSD.Layers[layer]);

LSD.Widget = new Class({
  
  Includes: Array.concat(LSD.Node, LSD.Base, LSD.modules),
  
  options: {
    element: {
      tag: 'div'
    },
    writable: false,
    layers: true,
    element: {
      tag: 'div'
    }
  },
  
  initialize: function(element, options) {
    this.parent(element, options);
    if ((this.options.writable && !this.attributes.tabindex && (this.options.focusable !== false)) || this.options.focusable) 
      this.setAttribute('tabindex', 0);
    this.addPseudo(this.options.writable ? 'read-write' : 'read-only');
  }
});

LSD.Widget.prototype.addStates('disabled', 'hidden', 'built', 'attached');

new LSD.Type('Widget');