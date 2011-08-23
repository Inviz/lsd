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
  - LSD.Layout.Branch
  - LSD.Layout.Microdata
  - LSD.Layout.Promise

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
      if (!options.document && !this.document && LSD.document) 
        this.properties.set('document', LSD.document);
      this.layouts = {};
    }
  },
  
  addLayout: function(name, layout, parent, memo) {
    if (!memo) memo = {};
    var old = this.layouts[name];
    if (old) {
      this.document.layout.add(old, parent, memo)
    } else {
      var first = layout.push && layout.length && layout[0];
      var method = (first && first.nodeType && ((first.nodeType != 1) || (!first.lsd))) ? 'children' : 'render';
      old = this.layouts[name] = this.document.layout[method](layout, parent, memo);
    }
    if (memo.promised) {
      memo.promised = false;
      this.addEvent('DOMChildNodesRendered:once', function() {
        this.document.layout.realize(old)
      });
    }
    return this.layouts[name];
  },
  
  removeLayout: function(name, layout, parent, memo) {
    return this.document.layout.remove(this.layouts[name] || layout, parent, memo);
  },
  
  buildLayout: function(layout, parent, memo) {
    return this.document.layout[layout.charAt ? 'selector' : 'render'](layout, (!parent && parent !== false) ? this : parent, memo)
  }
});

LSD.Module.Layout.events = {
  /*
    Builds children after element is built
  */
  build: function() {
    if (this.properties.layout) {
      this.addLayout('options', this.properties.layout, [this, this.getWrapper()], {lazy: true});
    }
    if (this.origin && !this.options.clone && this.origin.parentNode && this.origin != this.element) 
      this.element.replaces(this.origin);
    if ((!this.options.lazy && this.options.traverse !== false) || (this.origin && this.origin != this.element)) {
      var nodes = LSD.slice((this.origin || this.element).childNodes);
      var opts = {};
      if (this.options.context) opts.context = this.options.context;
      if (this.options.clone) opts.clone = this.options.clone;
      if (nodes.length) this.addLayout('children', nodes, [this, this.getWrapper()], opts);
      this.fireEvent('DOMChildNodesRendered');
    }
  },
  /* 
    Destroys the built layout with the widget 
  */
  destroy: function() {
    if (this.layouts.children) this.removeLayout('children');
    if (this.layouts.options) this.removeLayout('options');
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
    add: function(value) {
      this.properties.set('layout', value);
    },
    remove: function(value) {
      this.properties.unset('layout', value);
    }
  }
});