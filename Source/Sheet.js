/*
---
 
script: Sheet.js
 
description: Code to extract style rule definitions from the stylesheet
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART
- CSSParser/CSSParser
- Core/Slick.Parser
- Core/Slick.Finder
- Core/Request
- Core/Element.Style
- ART.Widget.Module.Styles
 
provides: [ART.Sheet]
 
...
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
      for (var i in chunk.attributes) specificity++;
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
  
  ART.Styles.Except = new FastArray('backgroundColor', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight');
  
  ART.Sheet.isElementStyle = function(cc) {
    return Widget.Styles.Element[cc] && !ART.Styles.Except[cc];
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
          ART.Sheet.parse(text)
          if (callback) callback();
        }
      }).get();
    });
  };
  
  ART.Sheet.parse = function(text) {
    var sheet = {}
    
    var parsed = CSSParser.parse(text);;
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
           || (value.charAt(0) == '"')
           || (value == 'false')
           || (integer == value) || (value == parseFloat(value))) value = eval(value.replace(/^['"]/, '').replace(/['"]$/, ''));
          styles[name] = value;
        }
      })
    });
    //console.dir(sheet)
    for (var selector in sheet) {
      ART.Sheet.define(selector, sheet[selector]);
    }
    return sheet;
  }
  
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
    var result = {style: {}, rules: [], implied: {}, possible: []};
    
    var length = hierarchy.length;
    (scope || rules).each(function(rule){
      var selector = rule.parsed;
      var i = length - 1;
      var j = selector.length - 1;
      
      if (scope) {
        if (!match.state(hierarchy[i], selector[j])) return;
        
        while (j-- >  0) {
          while (true){
            if (i-- <= 0) return;
            if (match.all(hierarchy[i], selector[j])) break;
          }
        }
      } else { //dry run, get some more info
        var walk = function(k, l, m) {
          if (k < 0 || l < 0) return;
          if (match.structure(hierarchy[k], selector[l])) {
            if (m > -1) {
              if (match.state(hierarchy[k], selector[l])) {
                m--;
              } else {
                if (k == i) m = -2; //last element doesnt match the last part of selector, dont look for exact match anymore
              }
            }
            if (m == -1) {          //selector is fully matched
              return true;
            } else if (l == 0) {    //last selector bit was structure-matched
              return false;
            } else {                //dig deeper
              return walk(k - 1, l - 1, m);
            }
          } else {
            if (k == i) {           //last hierarchy bit is not matched, skip selector
              return;     
            } else {                //try the same selector with another widget
              return walk(k - 1, l, m);
            }
          }
        }
        switch (walk(i, j, j)) {
          case undefined:
            return;
          case false:
            result.possible.push(rule);
            return;
          case true:
            result.possible.push(rule);
        }
      }
      result.rules.push(rule.selector);
      
      for (var property in rule.style) result.style[property] = rule.style[property];
      for (var property in rule.implied) result.implied[property] = rule.implied[property];
    });
    
    return result;
  };
})();