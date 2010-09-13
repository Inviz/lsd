/*
---
 
script: Panel.js
 
description: A fieldset like widget for various content
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint

provides: [ART.Widget.Panel]
 
...
*/

ART.Widget.Panel = new Class({
	Extends: ART.Widget.Paint,
	
	States: {
  	'collapsed': ['collapse', 'expand']
	},
	
	name: 'panel',
	
	layout: {},
	
	layered: {
	  shadow:  ['shadow'],
	  stroke:  ['stroke'],
	  reflection: ['fill', ['reflectionColor']],
  	background: ['fill', ['backgroundColor']],
	  innerShadow:  ['inner-shadow']
	}
	
});