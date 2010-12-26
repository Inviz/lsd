/*
---
 
script: Resizable.js
 
description: Document that redraws children when window gets resized.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document
  - LSD.Widget.Module.Layout
  - Base/Widget.Module.Events
  - Base/Widget.Module.Attributes
 
provides:
  - LSD.Document.Resizable
 
...
*/

LSD.Document.Resizable = new Class({
	Includes: [
    LSD.Document,
    LSD.Widget.Module.Layout,
    Widget.Module.Events,
    Widget.Module.Attributes
	],
	
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
	 // this.onResize();
	  this.element.set('userSelect', false)
	},
	
	attach: $lambda(true),
	
	detach: $lambda(true),
	
	onResize: function() {
	  Object.append(this.style.current, document.getCoordinates());
	  this.render()
	},
	
	render: function() {
		this.childNodes.each(function(child){
		  child.refresh();
		});
	}
});