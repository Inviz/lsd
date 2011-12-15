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
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Layout.prototype, LSD.Module.Layout.events);
