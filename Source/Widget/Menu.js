/*
---
 
script: Menu.js
 
description: Menu widget to be used as a drop down
 
license: MIT-style license.
 
requires:
- ART.Widget.Paint
- Base/Widget.Trait.Animation

provides: [ART.Widget.Menu]
 
...
*/
ART.Widget.Menu = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Animation
  ],
  
  options: {
    animation: {
      duration: 0,
      value: 0
    }
  },
  
  position: 'absolute',
  
  name: 'menu',
  
	layered: {
	  shadow:  ['shadow'],
	  stroke:  ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
	}
});