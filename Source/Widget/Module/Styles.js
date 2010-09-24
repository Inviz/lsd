/*
---
 
script: Styles.js
 
description: Set, get and render different kind of styles on widget
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- Core/Element.Style
- Ext/FastArray

provides: [ART.Widget.Module.Styles, ART.Styles]
 
...
*/

(function() {
	
	ART.Styles = new FastArray(
	  'glyphColor', 'glyphShadow', 'glyphSize', 'glyphStroke', 'glyph', 'glyphColor', 'glyphColor', 'glyphHeight', 'glyphWidth', 'glyphTop', 'glyphLeft', 		
		'cornerRadius', 'cornerRadiusTopLeft', 'cornerRadiusBottomLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight',		
		'reflectionColor',  'backgroundColor', 'strokeColor', 'fillColor', 'starRays',
		'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'userSelect'
	)
	
	ART.ComplexStyles = {
		'cornerRadius': {
			set: ['cornerRadiusTopLeft', 'cornerRadiusBottomLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight'],
			get: ['cornerRadiusTopLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight', 'cornerRadiusBottomLeft']
		}
	}
})();


ART.Widget.Module.Styles = new Class({
	
	style: {
		current: {},    //styles that widget currently has
		last: {},       //styles that were rendered last frame
		found: {},      //styles that were found in stylesheets
		given: {},      //styles that were manually assigned
		
		calculated: {}, //styles that are calculated in runtime
		computed: {},   //styles that are already getStyled
		implied: {},    //styles that are assigned by environment
		
		element: {},    //styles that are currently assigned to element
		paint: {}      //styles that are currently used to paint
	},
	
	rules: {
	  current: [],
	  possible: null
	},
	
	findStyles: function() {
		var found = this.lookupStyles();
		if (found) {
			for (var property in found.style) if (property in this.style.given) delete found.style[property];
			var changed = false;
			for (var property in found.style) if (!$equals(found.style[property], this.style.current[property])) {
			  changed = true;
			  break;
			}
			if (!changed) for (var property in this.style.found) if (!(property in found.style)) {
			  changed = true;
			  break;
			}
			if (changed) {
  			this.style.found = found.style;
  			this.setStyles(found.style, true);
  			for (var property in found.implied) if (property in this.style.given) delete found.implied[property];
  			this.style.implied = found.implied;
  			$extend(this.style.current, this.style.implied);
  			return true;
			}	
		}  
		return false;
	},

	lookupStyles: function() {
		var result = ART.Sheet.lookup(this.getHierarchy(), this.rules.possible);
		if (!$equals(result.rules, this.rules.current)) {
			this.rules.current = result.rules;
			if (!this.rules.possible) this.rules.possible = result.possible;
			for (var i in result.style) return result;
		}
		return false;
	},
	
	renderStyles: function(style) {
		$extend(this.style.given, style);
		this.setStyles(this.style.given)
		for (var property in this.style.element)	{
			if (!(property in this.style.given) && !(property in this.style.found) && !(property in this.style.calculated) && !(property in this.style.implied)) {
				this.resetElementStyle(property);
			}
	  }
		for (var property in this.style.current)	{
			if (!(property in this.style.given) && !(property in this.style.found) && !(property in this.style.calculated) && !(property in this.style.implied)) {
				delete this.style.current[property];
  			delete this.style.paint[property];
			}
	  }
	},
	
  setStyles: function(style, temp) {
		for (var key in style) this.setStyle(key, style[key], temp)
  },
	
	setStyle: function(property, value, type) {
		if ($equals(this.style.current[property], value)) return;
		this.style.current[property] = value;
		switch (type) {
			case undefined:
				this.style.given[property] = value;
				break;
			case "calculated": 
			case "given": 
				this.styles[type][property] = value;
				break;
		} 
		
	  return true;
	},
	
	getStyle: function(property) {
	  if (this.style.computed[property]) return this.style.computed[property];
		var value = this.style.current[property];
		if (property == 'height') {
		  value = this.getClientHeight();
		} else {
  		if (value == "inherit") value = this.inheritStyle(property);
  		if (value == "auto") value = this.calculateStyle(property);
		}
		this.style.computed[property] = value;
		return value;
	},
	
	getStyles: function(properties) {
	  var result = {};
	  for (var i = 0, property, args = arguments; property = args[i++];) result[property] = this.getStyle(property);
	  return result;
	},

  getChangedStyles: function() {
    var styles = this.getStyles.apply(this, arguments);
    var hash = $A(arguments).join('')  
    var last = $extend({}, this.style.last[hash]);
    if (!this.style.last[hash]) this.style.last[hash] = {};
    if (this.size.height) {
      var size = $merge(this.size);
      //if (this.style.current.height != 'auto') size.height += (this.style.current.paddingTop || 0) + (this.style.current.paddingBottom || 0)      
      $extend(styles, this.size);
      //return styles;
    }
    
    var changed = false;
    for (var property in styles) {
      var value = styles[property];
      if (!$equals(last[property], value)) {
        //console.error('update', this.selector, property, value, last[property])
        changed = true;
        this.style.last[hash][property] = value;
      }
      delete last[property];
    };
    if (!changed) for (var property in last) {
      changed = true;
      break;
    }
    return changed ? styles : false;
  },
	
	setElementStyle: function(property, value) {
		if (Element.Styles[property] || Element.Styles.More[property]) {
			if (this.style.element[property] !== value) this.element.setStyle(property, value);
			this.style.element[property] = value;
			return true;
		}	
		return false;
	},
	
	resetElementStyle: function(property) {
		this.element.setStyle(property, '');
		delete this.style.element[property]
		return true;
	},

	inheritStyle: function(property) {
		var node = this;
		var style = node.style.current[property];
		while ((style == 'inherit' || !style) && node.parentNode) {
			node = node.parentNode;
			style = node.style.current[property];
		}
		return style;
	},
	
	calculateStyle: function(property) {
		if (this.style.calculated[property]) return this.style.calculated[property];
		var value;
		switch (property) {
			case "height":
				value = this.getClientHeight();
				if (value == 0) this.postpone()
				break;
			case "width":
				value = this.inheritStyle(property);
				if (value == "auto") value = this.getClientWidth();
				//if scrollWidth value is zero, then the widget is not in DOM yet
				//so we wait until the root widget is injected, and then try to repeat
				if (value == 0 || (this.redraws == 0)) this.postpone()
		}
		this.style.calculated[property] = value;
		return value;
	},
	
	postpone: function() {
	  if (!this.halt('postponed')) return;
	  this.postponed = true;
		return true;
	}
});

Element.Styles.More = new FastArray('float', 'display', 'clear', 'cursor', 'verticalAlign', 'textAlign');