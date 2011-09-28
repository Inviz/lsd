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
  enable: function(target, content) {
    if (!content) return LSD.warn('Update action did not recieve content');
    if (content.charAt) {
      var fragment = document.createFragment(content);
      var children = LSD.slice(fragment.childNodes);
    } else {
      var fragment = document.createFragment('');
      if (!Type.isEnumerable(content)) {
        var children = [content];
        fragment.appendChild(content);
      } else for (var i = 0, child; child = children[i++];) fragment.appendChild(child);
    }
    if (target.lsd) {
      var widget = target;
      var element = widget.toElement();
      var parent = target.parentNode;
    } else {
      var widget = LSD.Module.DOM.find(target);
      if (widget.element == target) {
        parent = widget.parentNode;
        var element = target;
      } else {
        var element = target, parent = widget;
        widget = null;
      }
    }
    this.options.update.apply(this, [element, widget, parent, fragment, children]);
    if (widget) widget.fireEvent('DOMInserted', children);
  },
  
  update: function(element, widget, parent, fragment, children) {
    (widget || parent).removeLayout(null, element.childNodes, element);
    element.appendChild(fragment);
    (widget || parent).addLayout(null, children, element);
  }
});

LSD.Action.Append = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,
  
  update: function(element, widget, parent, fragment, children) {
    element.appendChild(fragment);
    (widget || parent).addLayout(null, children, element)
  }
});

LSD.Action.Replace = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(element, widget, parent, fragment, children) {
    var parentNode = element.parentNode
    parentNode.replaceChild(fragment, element);
    parent.removeLayout(null, widget || element);
    parent.addLayout(null, children, parentNode);
  }
});

LSD.Action.Before = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(element, widget, parent, fragment, children) {
    element.parentNode.insertBefore(fragment, element);
    parent.addLayout(null, children, element.parentNode, {before: element});
  }
});

LSD.Action.After = LSD.Action.build({
  enable: LSD.Action.Update.prototype.options.enable,

  update: function(element, widget, parent, fragment, children) {
    element.parentNode.insertBefore(fragment, element.nextSibling);
    parent.addLayout(null, children, element.parentNode, {before: element.nextSibling});
  }
});