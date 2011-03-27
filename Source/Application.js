/*
---
 
script: Application.js
 
description: A class to handle execution and bootstraping of LSD
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - Core/DomReady
  
provides:
  - LSD.Application
 
...
*/
LSD.Application = new Class({
  Extends: LSD.Node,
  
  options: {
    method: 'augment'
  },
  
  initialize: function(document, options) {
    if (!LSD.application) LSD.application = this;
    this.param = {};
    this.parent.apply(this, arguments);
    document.addEvent('domready', function() {
      this.setDocument(document);
    }.bind(this));
  },
  
  setHead: function(head) {
    for (var i = 0, el, els = head.getElementsByTagName('meta'); el = els[i++];) {
      var type = el.getAttribute('rel');
      if (type) {
        if (!this[type]) this[type] = {};
        this[type][el.getAttribute('name')] = el.getAttribute('content');
      }
    }
  },
  
  setDocument: function(document) {
    this.setHead(document.head);
    var element = this.element = document.body;
    this.setBody(document.body);
  },
  
  setBody: function(element) {
    this.fireEvent('beforeBody', element);
    var body = this.body = new (this.getBodyClass(element))(element);
    this.fireEvent('body', [body, element]);
    return body;
  },
  
  getBodyClass: function() {
    return LSD.Widget.Body
  },
  
  getBody: function() {
    return this.body;
  },
  
  redirect: function(url) {
    window.location.href = url;
  }
  
});