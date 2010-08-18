/*
Script: ART.Widget.Button.js

License:
	MIT-style license.
*/

// Button Widget. Work in progress.

ART.Widget.Button = new Class({

	Includes: [
		ART.Widget.Paint,
		Widget.Trait.Touchable
	],

	name: 'button',

	options: {
		label: ''
	},
	
	events: {
	  element: {
	    click: 'onClick'
	  }
	},
	
	layered: {
	  shadow:  ['shadow'],
    stroke: ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
	},
	
	onClick: function() {
		this.fireEvent('click', arguments);
	},

  setContent: Macro.onion(function(content) {
    this.addPseudo('text')
  })

});
