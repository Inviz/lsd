/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
- LSD.Layout

provides: [LSD.Widget.Module.Layout]
 
...
*/

LSD.Widget.Module.Layout = new Class({
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
      if (children.length) layout.push.apply(layout, Array.from(children));
      else {
        var text = origin.get('html').trim();
        if (text.length) this.setContent(text)
      }
    }
    if (layout.length) this.setLayout(layout);
    if (this.options.layout.self) this.applySelector(this.options.layout.self);
  },
  
  dispatchEvent: function(type, args){
    args = Array.from(args);
    var node = this;
    type = type.replace(/^on([A-Z])/, function(match, letter) {
      return letter.toLowerCase();
    });
    while (node) {
      var events = node.$events;
      if (events && events[type]) events[type].each(function(fn){
        return fn.apply(node, args);
      }, node);
      node = node.parentNode;
    }
    return this;
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
    if (parsed.attributes || parsed.id) $extend(this.options, options);
    this.fireEvent('selector', [parsed, selector]);
  },
  
  match: function(selector) {
    return Slick.match(this, selector)
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