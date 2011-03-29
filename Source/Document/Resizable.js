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
  	  window: {
  	    resize: 'onResize'
  	  }
  	},
  	root: true
  },

	initialize: function() {
	  this.style = {
	    current: {}
	  };
	  this.parent.apply(this, arguments);
	  this.attach();
	  this.onResize();
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