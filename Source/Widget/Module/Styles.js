/*
---
 
script: Styles.js
 
description: Set, get and render different kind of styles on widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
- LSD.Expression
- Core/Element.Style
- Ext/FastArray

provides: [LSD.Widget.Module.Styles]
 
...
*/


Widget.Styles.Paint = new FastArray(
  'glyphColor', 'glyphShadow', 'glyphSize', 'glyphStroke', 'glyph', 'glyphColor', 'glyphColor', 'glyphHeight', 'glyphWidth', 'glyphTop', 'glyphLeft',     
  'cornerRadius', 'cornerRadiusTopLeft', 'cornerRadiusBottomLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight',    
  'reflectionColor',  'backgroundColor', 'strokeColor', 'fillColor', 'starRays',
  'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'userSelect'
);
Widget.Styles.Ignore = new FastArray('backgroundColor', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight');
Widget.Styles.Element = FastArray.from(Hash.getKeys(Element.Styles).concat('float', 'display', 'clear', 'cursor', 'verticalAlign', 'textAlign', 'font', 'fontFamily', 'fontSize', 'fontStyle'));

Widget.Styles.Complex = {
  'cornerRadius': {
    set: ['cornerRadiusTopLeft', 'cornerRadiusBottomLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight'],
    get: ['cornerRadiusTopLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight', 'cornerRadiusBottomLeft']
  }
}



LSD.Widget.Module.Styles = new Class({
  
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
  
  renderStyles: function(style) {
    var style = this.style, 
        current = style.current,
        paint = style.paint, 
        element = style.element,  
        found = style.found,
        implied = style.implied,
        calculated = style.calculated,
        given = Object.append(style.given, given)
    this.setStyles(given)
    for (var property in found) if (!(property in given)) this.setStyle(property, found[property], true);
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
    this.combineRules(rule);
    var style = this.style, found = style.found, changed = style.changed, setting = rule.style;; 
    if (setting) for (var property in setting) if (!$equals(found[property], setting[property])) changed[property] = found[property];
  },
  
  setStyles: function(style, temp) {
    for (var key in style) this.setStyle(key, style[key], temp)
  },
  
  setStyle: function(property, value, type) {
    if ($equals(this.style.current[property], value)) return;
    if (value.call) {
      this.style.expressed[property] = value;
      value = value.call(this);
    }
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
    return value;
  },
   
  getStyle: function(property) {
    if (this.style.computed[property]) return this.style.computed[property];
    var value;
    var properties = Widget.Styles.Complex[property];
    if (properties) {
      if (properties.set) properties = properties.get;
      var current = this.style.current;
      value = [];
      var i = 0;
      while (property = properties[i++]) {
        var part = current[property];
        value.push(((isFinite(part)) ? part : this.getStyle(property)) || 0)
      }
    } else {
      var expression = this.style.expressed[property];
      if (expression) {
        value = this.style.current[property] = this.calculateStyle(property, expression);
      } else {
        if (property == 'height') {
          value = this.getClientHeight();
        } else {
          value = this.style.current[property];
          if (value == "inherit") value = this.inheritStyle(property);
          if (value == "auto") value = this.calculateStyle(property);
        }
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

  setElementStyle: function(property, value) {
    if (Widget.Styles.Element[property]) {
      if (this.style.element[property] !== value) {
        if (this.element) this.element.setStyle(property, value);
        this.style.element[property] = value;
      }
      return value;
    }  
    return;
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


LSD.calculate = LSD.Widget.Module.Styles.calculate = function() {
  return LSD.Expression.get.apply(LSD.Expression, arguments)
}