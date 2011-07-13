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
  
  constructors: {
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
    var options = {};
    if (this.options.clone) options.clone = true;
    if (this.options.interpolate) options.interpolate = this.options.interpolate.bind(this)
    if (this.options.context) options.context = this.options.context;
    return new LSD.Layout(this, null, options);
  }),
  
  addLayout: function(name, layout, parent, opts) {
    var old = this.rendered[name];
    var method = old ? 'add' : 'render';
    this.rendered[name] = this.layout[method](old || layout, parent, opts);
  },
  
  removeLayout: function(name, layout, parent, opts) {
    var rendered = this.rendered[name];
    if (rendered) this.layout.remove(rendered, parent, opts);
  },
  
  buildLayout: function(layout, parent) {
    var method = layout.charAt ? 'selector' : 'render';
    var instance = this.getLayout();
    if (!parent && parent !== false) {
      var args = Array.prototype.slice.call(arguments, 0);
      args[1] = this;
    }
    return instance[method].apply(instance, args || arguments);
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
      this.addLayout('children', nodes, [this, this.getWrapper()], this.options.clone ? {clone: true} : null);
    }
    if (this.options.layout) this.addLayout('options', this.options.layout, [this, this.getWrapper()]);
  },
  /* 
    Destroys the built layout with the widget 
  */
  destroy: function() {
    if (this.rendered.children) this.removeLayout('children');
    if (this.rendered.options) this.removeLayout('options');
  },  
  /*
    Augments all parsed HTML that goes through standart .write() interface
  */
  write: function(node) {
    this.addLayout('written', node, [this, this.getWrapper()]);
  },
  /*
    Augments all inserted nodes that come from partial html updates
  */
  DOMNodeInserted: function(node) {
    this.buildLayout(node, [this, this.getWrapper()]);
  },
  
  DOMNodeInsertedBefore: function(node, target) {
    this.buildLayout(node, [this, this.getWrapper()], null, {before: target});
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Layout.prototype, LSD.Module.Layout.events);

Object.append(LSD.Options, {
  layout: {
    add: 'setLayout',
    remove: 'unsetLayout'
  }
});