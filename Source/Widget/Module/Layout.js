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
  
  options: {
    layout: {}
  },
  
  setLayout: function(layout) {
    this.layout = layout;
    this.tree = this.applyLayout(layout);
    this.fireEvent('layout', [this.tree, this.layout])
  },
  
  applyLayout: function(layout) {
    return new ART.Layout(this, layout)
  },
  
  buildLayout: function(selector, layout, parent) {
    return ART.Layout.build(selector, layout, parent || this)
  },
  
  buildItem: function() {
    if (!this.options.layout.item) return this.parent.apply(this, arguments);
    var wrapper = this.getItemWrapper();
    var widget = this.buildLayout(this.options.layout.item, null, this.getItemWrapper(), false);
    var container = wrapper.getContainer ? $(wrapper.getContainer()) : wrapper;
    widget.inject(container, 'bottom', true);
    return widget;
  }
});