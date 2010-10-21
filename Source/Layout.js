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
    if (ART.Layout.isConvertable(widget)) widget = ART.Layout.build(widget)
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
    var widget = ART.Layout.build(selector, parent);
    if (!Element.type(widget)) {
      if (!String.type(layout)) this.render(layout, widget);
      else widget.setContent(layout)
    }
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
      case "element":
        widgets.push(this.materialize(layout, ART.Layout.getFromElement(layout), parent));
        break;
      case "object":
        for (var selector in layout) widgets.push(this.materialize(selector, layout[selector], parent));
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
      switch (name) {
        case "tabindex":
          name = 'Focus';
          break;
      };
      var base = ART.Widget.Trait;
      for (var bits = name.split('-'), bit, i = 0; (bit = bits[i++]) && (base = base[bit.capitalize()]););
      var klass = cache[name] = base || null;
      if (klass && klass.Stateful) cache[name] = klass.Stateful;
    }
    return cache[name];
  }
})(ART.Layout.traitByAttribute = {});

ART.Layout.getFromElement = function(element) {
  var children = element.getChildren();
  if (children.length) return children;
  var text = element.get('text');
  if (text.length) return text;
}

ART.Layout.Plain = new FastArray('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'span', 'table', 'thead', 'tfoot', 'tbody', 'tr', 'td', 'colgroup')

ART.Layout.isConvertable = function(element) {
  return Element.type(element) && !ART.Layout.Plain[element.get('tag')];
}

ART.Layout.convert = function(element) {
  var options = {
    attributes: {},
    tag: element.get('tag'),
    origin: element
  };
  if (options.tag == 'div') options.tag = 'container';
  if (element.id) options.id = element.id;
  for (var i = 0, attribute; attribute = element.attributes[i++];) {
    options.attributes[attribute.name] = ((attribute.value != attribute.name) && attribute.value) || true;
  }
  if (options.attributes && options.attributes.inherit) {
    options.inherit = options.attributes.inherit;
    delete options.attributes.inherit;
  }
  if (options.attributes['class']) {
    options.classes = options.attributes['class'].split(' ').filter(function(name) {
      var match = /^(is|id)-(.*?)$/.exec(name)
      if (match) {
        if (!options.pseudos) options.pseudos = [];
        switch (match[1]) {
          case "is":
            options.pseudos.push(match[2]);
            break;
          case "id":
            options.id = match[2];
        }
      }
      return !match;
    })
    delete options.attributes['class'];
  }
  return options;
}

ART.Layout.replace = function(element) {
  var layout = new ART.Layout(element, element.getChildren());
  if (element.parentNode) {
    layout.widget.inject(element.ownerDocument.body);
    $(layout.widget).inject(element, 'after');
    element.dispose();
  }
  return layout.widget;
}

ART.Layout.parse = function(selector) {
  var parsed = Slick.parse(selector).expressions[0][0]
  var options = {
    tag: parsed.tag == '*' ? 'container' : parsed.tag
  };
  if (parsed.id) options.id = parsed.id
  if (parsed.attributes) parsed.attributes.each(function(attribute) {
    if (!options.attributes) options.attributes = {};
    options.attributes[attribute.key] = attribute.value || true;
  });
  if (parsed.classes) options.classes = parsed.classes.map(Macro.map('value'));
  if (parsed.pseudos) options.pseudos = parsed.pseudos.map(Macro.map('key'));
  switch (parsed.combinator) {
    case '^':
      options.inherit = 'full';
      break;
    case ">":
      options.inherit = 'partial';
  }
  return options;
}

ART.Layout.build = function(item, parent, element) {
  var options;
  if (Element.type(item)) {
    if (ART.Layout.isConvertable(item)) {
      options = ART.Layout.convert(item);
    } else {
      var result = item.inject(parent);
      if (result && parent.getContainer) $(item).inject(parent.getContainer());
      return result;
    }
  } else options = ART.Layout.parse(item);
  var mixins = [];
  var tag = options.tag;
  switch (options.inherit) {
    case 'full': //add full parent class path (tag, type, subclass)
      tag = (parent.options.source || parent.name) + '-' + tag;
      break;
    case 'partial': //add partial parent class path (tag and type)
      var type = parent.getAttribute('type');
      if (type) tag = type + '-' + tag;
      var bits = (parent.options.source || parent.name).split('-');
      if (bits.length > 1) bits.pop();
      tag = bits.join('-') + '-' + tag;
  }
  if (options.attributes) {
    if ('type' in options.attributes) tag += "-" + options.attributes.type;
    if ('kind' in options.attributes) tag += "-" + options.attributes.kind;
    for (var name in options.attributes) {
      var value = options.attributes[name];
      var bits = name.split('-');
      for (var i = bits.length - 1; i > -1; i--) {
        var obj = {};
        obj[bits[i]] = value;
        if (i == 0) $mixin(options, obj);
        else value = obj;
      }
      var trait = ART.Layout.findTraitByAttributeName(name);
      if (trait) mixins.push(trait);
    }
  }
  
  mixins.unshift(tag);
  
  //console.info(options)
  
  options.source = tag;
  var widget = ART.Widget.create(mixins, options);
  widget.build();
  
  if (!options.id && parent) {
    var property = tag + 's';
    if (!parent[property]) parent[property] = [];
    parent[property].push(widget)
  }
  if (element !== false && (element || parent)) widget.inject(element || parent, 'bottom', true)
  
  return widget;
};