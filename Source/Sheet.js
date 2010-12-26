/*
---
 
script: Sheet.js
 
description: Code to extract style rule definitions from the stylesheet
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD
- CSSParser/CSSParser
- Core/Slick.Parser
- Core/Slick.Finder
- Core/Request
- Core/Element.Style
- LSD.Widget.Module.Styles
- LSD.Document
 
provides: [LSD.Sheet]
 
...
*/

LSD.Sheet = new Class({
  Extends: LSD.Node,
  
  options: {
    compile: false,
    combine: true //combine rules
  },
  
  initialize: function(element, callback) {
    this.parent.apply(this, arguments);
    this.rules = []
    this.callback = callback;
    if (this.element) this.fetch();
    else if (callback) callback(this);
    LSD.Document.addStylesheet(this);
  },
  
  define: function(selectors, style) {
    LSD.Sheet.Rule.fromSelectors(selectors, style).each(this.addRule.bind(this))
  },
  
  addRule: function(rule) {
    //var raw = rule.selector.raw;
    //if (this.rules[raw]) {}
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
    var sheet = {}
 
    var parsed = CSSParser.parse(text);;
    parsed.each(function(rule) {
      var selector = rule.selectors.map(function(selector) {
        return selector.selector.
          replace(/\.is-/g, ':').
          replace(/\.id-/g , '#').
          replace(/\.lsd#/g, '#').
          replace(/\.lsd\./g, '').
          replace(/^html \> body /g, '')
      }).join(', ');
      if (!selector.length || (selector.match(/svg|v\\?:|:(?:before|after)|\.container/))) return;
 
      if (!sheet[selector]) sheet[selector] = {};
      var styles = sheet[selector];
 
      rule.styles.each(function(style) {
        var name = style.name.replace('-lsd-', '');
        var value = style.value;
        var integer = value.toInt();
        if ((integer + 'px') == value) {
          styles[name] = integer;
        } else {
          if ((value.indexOf('hsb') > -1)
           || (value.indexOf('ART') > -1)
           || (value.indexOf('LSD') > -1)
           || (value.charAt(0) == '"')
           || (value == 'false')
           || (integer == value) || (value == parseFloat(value))) value = eval(value.replace(/^['"]/, '').replace(/['"]$/, ''));
          styles[name] = value;
        }
      })
    });
    return sheet;
  },
  
  attach: function(node) {
    this.rules.each(function(rule) {
      rule.attach(node)
    });
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

LSD.Sheet.isElementStyle = function(cc) {
  return Widget.Styles.Element[cc] && !Widget.Styles.Ignore[cc];
}

LSD.Sheet.Rule = function(selector, style) {
  this.selector = selector;
  this.index = LSD.Sheet.Rule.index ++;
  this.expressions = selector.expressions[0];
  this.specificity = this.getSpecificity();
  for (property in style) {
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
    //console.log(node, state, this.selector.raw, this.style)
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
})

LSD.Sheet.Rule.fromSelectors = function(selectors, style) { //temp solution, split by comma
  return selectors.split(/\s*,\s*/).map(function(selector){
    return new LSD.Sheet.Rule(Slick.parse(selector), style);
  });
}

