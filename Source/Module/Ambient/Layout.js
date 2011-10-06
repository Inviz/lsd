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
  - LSD.Layout.Block
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
    },
    
    methods: {
      create: function(content, place) {
        
      }
    }
  },
  
  addLayout: function(name, layout, parent, memo) {
    if (parent == null) parent = [this, (this.wrapper = this.getWrapper())];
    else if (parent && parent.nodeType && !parent.lsd) parent = [this, parent];
    if (!memo) memo = {};
    var old = this.layouts[name];
    if (old) {
      this.document.layout.add(old, parent, memo)
    } else {
      if (memo.elements == null) memo.elements = true
      old = this.document.layout.render(layout, parent, memo);
      if (name != null) this.layouts[name] = old;
    }
    if (memo.promised) {
      memo.promised = false;
      this.addEvent('DOMChildNodesRendered:once', function() {
        this.document.layout.realize(old)
      });
    }
    return old;
  },
  
  removeLayout: function(name, layout, parent, memo) {
    if (parent == null) parent = [this, this.wrapper];
    else if (parent && parent.nodeType && !parent.lsd) parent = [this, parent];
    if (name != null) var old = this.layouts[name];
    return this.document.layout.remove(old || layout, parent, memo);
  }
});

LSD.Module.Layout.events = {
  /*
    Builds children after element is built
  */
  build: function() {
    var role = LSD.Module.Properties.getRole(this);
    if (this.role !== role) 
      this.properties.set('role', role)
  
    if (this.properties.layout)
      this.addLayout('options', this.properties.layout, null, {lazy: true});
      
    if (this.origin && !this.options.clone && this.origin.parentNode && this.origin != this.element) 
      this.element.replaces(this.origin);
    
    if (this.options.traverse !== false && !this.options.lazy) {
      var nodes = LSD.slice((this.origin || this.element).childNodes);
      var opts = {};
      if (this.options.context) opts.context = this.options.context;
      if (this.options.clone) opts.clone = this.options.clone
      if (nodes.length) this.addLayout('children', nodes, null, opts);
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
    this.addLayout('written', node);
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