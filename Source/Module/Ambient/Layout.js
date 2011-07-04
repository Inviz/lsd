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
  /*
  options: {
    traverse: true,
    extract: true
  },
  */
  
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
    var method = layout.charAt ? 'selector' : 'render';
    return this.getLayout()[method](layout, (parent === false || parent) ? parent : this, options);
  }
});

LSD.Module.Layout.events = {
  /*
    Builds children after element is built
  */
  build: function() {
    this.getLayout();
    if (!this.options.lazy && this.layout.origin == this && this.options.traverse !== false) {
      if (this.origin && !this.options.clone) this.element.replaces(this.origin);
      var nodes = (this.origin || this.element).childNodes;
      this.layout.array(nodes, [this.element, this], this.options.clone ? {clone: true} : null);
    }
    if (this.options.layout) this.buildLayout(this.options.layout);
  },
  /*
    Augments all parsed HTML that goes through standart .write() interface
  */
  write: function(node) {
    this.buildLayout(node);
  },
  /*
    Augments all inserted nodes that come from partial html updates
  */
  DOMNodeInserted: function(node) {
    this.buildLayout(node);
  },
  
  DOMNodeInsertedBefore: function(node, target) {
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