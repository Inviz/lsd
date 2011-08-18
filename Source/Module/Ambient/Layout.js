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
    if (typeOf(layout) == 'layout') this.layout = layout;
    else this.options.layout = layout;
  },
  
  unsetLayout: function(layout) {
    if (this.layout == layout) delete this.layout;
    else delete this.options.layout;
  },
  
  getLayout: function() {
    if (!this.layout) this.layout = new LSD.Layout(this);
    return this.layout;
  },
  
  addLayout: function(name, layout, parent, memo) {
    if (!memo) memo = {};
    var old = this.rendered[name];
    if (old) {
      this.layout.add(old, parent, memo)
    } else {
      var first = layout.push && layout.length && layout[0];
      var method = (first && first.nodeType && ((first.nodeType != 1) || (!first.lsd))) ? 'children' : 'render';
      old = this.rendered[name] = this.layout[method](layout, parent, memo);
    }
    if (memo.promised) {
      memo.promised = false;
      this.addEvent('DOMChildNodesRendered:once', function() {
        this.layout.realize(old)
      });
    }
    return this.rendered[name];
  },
  
  removeLayout: function(name, layout, parent, memo) {
    return this.layout.remove(this.rendered[name] || layout, parent, memo);
  },
  
  buildLayout: function(layout, parent, memo) {
    var args = [layout, (!parent && parent !== false) ? this : parent, memo];
    var instance = this.getLayout();
    var method = layout.charAt ? 'selector' : 'render';
    return instance[method].apply(instance, args);
  }
});

LSD.Module.Layout.events = {
  /*
    Builds children after element is built
  */
  build: function() {
    this.getLayout();
    if (this.options.layout) {
      var memo = {lazy: this.options.lazy || this.layout.origin == this}, parents = [this, this.getWrapper()];
      this.addLayout('options', this.options.layout, parents, memo);
    }
    if (this.origin && !this.options.clone && this.origin.parentNode) this.element.replaces(this.origin);
    if (!this.options.lazy && this.layout.origin == this && this.options.traverse !== false) {
      var nodes = LSD.slice((this.origin || this.element).childNodes);
      var opts = {}
      if (this.options.context) opts.context = this.options.context;
      if (this.options.clone) opts.clone = this.options.clone;
      if (nodes.length) this.addLayout('children', nodes, [this, this.getWrapper()], opts);
      this.fireEvent('DOMChildNodesRendered')
      this.fireEvent('ready');
    }
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