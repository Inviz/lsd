/*
---
 
script: Context.js
 
description: Menu widget to be used as a drop down
 
license: MIT-style license.
 
requires:
- ART.Widget.Menu

provides: [ART.Widget.Menu.Context]
 
...
*/
ART.Widget.Menu.Context = new Class({
  Implements: [
    ART.Widget.Menu,
    Widget.Trait.Animation
  ],

  options: {
    animation: {
      duration: 0,
      value: 0
    }
  },
  
  position: 'absolute'
});

ART.Widget.Menu.Context.Item = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Item.Stateful
  ],
  
  events: {
    element: {
      mouseenter: 'select',
      mousedown: 'select'
    },
    self: {
      inject: 'setList'
    }
  },
  
  name: 'option',
  
	layered: {
	  fill:  ['stroke'],
	  reflection:  ['fill', ['reflectionColor']],
	  background: ['fill', ['backgroundColor']]
	}
});