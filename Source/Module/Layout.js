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
    layout: {
      instance: null,
      extract: false,
      options: {},
      transform: null
    }
  },
  
  initialize: function(element, options) {
    if ((element && !element.tagName) || (options && options.tagName)) {
      var el = options;
      options = element;
      element = el;
    }
    var opts = options && options.layout && options.layout.options;
    var clone = ((opts && opts.method) || this.options.layout.method) == 'clone';
    var extract = (opts && opts.extract) || this.options.layout.extract;
    if (clone || extract) options = Object.append(options || {}, LSD.Layout.extract(element));
    if (clone) {
      var layout = element;
      element = null
    }
    if (!layout) layout = element;
    this.childNodes = [];
    if (layout) LSD.Layout.converted[$uid(layout)] = this;
    this.addEvent('build', function() {
      LSD.Layout.converted[$uid(this.element)] = this;
    });
    this.parent(element, options);
    if (this.options.layout.instance !== false) if (!options || !options.layout || (options.layout.instance !== false)) {
      if (layout) this.layout = new LSD.Layout(this, Array.prototype.splice.call(layout.childNodes, 0), this.options.layout.options)
    } else this.layout = options.layout.instance;
    if (this.options.layout.children) this.layout.render(this.options.layout.children)
    if (this.options.layout.self) this.applySelector(this.options.layout.self);
    if (this.options.layout.transform) this.addLayoutTransformations(this.options.layout.transform);
    this.addEvent('DOMNodeInserted', this.updateLayout.bind(this))
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
  
  transformLayout: function(element, layout) {
    var query = {element: element, layout: layout, parent: this};
    this.dispatchEvent('layoutTransform', query);
    if (query.transformation) return query.transformation;
  },
  
  onLayoutTransform: function(query) {
    var element = query.element;
    var transformations = (this.layoutTransformations[LSD.toLowerCase(element.tagName)] || []).concat(this.layoutTransformations['*'] || []);
    for (var i = 0, transformation; transformation = transformations[i++];) {
      if (Slick.match(element, transformation[0])) query.transformation = transformation[1];
    }
  },
  
  addLayoutTransformations: function(transformations) {
    if (!this.layoutTransformations) {
      this.layoutTransformations = {};
      this.addEvent('layoutTransform', this.onLayoutTransformHandler = this.onLayoutTransform.bind(this));
    }
    var parsed = LSD.Module.Layout.parsedTransformations || (LSD.Module.Layout.parsedTransformations = {});
    for (var selector in transformations) {
      var transformation = parsed[selector];
      if (!transformation) {
        transformation = parsed[selector] = Slick.parse(selector);
        transformation.tag = transformation.expressions[0][transformation.expressions[0].length - 1].tag;
      }
      var group = this.layoutTransformations[transformation.tag];
      if (!group) group = this.layoutTransformations[transformation.tag] = [];
      group.push([transformation, transformations[selector]]);
    }
  },
  
  buildLayout: function() {
    var layout = this.createLayout.apply(this, arguments);
    return layout.result.length == 1 ? layout.result[0] : layout.result;
  },
  
  createLayout: function(layout, parent) {
    return new LSD.Layout(parent || this, layout, this.options.layout.options);
  },
  
  updateLayout: function(layout, parent) {
    return this.layout.render(layout, parent)
  },
  
  buildWidget: function(selector, options, layout) {
    return this.layout.materialize(selector, layout, this, options)
  },
  
  buildItem: function() {
    if (!this.options.layout.item) return this.parent.apply(this, arguments);
    return this.buildLayout(this.options.layout.item)
  }
});