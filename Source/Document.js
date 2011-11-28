/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Widget
  - Core/DomReady
  - Core/Options
  - Core/Events
  - More/String.QueryString
  - LSD
  - LSD.Module.Attributes
  - LSD.Module.Properties
  - LSD.Module.Render
  - LSD.Module.Selectors

provides:
  - LSD.Document

...
*/


/*
  Document is a big disguise proxy class that contains the tree
  of widgets and a link to document element.
  
  It is DOM-compatible (to some degree), so tools that crawl DOM
  tree (we use Slick) can work with the widget tree like it usually
  does with the real DOM so we get selector engine for free.
  
  The document itself is not in the tree, it's a container.
  
  The class contains a few hacks that allows Slick to initialize.
*/


LSD.Document = new Class({
  
  Implements: [Events, Options, LSD.Module.Attributes, LSD.Module.Properties, LSD.Module.Render],
  
  options: {
    context: 'element',
    namespace: 'LSD'
  },
  
  initialize: function(document, options) {
    if (options && options.documentElement || document && !document.documentElement) 
      options = [document, document = options][0];
    if (document == null) document = window.document;
    if (!LSD.document) LSD.document = this;
    this.commands = new LSD.Object;
    this.setOptions(options || {});
    this.document = this;
    this.element = document;
    this.sourceIndex = 1;
    this.layout = this.getLayout();
    this.childNodes = [];
    this.factory = Object.getFromPath(LSD.global[this.options.namespace], LSD.toClassName(this.options.context));
    LSD.uid(this);
    if (this.constructors.properties) this.constructors.properties.apply(this, arguments);
    if (this.constructors.render) this.constructors.render.apply(this, arguments);
    
    /*
      Trick Slick into thinking that LSD elements tree is an XML node 
      tree (so it won't try speeding up the queries with optimizations)
    */
    this.documentElement = this;
    this.xml = true;
    this.slickFeatures = LSD.Module.Selectors.Features;
    this.nodeType = 9;
    this.attributes = {};
    
    this.params = (typeof location != 'undefined' && location.search.length > 1) 
      ? location.search.substr(1, location.search.length - 1).parseQueryString() 
      : {}
    if (this.element && this.element.documentElement) {
      this.element.addEvent('domready', function() {
        this.building = true;
        if ("benchmark" in this.params) LSD.console.profile();
        this.build();
        if ("benchmark" in this.params) LSD.console.profileEnd();
        this.building = false;
      }.bind(this));
      this.element.addEvent('click', this.onClick.bind(this));
      this.element.addEvent('mousedown', this.onMousedown.bind(this));
    } else {
      this.build();
    }
  },
  
  /* 
    Single relay click listener is put upon document.
    It spies for all clicks on elements and finds out if 
    any links were clicked. If the link is not widget,
    the listener creates a lightweight link class instance and
    calls click on it to trigger commands and interactions.
    
    This way there's no need to preinitialize all link handlers, 
    and only instantiate class when the link was actually clicked.
  */
  onClick: function(event) {
    if (event.target.ownerDocument == document && // click is in the same frame
       !event.rightClick &&                       // and click is not right click
       !(event.control || event.meta) &&          // and ctrl/command is not held
       !(event.event.which == 3))                 // and it's not the middle button
    for (var target = event.target, link, widget; target && target.tagName; target = target.parentNode) {
      widget = target.uid && Element.retrieve(target, 'widget');
      var a = (LSD.toLowerCase(target.tagName) == 'a');
      if (a) {
        if (!widget) {
          var parent = LSD.Module.DOM.find(target)
          widget = new LSD.Widget(target, {
            pseudos: ['clickable', 'command'],
            document: this
          });
          parent.appendChild(widget, false);
        }
        event.preventDefault();
      }
      if (widget && widget.pseudos.clickable) {
        event.stopPropagation();
         if (widget.click(event)) break;
      }
    };
  },
  
  onMousedown: function(event) {
    if (event.target.ownerDocument == document)
    for (var target = event.target, widget; target && target.tagName; target = target.parentNode) {
      widget = target.nodeType && !target.lsd ? target.uid && Element.retrieve(target, 'widget') : target;
      if (widget && widget.pseudos.activatable) {
        widget.fireEvent('mousedown', event);
        target = widget;
      }
    };
  },
  
  setHead: function(head) {
    for (var i = 0, el, els = head.getElementsByTagName('meta'); el = els[i++];) {
      var type = el.getAttribute('rel');
      if (type) {
        type += 's';
        if (!this[type]) this[type] = {};
        var content = el.getAttribute('content')
        if (content) this[type][el.getAttribute('name')] = (content.charAt(0) =="{") ? JSON.decode(content) : content;
      }
    }
    // Attach stylesheets, if there are stylesheets loaded
    if (LSD.Sheet && LSD.Sheet.stylesheets) for (var i = 0, sheet; sheet = LSD.Sheet.stylesheets[i++];) this.addStylesheet(sheet);
  },
  
  getLayout: function() {
    if (this.layout) return this.layout;
    this.layout = new LSD.Layout;
    this.layout.document = this;
    return this.layout;
  },
  
  create: function(element, options) {
    if (!options) options = {};
    options.document = this;
    return this.factory.create(element, options);
  },
  
  build: function(document) {
    this.fireEvent('beforeBuild', document)
    this.built = true;
    if (this.element !== false) {
      if (!document) document = this.element || window.document;
      this.setHead(document.head);
      var element = this.element = document.body;
      this.setBody(document.body);
    }
    this.render();
    this.fireEvent('build', document)
  },
  
  setBody: function(element) {
    if (!element) element = this.getBodyElement();
    this.fireEvent('beforeBody', element);
    var options = {
      document: this, 
      events: {
        self: {
          boot: function() {
            this.document.body = this;
          }
        }
      },
      tag: 'body'
    };
    if (this.options.mutations) options.mutations = this.options.mutations;
    if (this.options.context) options.context = this.options.context;
    new LSD.Widget(element, options);
    this.fireEvent('body', [this.body, element]);
    this.childNodes.push(this.body)
    return element;
  },

  getBodyElement: function() {
    return this.document.body;
  },
  
  redirect: function(url) {
    window.location.href = url;
  },
  
  getElements: function() {
    return this.body.getElements.apply(this.body, arguments);
  },
  
  getElement: function() {
    return this.body.getElement.apply(this.body, arguments);
  },
  
  addStylesheet: function(sheet) {
    if (!this.stylesheets) this.stylesheets = [];
    this.stylesheets.include(sheet);
    sheet.attach(this);
  },
  
  removeStylesheet: function(sheet) {
    if (!this.stylesheets) return;
    this.stylesheets.erase(sheet);
    sheet.detach(this);
  },
  
  $family: Function.from('document')
});