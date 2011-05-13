/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Widget

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
  
  options: {
    tag: 'body',
    root: false, // topmost widget's parentNode is the document if set to true
    container: {
      enabled: false,
      inline: false
    },
    nodeType: 9
  },
  
  initializers: {
    document: function() {
      if (!LSD.document.body) LSD.document = Object.append(this, LSD.document);
      this.body = this;
      this.document = this.documentElement = this;
      this.xml = true;
      this.navigator = {};
      this.slickFeatures = LSD.Module.Selectors.Features;
      if (this.nodeType != 9) this.ownerDocument = this;
      this.dominjected = true;
      return {
        events: {
          build: function() {
            // Attach stylesheets, if there are stylesheets loaded
            if (LSD.Sheet && LSD.Sheet.stylesheets) for (var i = 0, sheet; sheet = LSD.Sheet.stylesheets[i++];) this.addStylesheet(sheet);
          }
        }
      }
    }
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

// Properties set here will be picked up by first document
LSD.document = {}; 