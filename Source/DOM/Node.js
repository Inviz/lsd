/*
---
 
script: Node.js
 
description: A node function interface that for basic manipulations
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

provides: 
  - LSD.Node
 
...
*/

LSD.Node = function() {}
LSD.Node.prototype._ownable = false;
LSD.Node.prototype.appendChild = function(child) {
  if (child.parentNode) child.parentNode.removeChild(child);
  this.childNodes.push(child)
  return this;
};
LSD.Node.prototype.insertBefore = function(child, before) {
  if (child.parentNode) child.parentNode.removeChild(child);
  var index = this.childNodes.indexOf(before);
  if (index == -1) index = this.childNodes.length;
  this.childNodes.splice(index, 0, child);
  return this;
};
LSD.Node.prototype.removeChild = function(child) {
  var index = this.childNodes.indexOf(child);
  if (index > -1) this.childNodes.splice(index, 1);
  return this;
};
LSD.Node.prototype.replaceChild = function(child, old) {
  var index = this.childNodes.indexOf(old);
  if (index > -1) this.childNodes.splice(index, 1, child);
  return this;
};
LSD.Node.prototype.cloneNode = function(children) {
  return (this.document || LSD.Document.prototype).createNode(this.nodeType, this);
};
LSD.Node.prototype.inject = function(node, where) {
  return this.inserters[where || 'bottom'](this, node);
};
LSD.Node.prototype.grab = function(node, where){
  return this.inserters[where || 'bottom'](node, this);
};
LSD.Node.prototype.replaces = function(el) {
  this.inject(el, 'after');
  el.dispose();
  return this;
};
LSD.Node.prototype.dispose = function() {
  var parent = this.parentNode;
  if (!parent) return this;
  parent.removeChild(this);
  return this;
};
LSD.Node.prototype.setVariables = function(value, old, meta) {
  var fragment = this.fragment;
  this.mix('variables', 
           value && (fragment && fragment != value.fragment && fragment.variables || value.get('variables', true, 'variables')), 
           old && (fragment && fragment != old.fragment && fragment || old).variables,
           'variables');
};
LSD.Node.prototype.$family = function() {
  return 'widget';
};
LSD.Node.prototype.inserters = {
  before: function(context, element){
    var parent = element.parentNode;
    if (parent) parent.insertBefore(context, element);
  },
  after: function(context, element){
    var parent = element.parentNode;
    if (parent) parent.insertBefore(context, element.nextSibling);
  },
  bottom: function(context, element){
    element.appendChild(context);
  },
  top: function(context, element){
    element.insertBefore(context, element.firstChild);
  }
};
LSD.Node.prototype.nextSibling = null;
LSD.Node.prototype.previousSibling = null;
LSD.Node.prototype.firstChild = null;
LSD.Node.prototype.lastChild = null;