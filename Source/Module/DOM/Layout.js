/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Layout

provides: 
  - LSD.Module.Layout
 
...
*/
  
LSD.Module.Layout = new Class({
  options: {
    layout: {
      render: true,
      extract: false,
      transform: {},
      options: {}
    }
  },
  
  initializers: {
    layout: function(options, element) {
      this.childNodes = [];
      var layout = options.layout, clone = (layout.options.method == 'clone');
      if (!element) return;
      if (clone || layout.render) layout.template = Array.prototype.slice.call(element.childNodes, 0);
      if (clone)  delete this.element;
      
      return {
        events: {
          build: function() {
            LSD.Layout.converted[$uid(this.element)] = this;
            this.setLayout(this.options.layout);
          },
          write: function(written) {
            this.getLayout().render(written, this, 'augment');
          },
          DOMNodeInserted: 'buildLayout'
        }
      }
    }
  },
  
  setLayout: function(options) {
    if (options.extract) options.extracted = LSD.Layout.extract(element);
    if (options.extracted) this.setOptions(options.extracted);
    if (options.template) this.buildLayout(options.template);
    if (options.children) this.buildLayout(options.children);
  },
  
  applySelector: function(selector) {
    var parsed = Slick.parse(selector).expressions[0][0];
    if (parsed.classes) parsed.classes.map(function(klass) { return klass.value }).each(this.addClass, this);
    if (parsed.id) this.setAttribute('id', parsed.id);
    if (parsed.attributes) parsed.attributes.each(function(attribute) {
      this.setAttribute(attribute.key, attribute.value);
    }, this);
  },
  
  transformLayout: function(element, layout) {
    var query = {element: element, layout: layout, parent: this};
    this.dispatchEvent('layoutTransform', query);
    if (query.transformation) return query.transformation;
  },
  
  onLayoutTransform: function(query) {
    var element = query.element;
    var transformations = (this.layoutTransformations[LSD.toLowerCase(element.tagName)] || []).concat(this.layoutTransformations['*'] || []);
    for (var i = 0, transformation; transformation = transformations[i++];) {
      if (Slick.match(element, transformation[0], this.element)) query.transformation = transformation[1];
    }
  },
  
  addLayoutTransformation: function(selector, transformation) {
    if (!this.layoutTransformations) this.layoutTransformations = {};
    selector.split(/\s*,\s*/).each(function(bit) {
      var parsed = Slick.parse(bit);
      var tag = parsed.expressions[0].getLast().tag;
      var group = this.layoutTransformations[tag];
      if (!group) group = this.layoutTransformations[tag] = [];
      group.push([parsed, transformation]);
    }, this)
  },
  
  removeLayoutTransformation: function(selector, transformation) {
    selector.split(/\s*,\s*/).each(function(bit) {
      var parsed = Slick.parse(bit);
      var tag = parsed.expressions[0].getLast().tag;
      var group = this.layoutTransformations[tag];
      for (var i = 0, transformation; transformation = group[i]; i++)
        if (group[0] == parsed && parsed[1] == transformation) group.splice(i--, 1);
    }, this)
  },
  
  getLayout: Macro.getter('layout', function(layout, options) {
    return new LSD.Layout(this, layout, options);
  }),
  
  buildLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, parent || this, null, options);
  }
});