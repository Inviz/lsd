/*
Script: ART.Sheet.js

License:
	MIT-style license.
*/

ART.Sheet = {};

(function(){
	// http://www.w3.org/TR/CSS21/cascade.html#specificity
	var rules = [];

	var getSpecificity = function(selector){
		specificity = 0;
		selector.each(function(chunk){
			if (chunk.tag && chunk.tag != '*') specificity++;
			if (chunk.id) specificity += 100;
			specificity += (chunk.pseudos || []).length;
			specificity += (chunk.classes || []).length * 10;
		});
		return specificity;
	};

	ART.Sheet.define = function(selectors, style){
		Slick.parse(selectors).expressions.each(function(selector){
			var rule = {
				'specificity': getSpecificity(selector),
				'selector': selector,
				'style': {}
			};
			for (p in style) rule.style[p.camelCase()] = style[p];
			rules.push(rule);

			rules.sort(function(a, b){
				return a.specificity - b.specificity;
			});
		});
	};
	
	ART.Sheet.match = function(selector, needle) {
	  if (!selector[0].combinator) selector = Slick.parse(selector).expressions[0];
	  var i = needle.length - 1, j = selector.length - 1;
		if (!match.all(needle[i], selector[j])) return;
		while (j-- >  0) {
			while (true){
				if (i-- <= 0) return;
				if (match.structure(needle[i], selector[j])) {
				  if (j == 0)
				  if (match.state(needle[i], selector[j])) break;
				};
			}
		}
		return true;
	};
	
	var match = {
	  structure: function(self, other) {
  	  if (other.tag && (other.tag != '*') && (self.nodeName != other.tag)) return false;
  	  if (other.id && (self.options.id != other.id)) return false;
  	  if (other.attributes) for (var i = 0, j; j = other.attributes[i]; i++) if (self.attributes[j.key] != j.value) return false;
  	  return true;
  	},
  	
  	state: function(self, other) {
  	  if (other.classes) for (var i = 0, j; j = other.classes[i]; i++) if (!self.classes[j.value]) return false;
  	  if (other.pseudos) for (var i = 0, j; j = other.pseudos[i]; i++) if (!self.pseudos[j.key]) return false;
  	  return true;
  	},
  	
  	all: function(self, other) {
  	  return match.structure(self, other) && match.state(self, other)
  	}
	}
	$m = match;
	
	//static css compilation
	var css = {
	  selectors: [],
	  rules: {}
	};
	var toCSSSelector = function(selectors) {
		return selectors.map(function(parsed){
  	  var classes = ['', 'art'];
  	  if (parsed.tag) classes.push(parsed.tag);
  	  if (parsed.id) classes.push('id-' + parsed.id);
  	  if (parsed.pseudos) {
    	  parsed.pseudos.each(function(pseudo) {
    	    classes.push(pseudo.key);
    	  });
    	};
  	  return classes.join('.')
  	}).join(' ');
	}
	
	Element.Styles.Except = new ART.Hash('backgroundColor', 'width', 'height', 'minWidth');
	
	ART.Sheet.isElementStyle = function(cc) {
	  return ((Element.Styles[cc] || Element.Styles.More[cc]) && !Element.Styles.Except[cc]);
	}
	ART.Sheet.define = function(selectors, style){
		Slick.parse(selectors).expressions.each(function(selector){
			var rule = {
				specificity: getSpecificity(selector),
				selector: selectors,
				parsed: selector,
				style: {},
				implied: {}
			};
			for (p in style) {
			  var cc = p.camelCase();
			  if (ART.Sheet.isElementStyle(cc)) {
			    var cssed = toCSSSelector(selector);
			    if (!css.rules[cssed]) css.rules[cssed] = {};
			    css.rules[cssed][cc] = style[p];
    			rule.implied[cc] = style[p];
			  } else {
    			rule.style[cc] = style[p];
			  }
			}
			
			rules.push(rule);
      
			rules.sort(function(a, b){
				return a.specificity - b.specificity;
			});
		});
	};
	//import CSS-defined stylesheets into ART
	ART.Sheet.decompile = function(name, callback) {
	  if (!name) name = 'art';
    $$('link[rel*=' + name + ']').each(function(stylesheet) {
      new Request({
        url: stylesheet.get('href'),
        onSuccess: function(text) {
          var sheet = {}
          
          var parsed = cssParser.parse(text);;
          parsed.each(function(rule) {
            var selector = rule.selectors.map(function(selector) {
              return selector.selector.
                replace(/\.is-/g, ':').
                replace(/\.id-/g , '#').
                replace(/\.art#/g, '#').
                replace(/\.art\./g, '').
                replace(/^html \> body /g, '')
            }).join(', ');
            if (!selector.length || (selector.match(/svg|v\\?:|:(?:before|after)|\.container/))) return;
            
            if (!sheet[selector]) sheet[selector] = {};
            var styles = sheet[selector];
            
            rule.styles.each(function(style) {
              var name = style.name.replace('-art-', '');
              var value = style.value;
              var integer = value.toInt();
              if ((integer + 'px') == value) {
                styles[name] = integer;
              } else {
                if ((value.indexOf('hsb') > -1)
                 || (value.indexOf('ART') > -1) 
                 || (value == 'false')
                 || (integer == value) || (value == parseFloat(value))) value = eval(value.replace(/^['"]/, '').replace(/['"]$/, ''));
                styles[name] = value;
              }
            })
          });
          //console.dir(sheet)
          for (var selector in sheet) ART.Sheet.define(selector, sheet[selector]);
          
          if (callback) callback();
        }
      }).get();
    });
	};
	
	//compile ART-defined stylesheets to css
	ART.Sheet.compile = function() {
	  var bits = [];
	  for (var selector in css.rules) {
	    var rule = css.rules[selector];
	    bits.push(selector + " {")
	    for (var property in rule) {  
	      var value = rule[property];
	      switch ($type(value)) {
	        case "number": 
	          if (property != 'zIndex') value += 'px';
	          break;
	        case "array":
	          value = value.map(function(bit) { return bit + 'px'}).join(' ');
	          break;
	      }
	      bits.push(property.hyphenate() + ': ' + value + ';')
	    }
	    bits.push("}")
	  }
	  var text = bits.join("\n");
	  if (window.createStyleSheet) {
			var style = window.createStyleSheet("");
			style.cssText = text;
	  } else {
	    var style = new Element('style', {type: 'text/css', media: 'screen'}).adopt(document.newTextNode(text)).inject(document.body);
	  }
	}
	
	
	
	ART.Sheet.lookup = function(hierarchy, scope){
		//if (cache[selector]) return cache[selector];
		
		var result = {style: {}, rules: [], implied: {}, possible: []};
		
		(scope || rules).each(function(rule){
	    var selector = rule.parsed;
		  var needle = hierarchy;
		  var i = needle.length - 1, j = selector.length - 1;
  		if (!match.structure(needle[i], selector[j])) return;
			if (!match.state(needle[i], selector[j])) {
			  if (!scope) result.possible.push(rule);
			  return;
			} else {
			  if (!scope && j == 0) result.possible.push(rule);
			}
  		while (j-- >  0) {
  			while (true){
  				if (i-- <= 0) return;
  				if (match.structure(needle[i], selector[j])) {
  				  if (!scope && j == 0) result.possible.push(rule);
  				  if (match.state(needle[i], selector[j])) break;
  				};
  			}
  		}
			result.rules.push(rule.selector);
			
			for (var property in rule.style) result.style[property] = rule.style[property];
			for (var property in rule.implied) result.implied[property] = rule.implied[property];
		});
		
		//cache[selector] = result;
		
		return result;
	};
})();