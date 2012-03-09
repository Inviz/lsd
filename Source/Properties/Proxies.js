/*
---
 
script: Proxies.js
 
description: Dont adopt children, pass them to some other widget
 
license: Public domain (http://unlicense.org).
 
authors: Yaroslaff Fedin
  
requires:
  - LSD
 
provides: 
  - LSD.Properties.Proxies
 
...
*/

LSD.Properties.Proxies = LSD.Struct.Group();
LSD.Properties.Proxies.prototype._hash = function(key) {
  switch (key) {
    case '3': case 'textnode': case 'textnodes': case 'text':
      return this[3] || (this[3] = []);
    case '1': case 'element': case 'elements': case '*':
      return this[1] || (this[1] = []);
    case 'all': case 'everything':
      return this.all || (this.all = [])
    // case 'content': case 'unrelated':
    // return this.content || this.content 
    default:  
      if (typeof key == 'string') {
        var object = this._selectors || (this._selectors = {});
      } else if (key && key.exec) {
        var object = this._wildcards || (this._wildcards = {});
        var regexes = this._regexes || (this._regexes = {});
        if (!regexes[key]) regexes[key] = key;
      }  
      return object[key] || (object[key] = []);
  }
};
LSD.Properties.Proxies.prototype._bouncer = function(node) {
  var type = node.nodeType, origin = this._parent.proxies, proxy;
  switch (type) {
    case 1:
      var group = origin._selectors;
      if (group) for (var selector in group) {
        var proxies = group[selector];
        if (proxies.length > 0 && node.test(selector) && (proxy = proxies[0]))
          break;
      }
      break;
    case 3:
      var group = origin._wildcards;
      if (group) for (var wildcard in group) {
        var proxies = group[wildcard];
        var value = node.nodeValue;
        if (proxies.length > 0 && value.test(origin._regexes[wildcard]) && (proxy = proxies[0])) 
          break;
      }
  };
  if (!proxy) proxy = origin[type] && origin[type][0];
  if (!proxy) proxy = origin.all && origin.all[0];
  if (proxy) {
    if (proxy.appendChild) proxy.appendChild(node)
    else if (proxy.before) proxy.before.parentNode.insertBefore(node, proxy.before);
    return false;
  } else return true;
};
