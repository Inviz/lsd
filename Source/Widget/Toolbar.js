ART.Widget.Toolbar = new Class({
	
	Extends: ART.Widget.Paint,
	
	name: 'toolbar',
	
	layout: {},
	
	layered: {
	  stroke:  ['stroke'],
	  reflection: ['fill', ['reflectionColor']],
  	background: ['fill', ['backgroundColor']],
	},
	
	position: 'absolute',
	
	attach: Macro.onion(function() {
	  switch (this.options.position) {
	    case "bottom":
	      this.element.setStyles({bottom: 0, left: 0});
	      break;
	    case "top":
	      this.element.setStyles({top: 0, left: 0});
	      break;
	  }
	})
	
});