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
  
  this.dragger.addEvents({
    'start': this.onDragStart.bind(this),
    'complete': this.onDragComplete.bind(this),
    'cancel': this.onDragComplete.bind(this),
    'drag': this.onDrag.bind(this)
  }, true);
  properties: {
    element: '.element',

    attached: {
      src: '.attached',
      set: function(value) {
        if (value) {
          this.attach()
        } else {
          this.detach();
        }
      }
    },

    handle: {
      source: '.handle',
      set: function(value) {
        t
      },
    
    }
  },
  
  events: '.events',
  
  onStart: function() {
    this.set('_parent.dragged', true);
  },
  
  onComplete: function() {
    this.unset('_parent.dragged', true);
  },
  
  onCancel: function() {
    this.unset('_parent.dragged', true);
  },
  
  onDrag
  
  options: {
    grid: false,
    style: true,
    limit: false,
    handle: false,
    invert: false,
    preventDefault: false,
    stopPropagation: false,
    modifiers: {x: 'left', y: 'top'}
  }
})

LSD.Mixin.Draggable = new Class({
  options: {
    dragger: {
      modifiers: {
        x: 'left',
        y: 'top'
      },
      snap: 5,
      style: false,
      container: true,
      handle: []
    },
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