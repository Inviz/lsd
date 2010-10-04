/*
---
 
script: Expression.js
 
description: Compiled functions for user-defined style logic
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART
 
provides: [ART.Expression]
 
...
*/

ART.Expression = new Class({
  
  initialize: function(property, expression) {
    this.property = property;
    this.expression = expression;
    this.environment = [];
    this.environments = [];
  },
  
  convert: Macro.setter('converted', function() {
    return this.expression.replace(/([a-z]+)(?:\)|$|\s)/g, function(whole, name) {
      this.environment.push(name);
      var self = "environment." + name;
      switch (this.property) {
        case "height": case "width":
          // parent.getLayoutHeight(parent.style.expressed.height && parent.style.calculateProperty(height, parent.style.expressed.height))
          return self + ".getLayout" + this.property.capitalize() + "(" + 
            self + ".style.expressed." + this.property + " && " + 
            self + ".calculateStyle('" + this.property + "', " + self + ".style.expressed." + this.property + ")" +
          ")";
        default:
          return self + ".getStyle('" + this.property + "')";
      }      
    }.bind(this));
  }),
  
  compile: Macro.setter('compiled', function() {
    return new Function("environment", "/*console.log('"+this.converted+"'," +this.converted+");*/return " + this.converted);
  }),
  
  call: function(widget) {
    this.convert()
    var key = $uid($(widget));
    var environment = this.environments[key];
    if (!environment) {
      environment = this.environments[key] = {};
      for (var i = 0, j = this.environment.length, item; item = this.environment[i++];) environment[item] = this.getByExpression(widget, item);
    }
    return this.compile()(environment);
  },
  
  getByExpression: function(widget, name) {
    switch(name) {
      case "parent":
        return widget.parentNode;
      case "next":
        var children = widget.parentNode.childNodes;
        return children[children.indexOf(this) + 1];
      case "previous":
        var children = widget.parentNode.childNodes;
        return children[children.indexOf(this) - 1];
      default: 
        while (widget && !widget[name]) widget = widget.parentNode;
        if (widget && widget[name]) return widget[name];
        else console.error('Widget named ', name, ' was not found', [this, widget, this.parentNode])
    }
  }
});
ART.Expression.compiled = {};
ART.Expression.get = function(property, expression) {
  var key = property + expression;
  var compiled = this.compiled[key];
  if (compiled) return compiled
  this.compiled[key] = new ART.Expression(property, expression)
  return this.compiled[key];
};
