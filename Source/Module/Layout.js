/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD
- LSD.Layout

provides: [LSD.Module.Layout]
 
...
*/

LSD.Module.Layout = new Class({
  options: {
    layout: {}
  },
  
  initialize: function(options) {
    if (options && LSD.Layout.isConvertable(options)) options = LSD.Layout.convert(options);
    this.parent.apply(this, arguments);
    var origin = options && options.origin;
    var layout = Array.from(this.options.layout.children);
    if (origin && !options.source) {
      var children = origin.getChildren();
      if (!children.length) {
        var text = origin.get('html').trim();
        if (text.length) this.setContent(text)
      } else layout.push.apply(layout, Array.from(children));
    }
    if (layout.length) this.setLayout(layout);
    if (this.options.layout.self) this.applySelector(this.options.layout.self);
  },
  
  applySelector: function(selector) {
    var parsed = Slick.parse(selector).expressions[0][0];
    if (parsed.classes) {
      var klasses = parsed.classes.map(function(klass) { return klass.value })
      this.classes.push.apply(this.classes, klasses);
      klasses.each(this.addClass.bind(this));
    }
    var options = {};
    if (parsed.id) options.id = parsed.id;
    if (parsed.attributes) {
      if (parsed.attributes) parsed.attributes.each(function(attribute) {
        options[attribute.key] = attribute.value || true;
      });
    }  
    if (parsed.attributes || parsed.id) Object.append(this.options, options);
    this.fireEvent('selector', [parsed, selector]);
  },
  
  setLayout: function(layout) {
    this.layout = layout;
    this.tree = this.applyLayout(layout);
    this.fireEvent('layout', [this.tree, this.layout])
  },
  
  applyLayout: function(layout) {
    return new LSD.Layout(this, layout)
  },
  
  buildLayout: function(selector, layout, parent) {
    return LSD.Layout.build(selector, layout, (parent === null) ? null : (parent || this))
  },
  
  buildItem: function() {
    if (!this.options.layout.item) return this.parent.apply(this, arguments);
    return this.buildLayout(this.options.layout.item, null, this)
  }
});