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
    },
    nodeType: 9
  },
  
  initialize: function(element, options) {
    if (!LSD.document.body) LSD.document = Object.append(this, LSD.document);
    this.parent.apply(this, [element, options]);
    this.body = this.element;
    this.document = this.documentElement = this;
    if (this.nodeType != 9) this.ownerDocument = this;
    
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
      nativeMatchesSelector: false,
      hasAttribute: function(node, attribute) {
        return (attribute in node.attributes) || ((attribute in node.options.states) && (attribute in node.pseudos))
      },
      getAttribute: function(node, attribute) {
        return node.attributes[attribute] || ((attribute in node.options.states) && node.pseudos[attribute]);
      },
      compareDocumentPosition: function(self, node) {
        var context = node.localName ? (self.localName ? self : self.toElement()) : self;
        if (node) do {
        	if (node === context) return true;
        } while ((node = node.parentNode));
        return false;
      },
      documentSorter: function(a, b) {
        return features.compareDocumentPosition(a, b) & 4 ? -1 : a === b ? 0 : 1;
      }
    }                 
    this.events = this.options.events;
    this.dominjected = true;
    this.build();
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
  },
  
  createFragment: function(content) {
    var fragment = document.createFragment(content)
    this.fireEvent('DOMNodeInserted', fragment);
    return fragment;
  }
});

LSD.Document.prototype.addEvents({
  initialize: function() {
    if (this.watch) {
      // Attach behaviour expectations
      LSD.Module.Expectations.attach(this);
      // Attach action expectations
      LSD.Module.Actions.attach(this);
    }
    // Attach stylesheets, if there are stylesheets loaded
    if (LSD.Sheet && LSD.Sheet.stylesheets) for (var i = 0, sheet; sheet = LSD.Sheet.stylesheets[i++];) this.addStylesheet(sheet);
  }
});

// Properties set here will be picked up by first document
LSD.document = {}; 