/*
---
 
script: Footer.js
 
description: SVG-Based footer element (like <footer> in html5)
 
license: MIT-style license.
 
requires:
- ART.Widget.Section

provides: [ART.Widget.Footer]
 
...
*/

ART.Widget.Footer = new Class({
  Extends: ART.Widget.Section,
  
  name: 'footer',

	options: {
		element: {
			tag: ART.html5 ? 'footer' : 'div'
		}
	}
});