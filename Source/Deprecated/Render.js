/*
---
 
script: Render.js
 
description: A module that provides rendering workflow
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.DOM
  - LSD.Module.Events

provides: 
  - LSD.Module.Render

...
*/



LSD.Module.Render = new Class({
  constructors: {
    render: function() {
      this.redraws = 0;
      this.dirty = true;
    }
  },
  
  render: function() {
    if (!this.built) this.build();
    this.redraws++;
    this.fireEvent('render', arguments);
    if (!this.rendered) this.properties.set('rendered', true);
    this.childNodes.each(function(child){
      if (child.render) child.render();
    });
  },
  
  /*
    Update marks widget as willing to render. That
    can be followed by a call to *render* to trigger
    redrawing mechanism. Otherwise, the widget stay 
    marked and can be rendered together with ascendant 
    widget.
  */
  
  update: function(recursive) {
    if (recursive) LSD.Module.DOM.each(this, function(widget) {
      widget.update();
    });
  },
  
  /*
    Refresh updates and renders widget (or a widget tree 
    if optional argument is true). It is a reliable way
    to have all elements redrawn, but a costly too.
    
    Should be avoided when possible to let internals 
    handle the rendering and avoid some unnecessary 
    calculations.
  */

  refresh: function(recursive) {
    this.update(recursive);
    return this.render();
  }
});

LSD.Module.Events.addEvents.call(LSD.Module.Render.prototype, {
  stateChange: function() {
    if (this.redraws > 0) this.refresh(true);
  }
});