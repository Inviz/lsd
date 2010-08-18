
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