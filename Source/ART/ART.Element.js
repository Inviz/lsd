/*
---
 
script: ART.Element.js
 
description: Smarter injection methods
 
license: MIT-style license.

authors: Yaroslaff Fedin

extends: ART/ART.Element
 
...
*/

(function() {
  
var inserters = {

	before: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
	},

	after: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		element.insertBefore(context, element.firstChild);
	}

};

ART.Element.implement({
  inject: function(element, where){
		if (element.element) element = element.element;
  	inserters[where || 'bottom'](this.element, element, true);
		return this;
	}
});

})();