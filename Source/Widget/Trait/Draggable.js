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
        uses: ['title', 'content'], 

        enable: function() {
          if (this.dragger) this.dragger.attach();
          else this.getDragger();
        },

        disable: function() {
          if (this.dragger) this.dragger.detach();
        }
      }
    },
    events: {
      dragger: {},
      element: {
        dragstart: $lambda(false)
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
      }
    }
  },
  
  getDragger: Macro.getter('dragger', function() {
    var element = this.getDragged().toElement();
    this.onDOMInject(function() {
      var position = element.getPosition();
      element.left = position.x - element.getStyle('margin-left').toInt();
      element.top = position.y - element.getStyle('margin-top').toInt();
    }.create({delay: 50}));
    var dragger = new Drag(element, $extend({
      handle: document.id(this.getDragHandle())
    }, this.options.dragger));
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
  },
  
  getDragHandle: Macro.defaults(function() {
    return this.header.title;
  }),

  getDragged: Macro.defaults(function() {
    return this;
  })
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