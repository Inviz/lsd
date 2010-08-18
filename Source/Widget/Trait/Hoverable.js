ART.Widget.Trait.Hoverable = new Class({
  States: {
    'hover': ['mouseenter', 'mouseleave']
  },
  
  events: {
    hover: {
      element: {
        mouseenter: 'mouseenter',
        mouseleave: 'mouseleave'
      }
    }
  },
  
  
	attach: Macro.onion(function(){
		this.addAction({
		  enable: function() {
      	this.addEvents(this.events.hover);
  	  },
  	  
  	  disable: function() {
    	  this.removeEvents(this.events.hover);
  		}
  	})
	})
});

ART.Widget.Ignore.events.push('hover'); 
ART.Widget.Ignore.attributes.push('hoverable');