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
})