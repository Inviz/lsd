/*
---
 
script: Hoverable.js
 
description: For the times you need to know if mouse is over or not
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
provides: [ART.Widget.Trait.Hoverable, ART.Widget.Trait.Hoverable.State, ART.Widget.Trait.Hoverable.Stateful]
 
...
*/

ART.Widget.Trait.Hoverable = new Class({
  events: {
    enabled: {
      element: {
        mouseenter: 'mouseenter',
        mouseleave: 'mouseleave'
      }
    }
  }
});

Widget.Events.Ignore.push('hover'); 

ART.Widget.Trait.Hoverable.State = Class.Stateful({
  'hover': ['mouseenter', 'mouseleave']
});
ART.Widget.Trait.Hoverable.Stateful = [
  ART.Widget.Trait.Hoverable.State,
  ART.Widget.Trait.Hoverable
]
Widget.Attributes.Ignore.push('hoverable');