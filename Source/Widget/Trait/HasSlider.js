

ART.Widget.Trait.HasSlider = new Class({
  
  options: {
    slider: {
      
    },
    mode: 'horizontal'
  },
  
  events: {
    parent: {
      resize: 'onParentResize'
    },
    slider: {
      
    }
  },
  
  onParentResize: function(current, old) {
    this.adaptSize(current, old);
    this.getSlider(true);
  },
  
  adaptSize: function(current, old) {
    var prop = this.options.mode == 'vertical' ? 'height' : 'width';
    if (current[prop] != old[prop]) this.setStyle(prop, this.parentNode.getStyle(prop) - this.getStyle(prop));
  },
	
	getSlider: function(regenerate) {
	  if (this.slider && regenerate) {
	    this.getSlider().detach();
	    delete this.slider; 
	  }
	  if (!this.slider) {
	    this.slider = new Slider(this.getTrack(), this.getTrackThumb(), $merge(this.options.slider, {
	      mode: this.options.mode
    	})).set(50);
    	this.slider.addEvent('change', this.onSet.bind(this));
    	this.slider.addEvents(this.events.slider)
	  }
	  return this.slider;
	},
	
	onSet: function() {
	  if (Class.hasParent(this)) return this.parent.apply(this, arguments);
	},
	
	getTrack: Macro.defaults(function() {
	  return $(this)
	}),
	
	getTrackThumb: Macro.defaults(function() {
	  return $(this.thumb);
	})
	
});

ART.Widget.Ignore.events.push('slider')