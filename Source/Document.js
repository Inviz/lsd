/*
---
 
script: Document.js
 
description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Node
  - LSD.Module.Attributes
  - LSD.Module.DOM
  - LSD.Module.Events
  - LSD.Module.Layout
 
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
  
  The class contains a few hacks that allows Slick to initialize.
*/

LSD.Document = new Class({

  Includes: [
    LSD.Node,
    LSD.Module.Attributes,
    LSD.Module.DOM,
    LSD.Module.Events,
    LSD.Module.Layout
  ],
  
  States: {
    built: ['build', 'destroy', false]
  },
  
  options: {
    tag: '#document',
    root: false, // topmost widget's parentNode is the document if set to true
    layout: {
      method: 'augment'
    }
  },
  
  initialize: function(element, options) {
    if (!LSD.document.body) LSD.document = Object.append(this, LSD.document);
    this.parent.apply(this, [element, options]);
    this.body = this.element;
    this.document = this.documentElement = this;
    
    this.xml = true;
    this.navigator = {};
    this.attributes = {};
    this.slickFeatures = {
      brokenStarGEBTN: false,
      starSelectsClosedQSA: false,
      idGetsName: false,
      brokenMixedCaseQSA: false,
      brokenGEBCN: false,
      brokenCheckedQSA: false,
      brokenEmptyAttributeQSA: false,
      isHTMLDocument: false,
      nativeMatchesSelector: false
    }                        
    this.nodeType = 9;
    this.events = this.options.events;
    this.dominjected = true;
    this.build();
  },
  
  build: function() {
    if (this.stylesheets) this.stylesheets.each(this.addStylesheet.bind(this));
    this.parent.apply(this, arguments);
  },
  
  setParent: function(widget) {
    if (this.options.root) this.parent.apply(this, arguments);
  },
  
  id: function(item) {
    if (item.render) return item;
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
  }
});

// Properties set here will be picked up by first document
LSD.document = {}; 

// Queue up stylesheets before document is loaded
LSD.Document.addStylesheet = function(sheet) {
  var instance = LSD.document, stylesheets = instance.stylesheets
  if (instance.addStylesheet) return instance.addStylesheet(sheet)
  if (!stylesheets) stylesheets = instance.stylesheets = [];
  instance.stylesheets.push(sheet);
}