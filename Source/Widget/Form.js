ART.Widget.Form = new Class({
  Extends: ART.Widget.Paint,
  
  name: 'form',

	options: {
		element: {
			tag: 'form'
		}
	},
	
	properties: ['cornerRadius', 'offset'],
	
	layered: {}
})