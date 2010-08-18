ART.Widget.Input.Range = new Class({
  Includes: [
    ART.Widget.Paint,
    ART.Widget.Trait.HasSlider,
    Widget.Trait.Focus,
    Widget.Trait.Accessibility
  ],
  
  name: 'input',
	
	layered: {
	  shadow: ['shadow'],
    border: ['stroke'],
	  background: ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']]
	},
	
	initialize: function() {
	  this.parent.apply(this, arguments);
	  this.addPseudo(this.options.mode);
	  this.getSlider();
	},

	onSet: function() {
	  this.focus();
	},
	
	layout: {
    'input-range-thumb#thumb': {}
	},
	
	shortcuts: {
	  next: 'increment',
	  previous: 'decrement'
	},
	
	increment: function() {
	  this.slider.set(this.slider.step + 10)
	},
	
	decrement: function() {
	  this.slider.set(this.slider.step - 10)
	}
})

ART.Widget.Input.Range.Thumb = new Class({
  Includes: [
    ART.Widget.Button
  ],
  
  name: 'thumb'
});