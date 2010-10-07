/*
---
 
script: Layout.js
 
description: A logic to render (and nest) a few widgets out of the key-value hash
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART
- ART.Widget.Base
- Ext/Logger
 
provides: [ART.Layout]
 
...
*/

ART.Layout = new Class({
  
  Implements: [Options, Logger],
  
  ns: 'art',
  name: 'layout',
    
  initialize: function(widget, layout, options) {
    this.widget = widget;
    this.layout = layout;
    this.setOptions(options);
    //this.widget.log('Layout', this, 'for', widget)
    this.reset();
  }, 
  
  reset: function() {
    this.render(this.layout, this.widget);
  },
  
  materialize: function(selector, layout, parent) {
    var widget = ART.Layout.build(selector, layout, parent);
    if ($type(layout) != 'string') widget = this.render(layout, widget);
    return widget;
  },
  
  render: function(layout, parent) {
    var widgets = [];
    switch ($type(layout)) {
      case "string": 
        widgets.push(this.materialize(layout, {}, parent));
        break;
      case "array": 
        layout.each(function(widget) {
          widgets.push.apply(widgets, this.render(widget, parent))
        }, this)
        break;
      case "object":
        for (var selector in layout) {
          widgets.push(this.materialize(selector, layout[selector], parent));
        }
        break;
    }
    return widgets;
  },

  getName: function() {
    return 'Layout'
  }
});

(function(cache) {
  ART.Layout.findTraitByAttributeName = function(name) {
    if (!$defined(cache[name])) {
      switch(name) {
        case "height": case "width":
          name = 'liquid';
          break;
      }
      var klass = cache[name] = ART.Widget.Trait[name.capitalize()] || null;
      if (klass && klass.Stateful) cache[name] = klass.Stateful;
    }
    return cache[name];
  }
})(ART.Layout.traitByAttribute = {});

ART.Layout.build = function(selector, layout, parent, element) {
  var parsed = Slick.parse(selector).expressions[0][0]
  if (parsed.tag == '*') parsed.tag = 'container';
  var tag = parsed.tag;
  var options = {};
  var attributes = {};
  if (parsed.id) options.id = parsed.id
  var mixins = [];
  var styles;  
  switch (parsed.combinator) {
    case '^': //add full parent class path (tag, type, subclass)
      tag = parent.source + '-' + tag;
      break;
    case ">": //add partial parent class path (tag and type)
      var type = parent.getAttribute('type');
      if (type) tag = type + '-' + tag;
      var bits = parent.source.split('-');
      bits.pop();
      tag = bits.join('-') + '-' + tag;
  }
  
  
  if (parsed.attributes) parsed.attributes.each(function(attribute) {
    if (attribute.key == "style") {
      styles = {};
      attribute.value.split(';').each(function(definition) {
        var bits = definition.split(':');
        styles[bits[0]] = bits[1];
      })
    } else {
      var name = attribute.key;
      var value = attribute.value || true;
      if (name == 'type') tag += "-" + value;
      var bits = name.split('-');
      for (var i = bits.length - 1; i > -1; i--) {
        var obj = {};
        obj[bits[i]] = value;
        if (i == 0) $mixin(options, obj);
        else value = obj;
      }
      attributes[name] = attribute.value || true;
      var trait = ART.Layout.findTraitByAttributeName(name);
      if (trait) mixins.push(trait);
    }
  });
  mixins.unshift(tag)
  for (var i in attributes) {
    options.attributes = attributes;
    break;
  }


  if (parsed.classes) {
    if (!options.classes) options.classes = [];
    options.classes.push.apply(options.classes, parsed.classes.map(function(klass) { 
      return klass.value; 
    }));
  }
  if (parsed.pseudos) {
    if (!options.pseudos) options.pseudos = [];
    options.pseudos.push.apply(options.pseudos, parsed.pseudos.map(function(klass) { 
      return klass.key; 
    }));
  }
  
  
  var widget = ART.Widget.create(mixins, options);
  widget.source = tag;
  widget.build();
  
  if (!options.id && parent) {
    var property = parsed.tag + 's';
    if (!parent[property]) parent[property] = [];
    parent[property].push(widget)
  }
  
  if (element !== false) widget.inject(element || parent, 'bottom', true)
  
  if (styles) widget.setStyles(styles);
  if ($type(layout) == 'string') widget.setContent(layout);
  return widget;
};