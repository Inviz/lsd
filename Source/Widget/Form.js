/*
---
 
script: Form.js
 
description: A form widgets. Intended to be submitted.
 
license: MIT-style license.
 
requires:
- ART.Widget.Paint

provides: [ART.Widget.Form]
 
...
*/

ART.Widget.Form = new Class({
  Extends: ART.Widget.Paint,
  
  name: 'form',

	options: {
		element: {
			tag: 'form'
		}
	},
	
	layered: {}
});