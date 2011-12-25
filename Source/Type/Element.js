/*
---
 
script: Element.js
 
description: Attach and detach a widget to/from element
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Layout

provides: 
  - LSD.Module.Element
 
...
*/

LSD.Type.Element = new LSD.Struct({
  
});

Object.append(LSD.Module.Element, {
  /* 
    Extracts options from a DOM element.
  */
  extract: function(element, widget) {
    var options = {
      attributes: {},
      tag: LSD.toLowerCase(element.tagName)
    }, attrs = options.attributes;
    for (var i = 0, attribute, name; attribute = element.attributes[i++];) {
      name = attribute.name;
      attrs[name] = LSD.Attributes[name] == 'boolean' || (attribute.value == null ? true : attribute.value);
    }
    var klass = attrs['class'];
    if (klass) {
      options.classes = klass.split(/\s+/).filter(function(name) {
        switch (name.substr(0, 3)) {
          case "is-":
            if (!options.pseudos) options.pseudos = [];
            options.pseudos.push(name.substr(3, name.length - 3));
            break;
          case "id-":
            i++;
            options.attributes.id = name.substr(3, name.length - 3);
            break;
          default:
            return true;
        }
      })
      delete attrs['class'];
      i--;
    }
    if (widget) {
      if (widget.tagName) delete options.tag;
      for (var name in attrs) if (widget.attributes[name]) {
        delete attrs[name];
        i--;
      }
    }
    if (i == 1) delete options.attributes;
    return options;
  },
  
  /*
    Extract options off from widget and makes it rebuild element if it doesnt fit.
  */
  validate: function(widget, query) {
    if (widget.extracted) Object.merge(query, widget.extracted);
    var tag = widget.getElementTag(true);
    if (widget.options.clone || (tag && LSD.toLowerCase(query.element.tagName) != tag)) {
      widget.properties.set('origin', query.element);
      query.tag = tag;
      query.build = true;
    }
  },
  
  /*
    Preparation happens when widget is initialized. If element was passed into
    constructor, it will go through a build/attach routine from the start. 
    
    A widget may be set to defer the attachment with a `lazy` option set to true. 
  */
  events: {
    prepare: function(options, element) {
      if (!element) return;
      if (this.options.extract !== false || this.options.clone) {
        this.extracted = LSD.Module.Element.extract(element, this);
        this.setOptions(this.extracted);
      }
      if (options.lazy) this.properties.set('origin', element);
      else this.build(element);
    }
  }
});

LSD.Options.origin = {
  add: function(object) {
    this.properties.set('origin', object);
  },
  remove: function(object) {
    this.properties.unset('origin', object);
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Element.prototype, LSD.Module.Element.events);