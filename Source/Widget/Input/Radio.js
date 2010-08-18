ART.Widget.Input.Radio = new Class({
  Includes: [
    ART.Widget.Paint,
    Widget.Trait.Touchable,
    Widget.Trait.Focus,
    Widget.Trait.Accessibility
  ],
  
  States: {
    'checked': ['check', 'uncheck']
  },
  
  name: 'input',
  
  events: {
    element: {
      click: 'retain'
    }
  },
  
  shortcuts: {
    space: 'check'
  },

	layered: {
	  shadow:  ['shadow'],
    stroke: ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
	},
	
	check: Macro.onion(function() {
	  this.getGroup().each(function(element) {
	    if (element != this.element && element.getAttribute('type') == 'radio') element.retrieve('widget').uncheck();
	  }, this)
	}),
	
	getGroup: function() {
	  return (this.attributes.name) ? document.getElements('.art.input[name="' + this.attributes.name + '"]') : []
	},
	
	retain: function() {
	  this.check();
	  this.focus();
	}
})