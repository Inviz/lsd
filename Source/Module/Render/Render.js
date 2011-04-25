/*
---
 
script: Render.js
 
description: A module that provides rendering workflow
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

provides: 
  - LSD.Module.Render

...
*/



LSD.Module.Render = new Class({
  options: {
    render: null
  },
  
  initializers: {
    render: function() {
      this.redraws = 0;
      this.dirty = true;
    }
  },
  
  stateChange: function() {
    if (this.redraws > 0) this.refresh(true);
  },
  
  render: function() {
    if (!this.built) this.build();
    delete this.halted;
    this.redraws++;
    this.fireEvent('render', arguments)
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
    if (recursive) this.walk(function(widget) {
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
  },
  

  /*
    Halt marks widget as failed to render.
    
    Possible use cases:
    
    - Dimensions depend on child widgets that are not
      rendered yet
    - Dont let the widget render when it is not in DOM
  */ 
  halt: function() {
    if (this.halted) return false;
    this.halted = true;
    return true;
  }
});