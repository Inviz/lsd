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

provides: [LSD.Widget.Module.Styles, ART.Styles]
 
...
*/


ART.Styles = {}
Widget.Styles.Paint = new FastArray(
  'glyphColor', 'glyphShadow', 'glyphSize', 'glyphStroke', 'glyph', 'glyphColor', 'glyphColor', 'glyphHeight', 'glyphWidth', 'glyphTop', 'glyphLeft',     
  'cornerRadius', 'cornerRadiusTopLeft', 'cornerRadiusBottomLeft', 'cornerRadiusTopRight', 'cornerRadiusBottomRight',    
  'reflectionColor',  'backgroundColor', 'strokeColor', 'fillColor', 'starRays',
  'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'userSelect'
);
Widget.Styles.Element = FastArray.from(Hash.getKeys(Element.Styles).concat('float', 'display', 'clear', 'cursor', 'verticalAlign', 'textAlign'));

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

      calculated: {}, //styles that are calculated in runtime
      computed: {},   //styles that are already getStyled
      expressed: {},  //styles that are expressed through function
      implied: {},    //styles that are assigned by environment

      element: {},    //styles that are currently assigned to element
      paint: {}       //styles that are currently used to paint
    };
    this.rules = {
      current: [],
      possible: null
    };
    this.parent.apply(this, arguments);
    $extend(this.style.current, this.options.styles);
    for (var property in this.style.current) this.setStyle(property, this.style.current[property])
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
    var result = LSD.Sheet.lookup(this.getHierarchy(), this.rules.possible);
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
    var style = this.style, 
        current = style.current,
        paint = style.paint, 
        element = style.element, 
        given = style.given, 
        found = style.found,
        calculated = style.calculated,
        implied = style.implied
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


ART.Styles.calculate = function() {
  return LSD.Expression.get.apply(LSD.Expression, arguments)
}