/*
---
 
script: Update.js
 
description: Update widget with html or json
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action

provides:
  - LSD.Action.Update
  - LSD.Action.Append
  - LSD.Action.Replace
  - LSD.Action.Before
  - LSD.Action.After

...
*/

LSD.Action.Update = LSD.Action.build({
  container: true,
  
  enable: function(target, content) {
    if (!content) return LSD.warn('Update action did not recieve content');
    var widget = LSD.Module.DOM.find(target);
    if (typeof content == 'string') {
      var fragment = document.createFragment(content);
      var children = LSD.slice(fragment.childNodes);
    } else {
      var children = content.hasOwnProperty('length') ? content : [content];
    }
    if (target.lsd) {
      var element = target.toElement(), parent = target.parentNode;
    } else {
      var element = target, parent = widget;
      if (parent.element == element) parent = parent.parentNode;
    }
    var container = (target.lsd || (widget.element == target && widget)) ? widget[this.options.container ? 'getWrapper' : 'toElement']() : element;
    var args = [container, parent, fragment, children, content];
    this.options.update.apply(this, args);
  },
  
  update: function(target, parent, fragment, children) {
    document.id(target).empty().appendChild(fragment);
    parent.fireEvent('DOMNodeInserted', [children]);
  }
});

LSD.Action.Append = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,
  
  update: function(target, parent, fragment, children) {
    target.appendChild(fragment);
    parent.fireEvent('DOMNodeInserted', [children]);
  }
});

LSD.Action.Replace = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(target, parent, fragment, children) {
    console.log(target, fragment, children)
    target.parentNode.replaceChild(fragment, target);
    LSD.Module.DOM.destroy(target, true);
    parent.fireEvent('DOMNodeInserted', [children, target]);
  }
});

LSD.Action.Before = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(target, parent, fragment, children) {
    target.parentNode.insertBefore(fragment, target);
    parent.fireEvent('DOMNodeInsertedBefore', [children, target]);
  }
});

LSD.Action.After = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(target, widget, fragment, children) {
    target.parentNode.insertBefore(fragment, target.nextSibling);
    parent.fireEvent('DOMNodeInsertedBefore', [children, target.nextSibling]);
  }
});