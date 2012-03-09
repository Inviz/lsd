/*
---
 
script: Position.js
 
description: An observable object 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Object
  
provides:
  - LSD.Position
  
...
*/

LSD.Position = function(object, options) {
  this.object = object;
  this.setOptions(options);
};

LSD.Position.fallback = ['flip', 'hug', 'invert'];

(function() {
  var expanded = {};
  var vertical = {top: true, bottom: true, left: false, right: false};
  var props = ['left', 'top'], dimensions = ['x', 'y']
  var oprops = {left: true, top: true};
  var flip = {left: 'right', right: 'left', bottom: 'top', top: 'bottom'};
  LSD.Position.calculate = function(object, boundaries, position, anchor, fallback) {
    if (!position) position = ['center', 'center']
    else if (position.split) {
      // expand position (left -> [left, center])
      var pos = expanded[position];
      if (!pos) expanded[position] = pos = position.split('-');
      position = pos;
    }
    if (!position[1] || vertical[position[0]] == vertical[position[1]]) position[1] = 'center';
    if (!anchor) {
      // no anchor given, object either fits into boundaries or not
      if (object.x > boundaries.x || object.y > boundaries.y) return false;
      var result = {};
      for (var i = 0, pos; pos = position[i]; i++)
        if (pos == 'center') {
          var index = vertical[position[+!i]];
          index = (index == null) ? i : +!index;
          result[index ? 'y' : 'x'] = ((boundaries[dimensions[index]] || 0) - object[dimensions[index]]) / 2;
        } else {
          var index = +vertical[pos];
          result[index ? 'y' : 'x'] = (oprops[pos] ? 0 : ((boundaries[dimensions[index]] || 0) - object[dimensions[index]]))
        }
      if (boundaries.left) result.x += boundaries.left;  
      if (boundaries.top) result.y += boundaries.top;
    } else {
      // positioning against anchor means different boundaries and another position
      var index = +!!vertical[position[0]];
      var query = {};
      switch (position[0]) {
        case "center":
        
          break;
        case props[index]:
          query[props[index]] = 0;
          query[dimensions[index]] = anchor[props[index]];
          break;
        default:
          query[props[index]] = anchor[props[index]] + anchor[dimensions[index]];
          query[dimensions[index]] = (boundaries[props[index]] || 0) + boundaries[dimensions[index]] - anchor[dimensions[index]] - anchor[props[index]];
      };
      switch (position[1]) {
        case "center":
          query[props[+!index]] = anchor[props[+!index]] + anchor[dimensions[+!index]] / 2
          break;
        case props[+!index]:
          query[props[+!index]] = anchor[props[+!index]];
          break;
        default:
          query[dimensions[+!index]] = anchor[props[+!index]] + anchor[dimensions[+!index]];
      }
      // positioning an object at top right relative to anchor,
      // means positioning at bottom right of rectangle space above the anchor. 
      var result = LSD.Position.calculate(object, query, [flip[position[0]], position[1]]);
      if (result) {
        //result[dimensions[+!index]] -= anchor[props[+!index]];
      } else if (fallback) {
        // if the object does not fit there, fallback method may be used
        if (fallback === true) fallback = LSD.Position.fallback;
        else if (fallback.match) fallback = [fallback];
        for (var i = 0, method, attempt; method = fallback[i++];) {
          switch (method) {
            case "flip":
              // tries "right top", closest corner on the same side
              attempt = [position[1], position[0]];
              break;
            case "hug":
              // tries "left top", distant corner on the same side
              attempt = [flip[position[1]], position[0]];
              break;
            case "invert":
              // tries "bottom right", same corner on the other side
              attempt = [flip[position[0]], position[1]];
              break;
            case "revert":
              // tries "right bottom", same corner on the other side
              attempt = [position[0], flip[position[1]]];
          }
          var result = LSD.Position.calculate(object, boundaries, attempt, anchor);
          if (result) break;
        }
      }
    }
    return result;
  };
})();

LSD.Position.getDefaultBoundaries = function() {
  return this.object.ownerDocument.body;
};

LSD.Position.prototype = {
  setOptions: function(options) {
    if (!options.match && !options.push) {
      for (var name in options) {
        var value = options[name];
        switch (name) {
          case "boundaries":
            if (value === true) value = LSD.Position.getDefaultBoundaries;
            break;
        }
        this[name] = value;
      }
    } else this.attachment = options; 
    this.attach(this.attachment)
  },
  attach: function(attachment) {
    this.update(attachment)
  },
  
  detach: function() {
    
  },
  
  resolve: function(object, position, scroll) {
    if (object.call) object = object.call(this);
    if (object.lsd) {
      if (object.size.width) {
        var result = {};
        result.x = object.size.width;
        result.y = object.size.height;
        if (position) {
          result.left = object.style.left || 0;
          result.top = object.style.top || 0
        }
      } else object = object.toElement();
    } 
    if (object.nodeType && !object.lsd) {
      var result = Element[scroll ? 'getScrollSize' : 'getSize'](object);
      if (position) {
        position = Element.getPosition(object);
        result.left = position.x;
        result.top = position.y;
      }
    }
    return result || object;
  },
  
  update: function(attachment) {
    var coordinates = this.coordinates;
    var object, boundaries, anchor, fallback;
    var object = this.resolve(this.object);
    if ((boundaries = this.boundaries)) boundaries = this.resolve(boundaries, null, true);
    if ((anchor = this.anchor)) anchor = this.resolve(anchor, true);
    if ((fallback = this.fallback) && fallback.call) fallback = fallback.call(this);
    var coordinates = LSD.Position.calculate(object, boundaries, attachment || this.attachment, anchor);
    if (!coordinates) {
      if (fallback) {
        coordinates = LSD.Position.calculate(object, boundaries, attachment || this.attachment, anchor, fallback);
        if (coordinates) var fallbacked = true;
      }
    }
    this.fireEvent('update', coordinates, fallbacked)
    this.fallbacked = !!fallbacked;
    this.coordinates = coordinates;
    if (!this.coordinates) {
      this.unset(coordinates);
      delete this.coordinates;
    } else this.set(this.coordinates); 
  },
  
  set: function(styles) {
    for (var name in styles) {
      var prop = name == 'x' ? 'left' : 'top';
      if (this.object.lsd)
        this.object.setStyle(prop, styles[name]);
      else
        this.object.style[prop] = styles[name] + 'px';
    }
  },
  
  unset: function(styles) {
    for (var name in styles){
      var prop = name == 'x' ? 'left' : 'top';
      if (this.object.lsd)
        this.object.setStyle(name, 0);
      else
        delete this.object.style[prop];
    }
  },
  
  addEvent: LSD.Object.prototype.addEvent,
  fireEvent: LSD.Object.prototype.fireEvent,
  removeEvent: LSD.Object.prototype.removeEvent
};