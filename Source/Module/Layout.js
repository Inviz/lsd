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
    layout: {},
  },
  
  initialize: function(element, options) {
    if ((element && !element.tagName) || (options && options.tagName)) {
      var el = options;
      options = element;
      element = el;
    }
    this.childNodes = [];
    if (element) LSD.Layout.converted[$uid(element)] = this;
    if ((!options || !options.layout || !options.layout.instance)) {
      this.layout = new LSD.Layout(element, null, this.options.layout)
    } else this.layout = options.layout.instance;
    this.addEvent('build', function() {
      LSD.Layout.converted[$uid(this.element)] = this;
    })
    this.parent(element, options)
    if (this.options.layout.children) this.layout.render(this.options.layout.children)
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
  
  buildLayout: function(selector, layout, parent) {
    return LSD.Layout.build(selector, layout, (parent === null) ? null : (parent || this))
  },
  
  buildItem: function() {
    if (!this.options.layout.item) return this.parent.apply(this, arguments);
    return this.buildLayout(this.options.layout.item, null, this)
  }
});