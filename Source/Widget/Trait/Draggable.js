/*
---
 
script: Draggable.js
 
description: Drag widget around the screen
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
- More/Drag

provides: [LSD.Widget.Trait.Draggable, LSD.Widget.Trait.Draggable.Stateful, LSD.Widget.Trait.Draggable.State]
 
...
*/

LSD.Widget.Trait.Draggable = new Class({
  options: {
    actions: {
      draggable: {
        enable: function(handle) {
          if (this.dragger) this.dragger.attach();
          else this.getDragger();
          if (handle) document.id(handle).addEvent('mousedown', this.dragger.bound.start);
        },

        disable: function(handle) {
          if (!this.dragger) return;
          this.dragger.detach();
          if (handle) document.id(handle).removeEvent('mousedown', this.dragger.bound.start);
        }
      }
    },
    events: {
      dragger: {},
      element: {
        dragstart: function() {
          return false;
        }
      }
    },
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
    }
  },
  
  getDragger: Macro.getter('dragger', function() {
    var element = this.element;
    this.onDOMInject(function() {
      var position = element.getPosition();
      element.left = position.x - element.getStyle('margin-left').toInt();
      element.top = position.y - element.getStyle('margin-top').toInt();
    }.create({delay: 50}));
    var dragger = new Drag(element, this.options.dragger);
    dragger.addEvents(this.events.dragger);
    dragger.addEvents({
      'start': this.onDragStart.bind(this),
      'complete': this.onDragComplete.bind(this),
      'cancel': this.onDragComplete.bind(this),
      'drag': this.onDrag.bind(this)
    }, true);
    return dragger;
  }),

  onDragStart: function() {
    this.drag.apply(this, arguments);
  },
  
  onDragComplete: function() {
    this.drop.apply(this, arguments);
  },
  
  onDrag: function() {
    this.setStyle('top', this.dragger.value.now.y);
    this.setStyle('left', this.dragger.value.now.x);
  }
});

LSD.Widget.Trait.Draggable.State = Class.Stateful({
  'dragged': ['drag', 'drop'],
  'draggable': ['mobilize', 'immobilize']
});
LSD.Widget.Trait.Draggable.Stateful = [
  LSD.Widget.Trait.Draggable.State,
  LSD.Widget.Trait.Draggable
];
Widget.Events.Ignore.push('dragger');
Widget.Attributes.Ignore.push('draggable');