/*
---
 
script: Menu.js
 
description: Menu widget base class
 
license: MIT-style license.
 
requires:
- ART.Widget.Paint
- Base/Widget.Trait.Animation

provides: [ART.Widget.Menu]
 
...
*/
ART.Widget.Menu = new Class({
  Extends: ART.Widget.Paint,
  
  name: 'menu',
  
	layered: {
	  shadow:  ['shadow'],
	  stroke:  ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
	}
});