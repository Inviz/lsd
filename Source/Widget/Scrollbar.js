ART.Widget.Scrollbar = new Class({
  Includes: [
    ART.Widget.Paint,
    ART.Widget.Trait.HasSlider
  ],
  
  name: 'scrollbar',
  
  position: 'absolute',
	
	layout: {
    'scrollbar-track#track': {
      'scrollbar-thumb#thumb': {},
    },
	  'scrollbar-button#decrement': {},
	  'scrollbar-button#increment': {}
	},
	
	layered: {
    stroke: ['stroke'],
	  background: ['fill', ['backgroundColor'], function(width, height, cornerRadius, color) {
	    this.draw(width - 2, height - 3, cornerRadius.map(function(r) { return r - 1}));
  		if (color) this.fill.apply(this, $splat(color));
  		this.translate(1, 2);
	  }],
	  reflection:  ['fill', ['reflectionColor'], function(width, height, cornerRadius, color) {
	    this.draw(width - 2, height - 2, cornerRadius.map(function(r) { return r - 1}));
  		if (color) this.fill.apply(this, $splat(color));
  		this.translate(1, 1);
	  }]
	},
	
	options: {
	  slider: {
	    wheel: true
	  }
	},
	
	events: {
	  parent: {
  	  resize: 'adaptToSize'
	  }
	},
	
	initialize: function() {
	  this.parent.apply(this, arguments);
	  this.addPseudo(this.options.mode);
	},
	
	adaptToSize: function(size){
	  if (!size || $chk(size.height)) size = this.parentNode.size;
	  var other = (this.options.mode == 'vertical') ? 'horizontal' : 'vertical';
	  var prop = (this.options.mode == 'vertical') ? 'height' : 'width';
	  var setter = 'set' + prop.capitalize();
	  var value = size[prop];
	  if (isNaN(value) || !value) return;
	  var invert = this.parentNode[other];
	  var scrolled = this.getScrolled();
	  $(scrolled).setStyle(prop, size[prop])
	  var ratio = size[prop] / $(scrolled).scrollWidth
	  var delta = (!invert || invert.hidden ? 0 : invert.getStyle(prop));
    this[setter](size[prop] - delta);
    var trackWidth = size[prop] - 16 * 2 - delta;
	  //console.info(size[prop], ($(scrolled).offsetWidth), $(scrolled).scrollWidth, ratio, trackWidth)
    this.track[setter](trackWidth);
    this.track.thumb[setter](Math.ceil(trackWidth * ratio))
    this.getSlider()
    this.refresh();
	},
	
	inject: Macro.onion(function(widget) {
	  this.adaptToSize(widget.size);
	}),
	
	onSet: function(value) {
    var prop = (this.options.mode == 'vertical') ? 'height' : 'width';
    var direction = (this.options.mode == 'vertical') ? 'top' : 'left';
    var result = value * this.parentNode.element['scroll' + prop.capitalize()];
    $(this.getScrolled())['scroll' + direction.capitalize()] = result
	},
	
	getScrolled: function() {
	  if (!this.scrolled) {
	    var parent = this;
      while ((parent = parent.parentNode) && !parent.getScrolled);
      this.scrolled = parent.getScrolled ? parent.getScrolled() : this.parentNode.element;
	  }
	  return this.scrolled;
	},
	
	dispose: function() {
	  var parent = this.parentNode;
	  if (!this.parent.apply(this, arguments)) return;
	  parent.removeEvents(this.events.parent);
	  return true;
	},
	
	getTrack: function() {
	  return $(this.track)
	},
	
	getTrackThumb: function() {
	  return $(this.track.thumb);
	},
	
	hide: Macro.onion(function() {
	  this.element.setStyle('display', 'none');
	}),
	
	show: Macro.onion(function() {
	  this.element.setStyle('display', 'block');
	})
})

ART.Widget.Scrollbar.Track = new Class({
  Extends: ART.Widget.Section,
  
  name: 'track',
  
  position: 'absolute'
});

ART.Widget.Scrollbar.Thumb = new Class({
  Extends: ART.Widget.Button,
  
  name: 'thumb'
});

ART.Widget.Scrollbar.Button = new Class({
  Extends: ART.Widget.Button,
  
  position: 'absolute'
});