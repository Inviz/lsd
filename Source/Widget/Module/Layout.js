/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- ART.Layout

provides: [ART.Widget.Module.Layout]
 
...
*/

ART.Widget.Module.Layout = new Class({
  layout: false,
  
  setLayout: function(layout) {
    this.layout = layout;
    this.tree = this.applyLayout(layout);
    this.fireEvent('layout', [this.tree, this.layout])
  },
  
  applyLayout: function(layout) {
    return new ART.Layout(this, layout)
  },
  
  buildLayout: function(selector, layout, parent, element) {
    return ART.Layout.build(selector, layout, parent || this, element)
  }
});