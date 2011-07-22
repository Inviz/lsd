/*
---
 
script: Element.js
 
description: Attach and detach a widget to/from element
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events

provides: 
  - LSD.Module.Element
 
...
*/

LSD.Module.Element = new Class({
  options: {
    key: 'node',
    reusable: true,
    inline: null
  },
  
  constructors: {
    element: function() {
      LSD.uid(this);
    }
  },
  
  /*
    Attaches widget to a DOM element. If a widget was
    attached to some other element, it deattaches that first
  */
  
  attach: function(element) {
    if (element) {
      if (this.element) {
        if (this.built && this.element != element) this[this.options.reusable ? 'detach' : 'destroy']();
      } else this.element = document.id(element);
    }
    if (!this.built) this.build();
    this.fireEvent('register', ['element', this.element]);
    if (this.options.key) this.element.store(this.options.key, this).fireEvent('attach', this);
    return this.element;
  },

  detach: function(element) {
    this.fireEvent('unregister', ['element', this.element]);
    if (this.options.key) this.element.eliminate(this.options.key, this).fireEvent('detach', this)
    delete this.element;
  },
  
  toElement: function(){
    if (!this.built) this.build(this.origin);
    return this.element;
  },
  
  build: function(query) {
    if (query) {
      if (query.localName) {
        var element = query; 
        query = {};
      }
    } else query = {};
    element = query.element = element || this.element;
    var options = this.options;
    this.fireEvent('beforeBuild', query);
    if (this.parentNode) this.parentNode.dispatchEvent('beforeNodeBuild', [query, this]);
    var build = query.build;
    delete query.element, delete query.build;
    var attrs = {}
    for (var attribute in this.attributes) 
      if (this.attributes.hasProperty(attribute)) 
        attrs[attribute] = this.attributes[attribute];
    Object.merge(attrs, options.element, query.attributes);
    var tag = query.tag || attrs.tag || this.getElementTag();
    delete attrs.tag; delete query.tag;
    if (query.attributes || query.classes || query.pseudos) this.setOptions(query);
    if (!element || build) {
      this.element = new Element(tag, attrs);
    } else {
      var element = this.element = document.id(element);
      for (var name in attrs) 
        if (name != 'type' || tag != 'input') 
          element.setAttribute(name, attrs[name] === true ? name : attrs[name]);
    }
    var classes = [];
    if (this.tagName != tag) classes.push('lsd', this.tagName)
    for (var klass in this.classes) 
      if (this.classes.hasProperty(klass)) classes.include(klass)
    if (classes.length) this.element.className = classes.join(' ');

    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    return this.element;
  },
  
  getElementTag: function(soft) {
    if (this.element) return LSD.toLowerCase(this.element.tagName);
    var options = this.options, element = options.element;
    if (element && element.tag) return element.tag;
    if (!soft) switch (options.inline) {
      case null:
        return this.tagName;
      case true:
        return "span";
      case false:
        return "div"
      default:
        return options.inline;
    }
  },
  
  destroy: function() {
    this.fireEvent('beforeDestroy');
    this.element.destroy();
    return this;
  },
  
  $family: function() {
    return this.options.key || 'widget';
  }
});

/* 
  Extracts options from a DOM element.
*/
LSD.Module.Element.extract = function(element, widget) {
  var options = {
    attributes: {},
    tag: LSD.toLowerCase(element.tagName)
  }, attrs = options.attributes;
  for (var i = 0, attribute, name; attribute = element.attributes[i++];) {
    name = attribute.name;
    attrs[name] = LSD.Attributes.Boolean[name] || attribute.value || "";
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
}

LSD.Module.Element.events = {
  /*
    A lazy widget will not attach to element until it's built or attached
  */
  prepare: function(options, element) {
    if (options.lazy) this.origin = element;
    else if (element) this.build(element);
  },
  /*
    If a the widget was built before it was attached, attach it after the build
  */
  build: function() {
    this.attach.apply(this, arguments);
  },
  /*
    Detaches element when it's destroyed
  */
  destroy: function() {
    this.detach.apply(this, arguments);
  },
  /*
    Extracts and sets layout options from attached element
  */
  attach: function(element) {
    if (!this.extracted && this.options.extract !== false && (!this.built || this.origin)) {
      this.extracted = LSD.Module.Element.extract(element, this);
      this.setOptions(this.extracted);
    }
  },
  /*
    Unsets options previously extracted from the detached element
  */
  detach: function() {
    if (!this.extracted) return;
    this.unsetOptions(this.extracted);
    delete this.extracted, delete this.origin;
  },
  /*
    Extract options off from widget and makes it rebuild element if it doesnt fit.
  */
  beforeBuild: function(query) {
    if (!query.element) return;
    if (this.options.extract !== false || this.options.clone) {
      this.extracted = LSD.Module.Element.extract(query.element, this);
      this.setOptions(this.extracted);
      Object.merge(query, this.extracted);
    }
    var tag = this.getElementTag(true);
    if (this.options.clone || (tag && LSD.toLowerCase(query.element.tagName) != tag)) {
      this.origin = query.element;
      query.tag = tag;
      query.build = true;
    }
  }
};

LSD.Options.origin = {
  add: function(object) {
    if (object.localName) {
      if (this.built) this.attach(object);
      else this.origin = object;
    }
  },
  remove: function(object) {
    if (object.localName) {
      if (this.origin == object) {
        delete this.origin;
        if (this.attached) this.detach(object);
      }
    }
  }
};

LSD.Module.Events.addEvents.call(LSD.Module.Element.prototype, LSD.Module.Element.events);