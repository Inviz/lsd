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
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      },
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
    this.addEvent('ready', function() {
      var position = element.getPosition();
      element.left = position.x - element.getStyle('margin-left').toInt();
      element.top = position.y - element.getStyle('margin-top').toInt();
    }.create({delay: 50}));
    this.dragger = new Drag(element, Object.append(this.options.dragger, this.options.dragger));
    this.dragger.addEvents(this.events.dragger);
    this.dragger.addEvents({
      'start': this.onDragStart.bind(this),
      'complete': this.onDragComplete.bind(this),
      'cancel': this.onDragComplete.bind(this),
      'drag': this.onDrag.bind(this)
    }, true);
    return this.dragger;
  },
  
  onDragStart: function() {
    this.onStateChange('dragged', true);
  },
  
  onDragComplete: function() {
    this.onStateChange('dragged', false);
  },
  
  onDrag: function() {
    this.setStyles({
      top: this.dragger.value.now.y,
      left: this.dragger.value.now.x
    });
  }
  
});

LSD.Behavior.define('[draggable]', 'draggable');