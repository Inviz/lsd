/*
---
 
script: Application.js
 
description: A class to handle execution and bootstraping of LSD
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Core/DomReady
  - Core/Options
  - Core/Events
  - More/String.QueryString
  - LSD
  
provides:
  - LSD.Application
 
...
*/
LSD.Application = new Class({
  Implements: [Options, Events],
  
  options: {
    method: 'augment'
  },
  
  initialize: function(document, options) {
    if (!LSD.application) LSD.application = this;
    this.param = (location.search.length > 1) ? location.search.substr(1, location.search.length - 1).parseQueryString() : {}
    if (document) this.element = document.id(document);
    if (options) this.setOptions(options);
    document.addEvent('domready', function() {
      if (this.param.benchmark != null) console.profile();
      this.setDocument(document);
      if (this.param.benchmark != null) console.profileEnd();
    }.bind(this));
  },
  
  setHead: function(head) {
    for (var i = 0, el, els = head.getElementsByTagName('meta'); el = els[i++];) {
      var type = el.getAttribute('rel');
      if (type) {
        if (!this[type]) this[type] = {};
        var content = el.getAttribute('content')
        if (content) this[type][el.getAttribute('name')] = (content.charAt(0) =="{") ? JSON.decode(content) : content;
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
    var body = this.body = new LSD.Widget(element);
    this.fireEvent('body', [body, element]);
    return body;
  },
  
  getBody: function() {
    return this.body;
  },
  
  redirect: function(url) {
    window.location.href = url;
  }
  
});