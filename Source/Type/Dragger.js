/*
---
 
script: Draggable.js
 
description: Drag widget around the screen
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - More/Drag

provides: 
  - LSD.Mixin.Draggable
 
...
*/

LSD.Property.Dragger = new LSD.Class({
  Extends: Drag,
  
  options: {
    modifiers: {
      x: 'left',
      y: 'top'
    },
    snap: 5,
    style: false,
    container: true,
    handle: []
  },
  
  properties: {
    element: '.element',

    attached: function(value) {
      if (value) {
        this.attach()
      } else {
        this.detach();
      }
    },

    handle: function(value) {
      
    },
  },
  
  events: '.events',
  
  onStart: function() {
    this.include('started');
  },
  
  onComplete: function() {
    this.erase('started');
  },
  
  onCancel: function() {
    this.erase('started');
  },
  
  onDrag: function() {
    this.position
  }
  
})

LSD.Mixin.Draggable = new Class({
  options: {
    dragger: ,
    actions: {
      draggable: {
        enable: function(handle) {
          if (this.index++ == 0) {
            if (this.dragger) this.dragger.attach();
            else this.getDragger();
            this.onStateChange('draggable', true);
          }
          if (!handle) return;
          this.handles.push(handle);
          document.id(handle).addEvent('mousedown', this.dragger.bound.start);
        },
        
        disable: function(handle) {
          if (!this.dragger) return;
          if (--this.index == 0) {
            this.onStateChange('draggable', false);
            this.dragger.detach();
          }
          if (!handle) return;
          this.handles.erase(handle)
          document.id(handle).removeEvent('mousedown', this.dragger.bound.start);
        }
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.handles = [];
    this.index = 0;
  },
  
  unitialize: function() {
    this.handles.each(this.options.actions.draggable.disable, this);
    this.onStateChange('draggable', false);
    delete this.dragger;
  },
  
  getDragger: function() {
    if (this.dragger) return this.dragger;
    var element = this.element;
    return this.dragger;
  },
  
});

LSD.Behavior.define('[draggable]', 'draggable');