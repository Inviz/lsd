ART.Widget.Input = new Class({
  Includes: [
    ART.Widget.Paint,
    ART.Widget.Trait.HasInput
  ],
  
  name: 'input',
  
  attributes: {
    type: 'text'
  },
  
  events: {
    element: {
  	  mousedown: 'retain'
    }
  },
  
  layered: {
    shadow:  ['shadow'],
    stroke: ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
	},
	
	focus: Macro.onion(function() {
	  this.input.focus();
	}),
	
	retain: function() {
	  this.focus();
	},
	
	applyValue: function(item) {
	  this.input.set('value', item);
	}
});