/*
---
 
script: Hoverable.js
 
description: For the times you need to know if mouse is over or not
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
provides: [LSD.Widget.Trait.Hoverable, LSD.Widget.Trait.Hoverable.State, LSD.Widget.Trait.Hoverable.Stateful]
 
...
*/

LSD.Widget.Trait.Hoverable = new Class({
  options: {
    events: {
      enabled: {
        element: {
          mouseenter: 'mouseenter',
          mouseleave: 'mouseleave'
        }
      }
    }
  }
});

Widget.Events.Ignore.push('hover'); 

LSD.Widget.Trait.Hoverable.State = Class.Stateful({
  'hover': ['mouseenter', 'mouseleave']
});
LSD.Widget.Trait.Hoverable.Stateful = [
  LSD.Widget.Trait.Hoverable.State,
  LSD.Widget.Trait.Hoverable
]
Widget.Attributes.Ignore.push('hoverable');