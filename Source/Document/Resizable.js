/*
---
 
script: Resizable.js
 
description: Document that redraws children when window gets resized.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document
  - LSD.Module.Layout
  - LSD.Module.Events
  - Core/Element.Dimensions
 
provides:
  - LSD.Document.Resizable
 
...
*/

LSD.Document.Resizable = new Class({
	
	options: {
  	events: {
  	  _resizable: {
  	    window: {
  	      resize: 'onResize'
  	    },
  	    self: {
  	      build: 'onResize'
  	    }
  	  }
  	},
  	root: true
  },
	
	onResize: function() {
	  if (document.getCoordinates) Object.append(this.style.current, document.getCoordinates());
	  this.render()
	},
	
	render: function() {
		this.childNodes.each(function(child){
		  if (child.refresh) child.refresh();
		});
	}
});