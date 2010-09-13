/*
---
 
script: Hoverable.js
 
description: For the times you need to know if mouse is over or not
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
provides: [ART.Widget.Trait.Hoverable]
 
...
*/

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
//ART.Widget.Ignore.attributes.push('hoverable');