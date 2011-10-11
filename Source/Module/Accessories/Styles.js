/*
---
 
script: Styles.js
 
description: Set, get and render different kind of styles on widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - Core/Element.Style
  - Ext/Object.Array
  - Sheet/Sheet.Styles

provides: 
  - LSD.Module.Styles

...
*/

!function() {
  
var setStyle = function(element, property, value, type) {
  delete this.style.expressed[property];
  delete this.style.calculated[property];
  if (value === false) {
    if (element && this.element) delete this.element.style[property];
    delete this.style[element ? 'element' : 'paint'][property], delete this.style.current[property];
    if (type) delete this.style[type][property];
  } else {
    if (element && this.element) this.element.style[property] = (typeof value == 'number') ? value + 'px' : value;
    this.style[element ? 'element' : 'paint'][property] = this.style.current[property] = value;
    if (type) this.style[type][property] = value;
  }
}

LSD.Module.Styles = new Class({
  constructors: {
    style: function() {
      this.rules = [];
      this.style = {    // Styles that...
        current: {},    // ... widget currently has
        found: {},      // ... were found in stylesheets
        given: {},      // ... were manually assigned

        changed: {},    // ... came from stylesheet since last render
        calculated: {}, // ... are calculated in runtime
        computed: {},   // ... are already getStyled
        expressed: {},  // ... are expressed through function
        implied: {},    // ... are assigned by environment

        element: {},    // ... are currently assigned to element
        paint: {}       // ... are currently used to paint
      };
    }
  },

  setStyle: function(property, value) {
    var paint, css;
    if (!(paint = LSD.Styles[property]) && !(css = Sheet.Styles[property])) return false;
    var length = arguments.length;
    if (length > 2) {
      var last = arguments[length - 1];
      if (this.style[last || 'given']) {
        var type = last;
        length--;
      }
      if (length > 2) value = Array.prototype.splice.call(arguments, 1, length);
    }
    if (value.call) {
      var expression = value;
      value = value.call(this, property);
    }
    var result = (css || paint)[value.push ? 'apply' : 'call'](this, value);
    if (result.number || result.push || result.isColor || result === false) setStyle.call(this, css, property, value, type);
    else for (var prop in result) setStyle.call(this, css, prop, result[prop], type);
    if (expression) {
      this.style.expressed[property] = expression
      this.style.computed[property] = value
    }
    return result;
  },

  setStyles: function(style, type) {
    for (var key in style) this.setStyle(key, style[key], type)
  },

  getStyle: function(property) {
    if (this.style.computed[property]) return this.style.computed[property];
    var value;
    var definition = LSD.Styles[property] || Sheet.Styles[property];
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
  
  renderStyles: function(styles) {
    var style = this.style, 
        current = style.current,
        paint = style.paint, 
        element = style.element,  
        found = style.found,
        implied = style.implied,
        calculated = style.calculated,
        given = Object.append(style.given, styles),
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
      if ((other.specificity > rule.specificity) || (other.specificity == rule.specificity)) 
        if (other.index > rule.index) break;
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
    for (var property in setting) if (!Object.equals(found[property], setting[property])) changed[property] = found[property];
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
      value = expression.call(this, property);
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
  
  render: function(style) {
    this.renderStyles(style);
    this.parent.apply(this, arguments);
  }
});

LSD.Module.Styles.events = {
  update: function() {
    this.style.calculated = {};
    this.style.computed = {};
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Styles.prototype, LSD.Module.Styles.events);

LSD.Options.styles = {
  add: 'setStyles',
  remove: 'unsetStyles'
};
}();