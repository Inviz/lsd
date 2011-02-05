/*
---
 
script: Styles.js
 
description: Set, get and render different kind of styles on widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Expression
  - Core/Element.Style
  - Ext/FastArray
  - Sheet/SheetParser.Styles

provides: 
  - LSD.Module.Styles

...
*/

(function() {
  
var CSS = SheetParser.Styles, Paint = LSD.Styles;
var setStyle = function(element, property, value, type) {
  if (value === false) {
    if (element && this.element) delete this.element.style[property];
    delete this.style[element ? 'element' : 'paint'][property], this.style.current[property];
    if (type) delete this.style[type][property];
  } else {
    if (element && this.element) this.element.style[property] = (typeof value == 'number') ? value + 'px' : value;
    this.style[element ? 'element' : 'paint'][property] = this.style.current[property] = value;
    if (type) this.style[type][property] = value;
  }
}

LSD.Module.Styles = new Class({
  
  options: {
    styles: {}
  },

  initialize: function() {
    this.style = {
      current: {},    //styles that widget currently has
      found: {},      //styles that were found in stylesheets
      given: {},      //styles that were manually assigned

      changed: {},    //styles that came from stylesheet since last render
      calculated: {}, //styles that are calculated in runtime
      computed: {},   //styles that are already getStyled
      expressed: {},  //styles that are expressed through function
      implied: {},    //styles that are assigned by environment

      element: {},    //styles that are currently assigned to element
      paint: {}       //styles that are currently used to paint
    };
    this.rules = [];
    this.parent.apply(this, arguments);
    Object.append(this.style.current, this.options.styles);
    for (var property in this.style.current) this.setStyle(property, this.style.current[property])
  },

  setStyle: function(property, value) {
    var paint, css;
    if (!(paint = Paint[property]) && !(css = CSS[property])) return false;
    var length = arguments.length;
    if (length > 2) {
      if (arguments[length - 1] in this.style) var type = arguments[--length];
      if (length > 2) value = Array.prototype.splice.call(arguments, 1, length);
    }
    if (value.call) {
      this.style.expressed[property] = value;
      this.style.computed[property] = value = value.call(this);
    }
    var result = (css || paint)[value.push ? 'apply' : 'call'](this, value);
    if (property == 'stroke') console.info(value, result, $t = this, this.element);
    //if (property == 'glyphPosition') alert([property, JSON.stringify(result)])
    if (result === true || result === false) setStyle.call(this, css, property, value, type);
    else for (var prop in result) setStyle.call(this, css, prop, result[prop], type);
    return result;
  },

  setStyles: function(style, type) {
    for (var key in style) this.setStyle(key, style[key], type)
  },

  getStyle: function(property) {
    if (this.style.computed[property]) return this.style.computed[property];
    var value;
    var definition = Paint[property] || CSS[property];
    if (!definition) return;
    if (definition.properties) return definition.properties.map(this.getStyle.bind(this));
    var expression = this.style.expressed[property];    
    if (expression) {
      value = this.style.current[property] = this.calculateStyle(property, expression);
    } else {  
      value = this.style.current[property];
      if (property == 'height') {
        if (typeof value !== 'number') value = this.getClientHeight();
      } else if (property == 'width') {
        if (typeof value !== 'number') value = this.getClientWidth();
      } else {
        if (value == "inherit") value = this.inheritStyle(property);
        if (value == "auto") value = this.calculateStyle(property);
      }
    }
    this.style.computed[property] = value;
    return value;
  },

  getStyles: function(properties) {
    var result = {};
    for (var i = 0, property, args = arguments; property = args[i++];) result[property] = this.getStyle(property);
    return result;
  },
  
  renderStyles: function(style) {
    var style = this.style, 
        current = style.current,
        paint = style.paint, 
        element = style.element,  
        found = style.found,
        implied = style.implied,
        calculated = style.calculated,
        given = Object.append(style.given, given),
        changed = style.changed;
    this.setStyles(given, 'given')
    for (var property in found) if ((property in changed) && !(property in given)) this.setStyle(property, found[property]);
    Object.append(style.current, style.implied);
    for (var property in element)  {
      if (!(property in given) && !(property in found) && !(property in calculated) && !(property in implied)) {
        this.element.style[property] = '';
        delete element[property]
      }
    }
    for (var property in current)  {
      if (!(property in given) && !(property in found) && !(property in calculated) && !(property in implied)) {
        delete current[property];
        delete paint[property];
      }
    }
  },
  
  combineRules: function(rule) {
    var rules = this.rules, style = this.style, found = style.found = {}, implied = style.implied = {}, changed = style.changed;
    for (var j = rules.length, other; other = rules[--j];) {
      var setting = other.style, implying = other.implied, self = (rule == other);
      if (setting) for (var property in setting) if (!(property in found)) {
        if (self) changed[property] = setting[property];
        found[property] = setting[property];
      }
      if (implying) for (var property in implying) if (!(property in implied)) implied[property] = implying[property];
    }
  },
  
  addRule: function(rule) {
    var rules = this.rules;
    if (rules.indexOf(rule) > -1) return
    for (var i = 0, other;  other = rules[i++];) {
      if ((other.specificity > rule.specificity) || ((other.specificity == rule.specificity) && (other.index > rule.index))) break;
    }
    rules.splice(--i, 0, rule);
    this.combineRules(rule);
  },
  
  removeRule: function(rule) {
    var rules = this.rules, index = rules.indexOf(rule)
    if (index == -1) return
    rules.splice(index, 1);
    this.combineRules();
    var style = this.style, found = style.found, changed = style.changed, setting = rule.style;
    if (setting) for (var property in setting) if (!Object.equals(found[property], setting[property])) changed[property] = found[property];
 },
  
  inheritStyle: function(property) {
    var node = this;
    var style = node.style.current[property];
    while ((style == 'inherit' || !style) && (node = node.parentNode)) style = node.style.current[property];
    return style;
  },
  
  calculateStyle: function(property, expression) {
    if (this.style.calculated[property]) return this.style.calculated[property];
    var value;
    if (expression) {
      value = expression.call(this);
    } else {
      switch (property) {
        case "height":
          value = this.getClientHeight();
        case "width":
          value = this.inheritStyle(property);
          if (value == "auto") value = this.getClientWidth();
        case "height": case "width":  
          //if dimension size is zero, then the widget is not in DOM yet
          //so we wait until the root widget is injected, and then try to repeat
          if (value == 0 && (this.redraws == 0)) this.halt();
      }
    }
    this.style.calculated[property] = value;
    return value;
  },
  
  update: Macro.onion(function() {
    this.style.calculated = {};
    this.style.computed = {};
  })
});


})();


LSD.calculate = LSD.Module.Styles.calculate = function() {
  return LSD.Expression.get.apply(LSD.Expression, arguments)
}