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
      instance: null,
      extract: false,
      options: {},
      transform: {}
    },
    events: {
      _layout: {
        build: function() {
          LSD.Layout.converted[$uid(this.element)] = this;
          if (this.options.layout.children) this.buildLayout(this.options.layout.children)
        },
        write: function(written) {
          this.getLayout().render(written, this, 'augment');
        },
        DOMNodeInserted: 'buildLayout'
      }
    }
  },
  
  initializers: {
    layout: function() {
      this.childNodes = [];
      if (!this.layoutTransformations) this.layoutTransformations = {};
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
    if (element && (clone || extract)) options = Object.append(options || {}, LSD.Layout.extract(element));
    if (clone) {
      var layout = element;
      element = null
    }
    if (!layout) layout = element;
    if (layout) LSD.Layout.converted[$uid(layout)] = this;
    this.parent(element, options);
    if (this.options.layout.instance !== false) {
      if (layout) this.getLayout(Array.prototype.slice.call(layout.childNodes, 0), this.options.layout.options)
    }
    if (!this.layout) this.layout = LSD.Layout.get(this);
    for (var i in this.options.layout.transform) {
      this.addLayoutTransformations(this.options.layout.transform); 
      break;
    }
  },
  
  setLayout: function(options) {
    if (!options.layout)
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
      if (Slick.match(element, transformation[0], this.element)) query.transformation = transformation[1];
    }
  },
  
  addLayoutTransformation: function(selector, transformation) {
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