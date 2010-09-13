/*
---
 
script: Fx.js
 
description: Very basic tweening for SVG
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART
- Fx.CSS
 
provides: [ART.Fx ]
 
...
*/

ART.Fx = new Class({

	Extends: Fx.CSS,

	initialize: function(widget, options){
	  this.widget = widget;
		this.element = this.subject = document.id(widget);
		this.parent(options);
	},

	prepare: function(widget, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = widget.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},
	
	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.widget.setStyle(property, now[0].value);
		this.widget.render();
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.widget, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});