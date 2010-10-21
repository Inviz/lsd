/*
---
 
script: Context.js
 
description: Menu widget to be used as a drop down
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Menu
provides: [ART.Widget.Menu.Context]
 
...
*/
ART.Widget.Menu.Context = new Class({
  Includes: [
    ART.Widget.Menu,
    Widget.Trait.Animation.Instant
  ],

  layered: {
    shadow:  ['shadow'],
    stroke:  ['stroke'],
    background:  ['fill', ['backgroundColor']],
    reflection:  ['fill', ['reflectionColor']],
  },
  
  attributes: {
    type: 'context'
  }
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
    }
  },
  
  name: 'option',
  
  layered: {
    fill:  ['stroke'],
    reflection:  ['fill', ['reflectionColor']],
    background: ['fill', ['backgroundColor']]
  }
});