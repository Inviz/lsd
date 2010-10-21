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
  
  initialize: function(options) {
    if (options && ART.Layout.isConvertable(options)) options = ART.Layout.convert(options);
    this.parent.apply(this, arguments);
    var origin = options && options.origin;
    var layout = this.layout ? [this.layout] : [];
    if (origin && !options.source) {
      var children = origin.getChildren();
      if (children.length) layout.push.apply(layout, $A(children));
      else {
        var text = origin.get('html').trim();
        if (text.length) this.setContent(text)
      }
    }
    if (layout.length) this.setLayout(layout);
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
    return ART.Layout.build(selector, layout, (parent === null) ? null : (parent || this))
  },
  
  buildItem: function() {
    if (!this.options.layout.item) return this.parent.apply(this, arguments);
    return this.buildLayout(this.options.layout.item, null, this)
  }
});