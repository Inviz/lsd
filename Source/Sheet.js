/*
---
 
script: Sheet.js
 
description: Code to extract style rule definitions from the stylesheet
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Core/Element
  - Core/Request
  - Sheet/Sheet
  - Sheet/Sheet.Value
  - Sheet/Sheet.Property
  - Sheet/Sheet.Styles
  - LSD.Module.Element
  - LSD.Module.Options
  
provides:
  - LSD.Sheet
 
...
*/

!function() {
  
LSD.Sheet = new Class({
  Implements: [LSD.Module.Element, LSD.Module.Options],
  
  options: {
    compile: false,
    combine: true //combine rules
  },
  
  initialize: function(element, callback) {
    LSD.Module.Options.initialize.call(this, element);
    this.rules = [];
    this.callback = callback;
    if (this.element) this.fetch();
    else if (callback) callback(this);
    if (!LSD.Sheet.stylesheets) LSD.Sheet.stylesheets = [];
    LSD.Sheet.stylesheets.push(this);
  },
  
  define: function(selectors, style) {
    LSD.Sheet.Rule.fromSelectors(selectors, style).each(this.addRule.bind(this))
  },
  
  addRule: function(rule) {
    this.rules.push(rule)
  },
  
  fetch: function(href) {
    if (!href && this.element) href = this.element.get('href');
    if (!href) return;
    new Request({
      url: href,
      onSuccess: this.apply.bind(this)
    }).get();
  },
  
  apply: function(sheet) {
    if (typeof sheet == 'string') sheet = this.parse(sheet);
    if (this.options.compile) this.compile(sheet);
    for (var selector in sheet) this.define(selector, sheet[selector]);
    if (this.callback) this.callback(this)
  },
  
  parse: function(text) {
    var sheet = new Sheet(text);
    var rules = sheet.cssRules;
    var parsed = {};
    for (var i = 0, rule; rule = rules[i++];) {      
      var selector = LSD.Sheet.convertSelector(rule.selectorText)
      if (!selector.length || LSD.Sheet.isElementSelector(selector)) continue;
      if (!parsed[selector]) parsed[selector] = {};
      var styles = parsed[selector];
      for (var style = rule.style, j = 0, name; name = style[j++];) {
        var property = name.replace('-lsd-', '').camelCase();
        var value = SheetParser.Value.translate(style[name]);
        var definition = LSD.Styles[property] || Sheet.Styles[property];
        if (!definition) continue;
        if (definition.type != 'simple') {
          var result = definition[value.push ? 'apply' : 'call'](this, value);
          if (result === false) value = false;
          else if (result !== true) {
            for (var prop in result) styles[prop] = Value.compile(result[prop]);
            continue
          }
        }
        styles[property] = Value.compile(value);
      }
    };
    return parsed;
  },
  
  attach: function(node) {
    this.rules.each(function(rule) {
      rule.attach(node)
    });
    LSD.start();
  },
  
  detach: function(node) {
    this.rules.each(function(rule) {
      rule.detach(node)
    });
  },
  
  /* Compile LSD stylesheet to CSS when possible 
     to speed up setting of regular properties
     
     Will create stylesheet node and apply the css
     unless *lightly* parameter was given. 
     
     Unused now, because we decompile css instead */
  compile: function(lightly) {
    var bits = [];
    this.rules.each(function(rule) {
      if (!rule.implied) return;
      bits.push(rule.getCSSSelector() + " {")
      for (var property in rule.implied) {  
        var value = rule.implied[property];
        if (typeof value == 'number') {
          if (property != 'zIndex') value += 'px';
        } else if (value.map) {
          value = value.map(function(bit) { return bit + 'px'}).join(' ');
        }
        bits.push(property.hyphenate() + ': ' + value + ';')
      }
      bits.push("}")
    })
    var text = bits.join("\n");
    if (lightly) return text;
    
    if (window.createStyleSheet) {
      var style = window.createStyleSheet("");
      style.cssText = text;
    } else {
      var style = new Element('style', {type: 'text/css', media: 'screen'}).adopt(document.newTextNode(text)).inject(document.body);
    }
  }
});

Object.append(LSD.Sheet, {
  isElementSelector: function(selector) {
    return selector.match(/svg|v\\?:|:(?:before|after)|\.container/);
  },
  convertSelector: function(selector) {
    return selector.replace(/\.id-/g , '#').replace(/\.is-/g, ':').replace(/\.lsd#/g, '#').
                    replace(/\.lsd\./g, '').replace(/html\sbody\s/g, '');
  },
  isElementStyle: function(cc) {
    return Sheet.Styles[cc] && !LSD.Styles[cc] && (cc != 'height' && cc != 'width')
  },
  isRawValue: function(value) {
    return (value.indexOf('hsb') > -1) || (value.indexOf('ART') > -1) || (value.indexOf('LSD') > -1) || 
           (value.charAt(0) == '"') || (value == 'false') || (value == parseInt(value)) || (value == parseFloat(value))
  }
});

LSD.Sheet.Rule = function(selector, style) {
  this.selector = selector;
  this.index = LSD.Sheet.Rule.index ++;
  this.expressions = selector.expressions[0];
  this.specificity = this.getSpecificity();
  for (var property in style) {
    var cc = property.camelCase();
    var type = (LSD.Sheet.Rule.separate && LSD.Sheet.isElementStyle(cc)) ? 'implied' : 'style';
    if (!this[type]) this[type] = {}; 
    this[type][cc] = style[property];
  }
}
LSD.Sheet.Rule.index = 0;

LSD.Sheet.Rule.separate = true;

Object.append(LSD.Sheet.Rule.prototype, {  
  attach: function(node) {
    if (!this.watcher) this.watcher = this.watch.bind(this);
    node.watch(this.selector, this.watcher)
  },
  
  detach: function(node) {
    node.unwatch(this.selector, this.watcher);
  },
  
  watch: function(node, state) {
    node[state ? 'addRule' : 'removeRule'](this)
  },
  
  getCSSSelector: function() {
    return this.expressions.map(function(parsed){
      var classes = ['', 'lsd'];
      if (parsed.tag) classes.push(parsed.tag);
      if (parsed.id) classes.push('id-' + parsed.id);
      if (parsed.pseudos) {
        parsed.pseudos.each(function(pseudo) {
          classes.push(pseudo.key);
        });
      };
      return classes.join('.');
    }).join(' ');
  },
  
  getSpecificity: function(selector) {
    specificity = 0;
    this.expressions.each(function(chunk){
      if (chunk.tag && chunk.tag != '*') specificity++;
      if (chunk.id) specificity += 100;
      for (var i in chunk.attributes) specificity++;
      specificity += (chunk.pseudos || []).length;
      specificity += (chunk.classes || []).length * 10;
    });
    return specificity;
  }
});

var Value = LSD.Sheet.Value = {
  px: function(value) {
    return value;
  },
  deg: function(value) {
    return value;
  },
  em: function(value) {
    return function() {
      return value * (this.baseline || 16)
    }
  },
  "%": function(value) {
    return function(property) {
      var resolved = Value['%'].resolve(property);
      if (resolved.call) resolved = resolved.call(this);
      return resolved / 100 * value;
    }
  },
  url: function(value) {
    return value
  },
  src: function(value) {
    return value
  },
  rgb: function() {
    return window.rgb.apply(window, arguments)
  },
  rgba: function(value) {
    return window.rgb.apply(window, arguments)
  },
  hsb: function() {
    return window.hsb.apply(window, arguments)
  },
  hex: function(value) {
    return new Color(value)
  },
  calc: function(value) {
    var bits = value.map(function(bit, i) {
      if (bit.call) {
        return 'value[' + i + '].call(this, property)'
      } else {
        return bit;
      }
    })
    return new Function('property', 'return ' + bits.join(' '));
  },
  min: function() {
    return Math.min.apply(Math, arguments)
  },
  max: function() {
    return Math.max.apply(Math, arguments)
  }
};


var resolved = {};
var dimensions = {
  height: /[hH]eight|[tT]op|[bB]ottom|[a-z]Y/,
  width: /[wW]idth|[lL]eft|[rR]ight|[a-z]X/
}
Value['%'].resolve = function(property) {
  var result = resolved[property];
  if (result != null) return result;
  for (var side in dimensions) if (property.match(dimensions[side])) {
    result = function() { if (this.parentNode) return this.parentNode.getStyle(side); return 0;}
    break;
  }
  return (resolved[property] = (result || 1));
};

Value.compiled = {};
Value.compile = function(value, context) {
  if (!value || value.call || typeof value == 'number') return value;
  if (!context) context = Value;
  if (value.push) {
    for (var i = 0, j = value.length, result = [], bit; i < j; bit = value[i++]) result[i] = Value.compile(value[i], context);
    return result;
  }
  if (value.unit)  return Object.append(context[value.unit](value.number), value);
  if (value.charAt) {
    if (context.hex && value.charAt(0) == "#" && value.match(/#[a-z0-9]{3,6}/)) return context.hex(value);
  } else for (var name in value) {
    if (context[name]) {
      return context[name](Value.compile(value[name]), context);
    } else {
      value[name] = Value.compile(value[name]);
    }
    break;
  }
  return value;
}

LSD.Sheet.Rule.fromSelectors = function(selectors, style) { //temp solution, split by comma
  return selectors.split(/\s*,\s*/).map(function(selector){
    return new LSD.Sheet.Rule(LSD.Slick.parse(selector), style);
  });
};


}();
