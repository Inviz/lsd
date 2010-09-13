/*
---
 
script: Glyph.js
 
description: Like a button with icon but without a button, actually
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Paint
- Base/Widget.Trait.Touchable

provides: [ART.Widget.Glyph]
 
...
*/

ART.Widget.Glyph = new Class({
  Includes: [
		ART.Widget.Paint,
  	Widget.Trait.Touchable
	],
	
  name: 'glyph',
	
	options: {
		name: null
	},

	layered: {
    glyph: ['glyph']
	},
	
	initialize: function() {
		this.parent.apply(this, arguments);
		if (this.options.name) this.style.current.glyphName = this.options.name;
	},
	
	build: function() {
	  if (!this.parent.apply(this, arguments)) return
		this.layers = {
		  glyph: new ART.Shape
		}
		return true;
	}
});