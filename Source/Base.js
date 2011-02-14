/*
---
 
script: Base.js
 
description: Lightweight base widget class to inherit from.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Options
  - Core/Events
 
provides:
  - LSD.Base
...
*/

LSD.Base = new Class({
  initialize: function() {
    this.addEvents({
      attach: function() {
        this.toElement().store('widget', this);
      },
      
      detach: function() {
        this.toElement().eliminate('widget', this);
      }
    }, true);
    this.parent.apply(this, arguments);
  },

  onDOMInject: function(callback) {
    if (this.document) callback.call(this, document.id(this.document)) 
    else this.addEvent('dominject', callback.bind(this))
  },
  
  onChange: function() {
    this.fireEvent('change', arguments)
    return true;
  },
  
  /*
    Wrapper is where content nodes get appended. 
    Defaults to this.element, but can be redefined
    in other Modules or Traits (as seen in Container
    module)
  */
  
  getWrapper: function() {
    return this.toElement();
  }
  
});