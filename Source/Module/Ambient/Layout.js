/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Layout

provides: 
  - LSD.Module.Layout
 
...
*/
  
LSD.Module.Layout = new Class({
  options: {
    traverse: true,
    extract: true
  },
  
  initializers: {
    layout: function(options) {
      this.rendered = {};
    }
  },
  
  setLayout: function(layout) {
    if (typeOf(layout) == 'layout') this.layout = this;
    else this.options.layout = layout;
  },
  
  unsetLayout: function(layout) {
    if (this.layout == layout) delete this.layout;
    else delete this.options.layout;
  },
  
  getLayout: Macro.getter('layout', function() {
    var options = { interpolate: this.options.interpolate, clone: this.options.clone };
    if (this.options.context) options.context = this.options.context;
    return new LSD.Layout(this, null, options);
  }),
  
  buildLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, (parent === false || parent) ? parent : this, options);
  },
  
  extractLayout: function(element) {
    this.extracted = LSD.Layout.extract(element);
    if (this.tagName || this.options.source) delete this.extracted.tag;
    this.setOptions(this.extracted);
    this.fireEvent('extractLayout', [this.extracted, element]);
  }
});

LSD.Module.Layout.events = {
  /*
    Extracts and sets layout options from attached element
  */
  attach: function(element) {
    if (!this.extracted && this.options.extract) 
      this.extractLayout(element);
  },
  /*
    Unsets options previously extracted from the detached element
  */
  detach: function() {
    if (!this.extracted) return;
    this.unsetOptions(this.extracted);
    delete this.extracted, delete this.origin;
  },
  /*
    Mutates element and extract options off it.
  */
  beforeBuild: function(query) {
    if (!query.element) return;
    if (this.options.extract || this.options.clone) this.extractLayout(query.element);
    var tag = this.getElementTag(true);
    if (this.options.clone || (tag && LSD.toLowerCase(query.element.tagName) != tag)) {
      this.origin = query.element;
      query.convert = false;
    }
  },
  /*
    Builds children after element is built
  */
  build: function() {
    if (this.getLayout().origin == this && this.options.traverse !== false) {
      if (this.origin && !this.options.clone) this.element.replaces(this.origin);
      var nodes = LSD.slice((this.origin || this.element).childNodes);
      this.getLayout().result = this.getLayout().render(nodes, [this.element, this], this.options.clone ? {clone: true} : null);
    }
    if (this.options.layout) this.buildLayout(this.options.layout);
  },
  /*
    Augments all parsed HTML that goes through standart .write() interface
  */
  write: function() {
    this.buildLayout.apply(this, arguments);
  },
  /*
    Augments all inserted nodes that come from partial html updates
  */
  DOMNodeInserted: function(node) {
    this.buildLayout.apply(this, arguments);
  },
  
  DOMNodeInsertedBefore: function(node, target) {
    this.buildLayout(node, this, {before: target});
  },
  
  DOMNodeReplaced: function(node, target) {
    this.buildLayout(node, this, {before: target});
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Layout.prototype, LSD.Module.Layout.events);

Object.append(LSD.Options, {
  layout: {
    add: 'setLayout',
    remove: 'unsetLayout'
  }
});