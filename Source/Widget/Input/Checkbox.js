ART.Widget.Input.Checkbox = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Touchable,
    Widget.Trait.Focus,
    Widget.Trait.Accessibility
  ],
  
  States: {
    'checked': ['check', 'uncheck', 'toggle']
  },
  
  name: 'input',
  
  events: {
    element: {
      click: 'retain'
    }
  },
  
  shortcuts: {
    space: 'toggle'
  },

	layered: {
	  shadow:  ['shadow'],
    stroke: ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
	},

	retain: function() {
	  this.toggle();
	  this.focus();
	}
})