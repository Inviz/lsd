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

LSD.Module.Element = new Class({
  
  /*
    ## Default options:
    
    ### key: 'widget'
    
    The key in element storage that widget will use to store itself.
    When set to false, widget is not written into element storage.
    
    ### destructable: true
    
    If a widget that was attached to element is getting attached to
    another element, it will destroy the old element.
    If a widget is as not `destructable`, it will only detach
    event handlers.
    
    ### inline: null
    
    Inline option makes the widget render `<div>` element when true,
    `<span>` when false, and tries using the widget tag name if 
    `inline` option is not set
  */
  
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
        if (this.built && this.element != element) this[this.options.destructable !== false ? 'destroy' : 'detach']();
      } else this.element = document.id(element);
    }
    if (!this.built) this.build();
    this.properties.set('element', this.element);
    if (this.options.key !== false) 
      this.element.store(this.options.key || 'widget', this).fireEvent('attach', this);
    /*
      Extracts and sets layout options from attached element
    */
    if (!this.extracted && this.options.extract !== false && (!this.built || this.origin)) {
      this.extracted = LSD.Module.Element.extract(element, this);
      this.setOptions(this.extracted);
    }
    return this.element;
  },

  detach: function(element) {
    if (this.options.key !== false) 
      this.element.eliminate(this.options.key || 'widget', this).fireEvent('detach', this)
    this.properties.unset('element', this.element);
    /*
      Unsets options previously extracted from the detached element
    */
    if (this.extracted) {
      this.unsetOptions(this.extracted);
      delete this.extracted, delete this.origin;
    }
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
    if (element) LSD.Module.Element.validate(this, query);
    if (this.parentNode) this.parentNode.dispatchEvent('beforeNodeBuild', [query, this]);
    var build = query.build;
    delete query.element, delete query.build;
    var attrs = {};
    for (var attribute in this.attributes) 
      if (this.attributes.has(attribute)) 
        attrs[attribute] = this.attributes[attribute];
    Object.merge(attrs, options.element, query.attributes);
    for (var attribute in attrs)
      if (this.attributes[attribute] != attrs[attribute]) 
        this.attributes.set(attribute, attrs[attribute]);
    var tag = query.tag || attrs.tag || this.getElementTag();
    delete attrs.tag; delete query.tag;
    if (!element || build) {
      element = this.element = new Element(tag, attrs.type ? {type: attrs.type} : null);
    } else {
      element = this.element = document.id(element);
    }  
    for (var name in attrs) 
      if (name != 'type' || tag != 'input') {
        if (LSD.Attributes[name] == 'boolean') element[name] = true;
        element.setAttribute(name, attrs[name] === true ? name : attrs[name]);
      }
    var classes = [];
    if (this.tagName != tag) classes.push('lsd ', this.tagName);
    for (var name in this.classes) if (this.classes.has(name)) classes.include(name);
    if (classes.length) this.element.className = classes.join(' ');
    if (this.style) for (var property in this.style.element) this.element.setStyle(property, this.style.element[property]);
    this.attach(this.element);
    return this.element;
  },
  
  getElementTag: function(soft) {
    if (this.element) return LSD.toLowerCase(this.element.tagName);
    var options = this.options, element = options.element;
    if (element && element.tag) return element.tag;
    if (!soft) switch (options.inline) {
      case null: case undefined:
        return LSD.Layout.NodeNames[this.tagName] ? this.tagName : "div";
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
    if (this.parentNode) this.dispose();
    var element = this.element;
    if (element) {
      this.detach(element);
      element.destroy();
    }
    return this;
  },
  
  $family: function() {
    return this.options.key || 'widget';
  }
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