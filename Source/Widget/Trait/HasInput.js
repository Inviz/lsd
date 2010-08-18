
ART.Widget.Trait.HasInput = new Class({
  options: {
    input: {}
  },
  
  events: {
    input: {}
  },
	
	
	attach: Macro.onion(function() {
	  this.getInput().addEvents({
	    blur: this.blur.bind(this),
	    focus: this.focus.bind(this)
	  }).addEvents(this.events.input);
	  this.addEvent('resize', this.setInputSize.bind(this))
	}),
	
  build: Macro.onion(function() {
    this.getInput().inject(this.element);
  }),
  
  getInput: Macro.setter('input', function() {
    return new Element('input', $extend({'type': 'text'}, this.options.input));
  }),
  
  setInputSize: function(size) {
    var height = size.height - this.input.getStyle('padding-top').toInt() - this.input.getStyle('padding-bottom').toInt();
    this.input.setStyle('height', height);
    this.input.setStyle('line-height', height);
    var width = this.size.width - this.input.getStyle('padding-left').toInt() - this.input.getStyle('padding-right').toInt();
    if (this.style.current.glyph) {
      var glyph = this.layers.glyph.measure().width + (this.style.current.glyphRight || 0) + (this.style.current.glyphLeft || 0);
      width -= glyph;
      this.input.setStyle('margin-left', glyph);
    }
    if (this.canceller) width -= this.canceller.getLayoutWidth();
    if (this.glyph) width -= this.glyph.getLayoutWidth();
    this.input.setStyle('width', width);
    return true;
  },
  
  getObservedElement: function() {
    return this.getInput();
  }
})

ART.Widget.Ignore.events.push('input');