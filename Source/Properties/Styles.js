/*
---

script: Styles.js

description: An observable styles object and CSSOM matcher

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Struct
  - LSD.Group
  - LSD.Document
  - LSD.RegExp
  - Color/Color

provides:
  - LSD.Styles

...
*/

LSD.Styles = LSD.Properties.Styles = LSD.Struct('Journal');

LSD.Styles.prototype.onChange = function(key, value, old, meta) {
  var style = this.constructor[key];
  if (style) {
    if (value != null && typeof value == 'object')
      value = String(value);
    if (typeof value == 'string')
      value = this.constructor.parse(value);
    value = style[value.push ? 'apply' : 'call'](this, value);
    key = style.property;
    if (value === false) return this._skip;
    if (styles.type == 'simple') {
      if (this._owner.element)
        this._owner.element[style] = value;
    } else {
      for (var property in value) this.style[property] = value[property];
    }
  }
};

/*
  CSSOM function parsers for different types of values. Each type may be used
  as a regular function that validates input.
*/

LSD.Styles.Type = {
/*
  Number may be either float or integer. Floats are good for line-heights,
  but not many other properties.
*/
  number: function(obj) {
    if (typeof obj == 'number') return obj;
    return false;
  },
/*
  Number is a integer value. Only a few standart properties accept integer
  as a value, like `zoom`, `line-height` or `zIndex`.
*/
  integer: function(obj) {
    if (obj % 1 == 0 && ((0 + obj).toString() == obj)) return obj;
    return false;
  },
/*
  Keywords are most common in CSS, most of the properties have their own
  setting of recognized keywords.
*/
  keyword: function(keywords) {
    var storage;
    for (var i = 0, keyword; keyword = keywords[i++];) storage[keyword] = 1;
    return function(keyword) {
      return storage[keyword] ? keyword : false;
    }
  },
/*
  The only place in CSS that accepts multiple strings, is the `font-family`
  property and values are not really validated there.
*/
  strings: function(obj) {
    return obj.indexOf ? obj : false;
  },
/*
  Position is a limited set of keywords that proeprties like
  `background-position` can deal with.
*/
  position: function(obj) {
    return LSD.Styles.positions[obj] ? obj : false
  },
/*
  A number with a percent sign is parsed as a length, but most of the
  properties dont accept percentages, e.g. `border-left-width` so we have to
  separate percentage from other lengths
*/
  percentage: function(obj) {
    return obj.unit == '%' ? LSD.Styles.Type.length(obj, '%') : false
  }
};
/*
  Property types above are simple, so values parsed and converted to objects
  dont have additional methods or capabilities. The following types create
  an object with its own prototype and methods.
  
  Color may be defined in a variety of ways in CSS: `rgb`, `rgba`, `hsb`
  functions and hex notation. Parsed color is an object that has some
  conversion and convenience methods.
*/
LSD.Styles.Type.color = function(obj, type) {
  if (this === LSD.Styles.Type) {
    if (obj.match) {
      if (obj == 'transparent') {
        return new this.color([0, 0, 0, 0])
      } else {
        return obj.match(LSD.Styles.rHex) ? new this.color(obj, 'hex') : false;
      }
    }
    else if (obj.push || obj.rgb || obj.rgba)
      var values = obj.push ? obj : obj.rgb || obj.rgba;
    else if (obj.hsb || obj.hsba) {
      var values = obj.hsb || obj.hsba;
      if (!type) type = 'hsb';
    }
    if (values) {
      var alpha = values[3];
      if (alpha != null && alpha.unit == '%') {
        values = values.slice(0)
        values[3] = alpha.number / 100;
      }
      return new this.color(values, type);
    }
  } else {
    Color.call(this, obj, type);
  }
  return false;
};
/*
  Most browsers normalize colors internally by converting them to a consistent
  `rgb()` function representation and falling back to `rgba` when alpha channel
  is not equal to 1. LSD color tries to keep values readable, so it uses hex
  wherever possible.
*/
LSD.Styles.Type.color.prototype = {
  toString: function() {
    if (this.alpha == 1) return this.toHEX();
    if (this.alpha == 0) return 'transparent';
    return this.toRGB();
  }
};
!function(proto) {
  for (var method in proto)
    if (!LSD.Styles.Type.color.prototype[method])
      LSD.Styles.Type.color.prototype[method] = proto[method];
}(Color.prototype);
/*
  Length is a combination of a number and a unit. Browsers dont treat regular
  numbers like lengths, except for IE where it defaults to pixels. For easier
  length manipulations, LSD recognizes number as a length, with the pixel as a
  default unit.
*/
LSD.Styles.Type.length = function(obj, unit) {
  if (this === LSD.Styles.Type) {
    if (typeof obj == 'number')
      return new this.length(obj, unit);
    if ((typeof obj.number != 'undefined') && (unit || obj.unit != '%'))
      return new this.length(obj, unit);
    return false;
  } else {
    this.number = (typeof obj == 'number') ? obj : obj.number;
    this.unit = unit || obj.unit;
  }
};
LSD.Styles.Type.length.prototype = {
  toString: function() {
    return this.number + (this.unit || 'px');
  },
  valueOf: function() {
    return this.number;
  }
};
/*
  `url()` is a special CSS function that allows its arguments not have quotes,
  unlike all other functions. There're other functions like `src()` that share
  that behavior.
*/
LSD.Styles.Type.url = function(obj) {
  if (this === LSD.Styles.Type) {
    if (obj.url) return new this.url(obj);
    return false;
  } else {
    this.url = obj.url || obj;
  }
};
LSD.Styles.Type.url.prototype = {
  toString: function() {
    return 'url(' + this.url + ')';
  },
  valueOf: function() {
    return this.url;
  }
};

LSD.Styles.positions = {left: 1, top: 1, bottom: 1, right: 1, center: 1};
LSD.Styles.rHex = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/;


/*
  Property is a function that accepts number of arguments and returns either
  parsed sub-properties and values, or false if arguments dont match the
  property definition. Definitions for properties are specified in a format
  similar to CSS specs, so this function prepares an efficient index that can
  quickly check if arguments are good or not.

   Properties functions may be both used as constructors or as generic
  validation methods, although if input is valid there will be a new object
  constructed regardless of used syntax.
*/
LSD.Styles.Property = function(definition, context, type) {
  var properties, keywords, types;
  for (var i = 0, bit; bit = definition[i++];) {
    if (bit.push) properties = bit;
    else if (bit.indexOf) {
      if (!LSD.Styles.Type[bit]) {
        if (!keywords) keywords = {};
        switch (bit) {
          case 'collection':
            type = 'collection';
            break;
          case 'multiple':
            var multiple = true;
          default:
            keywords[bit] = 1;
        }
      } else types ? types.push(bit) : (types = [bit]);
    } else options = bit;
  }
  if (!type) type = properties ? 'shorthand' : 'simple';
  var property = LSD.Styles.Property[type](properties || types, keywords, context, multiple);
  if (keywords) property.keywords = keywords;
  if (properties) {
    var props = [];
    for (var i = 0, prop; prop = properties[i++];) prop.push ? props.push.apply(props, prop) : props.push(prop);
    property.properties = props;
  }
  property.type = type;
  return property;
};

/*
  Matches simple value against possible types. It only returns a single value.
*/

LSD.Styles.Property.simple = function(types, keywords) {
  return function(value) {
    if (keywords && keywords[value]) return value;
    if (types) for (var i = 0, type, parsed; type = types[i++];) {
      parsed = LSD.Styles.Type[type](value);
      if (parsed !== false) return parsed;
    }
    return false;
  }
};

/*
  Links list of inambigous arguments with corresponding properties keeping
  the order. It returns an object with properties as keys (in order of
  appearance) and parsed values. It returns false if it was given a
  value it could not recognize, such as an unknown keyword.
*/

LSD.Styles.Property.shorthand = function(properties, keywords, context, multiple) {
  var index, r = 0;
  for (var i = 0, property; property = properties[i++];) if (!property.push) r++;
  return function shorthand () {
    var resolved = [], values = [], used = {}, args = arguments;
    var argument = args[0], start = 0, group, k = 0, l = args.length;
    for (var m = 0;; m++) {
      // handle multiple values
      if (argument.push && ((args = arguments[m]) != null)) {
        if (!args.push) args = [args];
        l = args.length;
        if (m > 0) {
          if (m == 1) result = [result];
          result.push(shorthand.apply(this.push ? [] : {}, args));
          continue;
        }
      }
      if (m > 0) return result;
      // handle on set of values
      for (var i = 0, arg; i < l; i++) {
        arg = (i > 0) ? args[i] : argument;
        var property = properties[k];
        if (!property) return false;
        if ((group = (property.push && property))) property = properties[k + 1];
        if (property) {
          if ((values[i] = context[property](arg)) !== false) k++
          else property = false
        }
        if (group) {
          if (!property) {
            if (!index) index = LSD.Styles.Property.index(properties, context)
            if ((property = index[k][arg])) {
              if (used[property]) return false;
              else used[property] = true;
              values[i] = arg;
            }
          }
          if ((property && !used[property]) || (i == l - 1)) {
            if (i - start > group.length) return false;
            for (var j = start, end = (i + +!property); j < end; j++)
              if (!resolved[j])
                for (var n = 0, optional; optional = group[n++];)
                  if (!used[optional])
                    if ((values[j] = context[optional](args[j])) !== false) {
                      resolved[j] = optional;
                      used[optional] = true
                      break;
                    }
            start = i;
            k++;
          }
        }
        if (resolved[i] == null) {
          resolved[i] = property;
          if (values[i] == false) values[i] = arg;
        }
      }
      if (i < r) return false;
      if (!result) var result = this == window || this.$root ? {} : this;
      for (var i = 0; i < l; i++) {
        var property = resolved[i];
        if (!property) return false;
        var value = values[i];
        if (value === false) return false;
        if (result.push) result.push(value);
        else result[property] = value;
      }
    }
    return result;
  };
}

/*
  A shorthand that operates on collection of properties. When given values
  are not enough (less than properties in collection), the value sequence
  is repeated until all properties are filled.
*/

LSD.Styles.Property.collection = function(properties, keywords, context) {
  var first = context[properties[0]];
  if (first.type != 'simple')
    return function(arg) {
      var args = (!arg || !arg.push) ? [Array.prototype.slice.call(arguments)] : arguments;
      var result = this == window || this.$root ? {} : this;
      for (var i = 0, property; property = properties[i]; i++) {
        var value = context[property].apply(result.push ? [] : result, args[i] || args[i % 2] || args[0]);
        if (value === false) return false;
        if (result.push) result.push(value);
      }
      return result;
    }
  else
    return function() {
      var result = this == window || this.$root ? {} : this;
      for (var i = 0, property; property = properties[i]; i++) {
        var value = arguments[i] || arguments[i % 2] || arguments[0];
        value = context[property].call(result, value);
        if (value === false) return false;
        if (result.push) result.push(value);
        else result[property] = value;
      }
      return result;
    }
};

/*
  Finds optional groups in expressions and builds keyword indecies for them.
  Keyword index is an object that has keywords as keys and values as property
  names.

   Index only holds keywords that can be uniquely identified as one of the
  properties in group.
*/

LSD.Styles.Property.index = function(properties, context) {
  var index = {};
  for (var i = 0, property; property = properties[i]; i++) {
    if (property.push) {
      var group = index[i] = {};
      for (var j = 0, prop; prop = property[j]; j++) {
        var keys = context[prop].keywords;
        if (keys) for (var key in keys) {
          if (group[key] == null) group[key] = prop;
          else group[key] = false;
        }
      }
      for (var keyword in group) if (!group[keyword]) delete group[keyword];
    }
  }
  return index;
};

LSD.Struct.implement({
  background:           [[['backgroundColor', 'backgroundImage', 'backgroundRepeat',
                          'backgroundAttachment', 'backgroundPositionX', 'backgroundPositionY']], 'multiple'],
  backgroundColor:      ['color', 'transparent', 'inherit'],
  backgroundImage:      ['url', 'none', 'inherit'],
  backgroundRepeat:     ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'inherit', 'space', 'round'],
  backgroundAttachment: ['fixed', 'scroll', 'inherit', 'local', 'fixed'],
  backgroundPosition:   [['backgroundPositionX', 'backgroundPositionY']],
  backgroundPositionX:  ['percentage', 'center', 'left', 'right', 'length', 'inherit'],
  backgroundPositionY:  ['percentage', 'center', 'top', 'bottom', 'length', 'inherit'],

  textShadow:           [['textShadowBlur', 'textShadowOffsetX', 'textShadowOffsetY', 'textShadowColor'], 'multiple', 'virtual'],
  textShadowBlur:       ['length'],
  textShadowOffsetX:    ['length'],
  textShadowOffsetY:    ['length'],
  textShadowColor:      ['color'],

  boxShadow:            [['boxShadowBlur', 'boxShadowOffsetX', 'boxShadowOffsetY', 'boxShadowColor'], 'multiple', 'virtual'],
  boxShadowBlur:        ['length'],
  boxShadowOffsetX:     ['length'],
  boxShadowOffsetY:     ['length'],
  boxShadowColor:       ['color'],

  outline:              ['outlineWidth', 'outlineStyle', 'outlineColor'],
  outlineWidth:         ['length'],
  outlineStyle:         ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'],
  outlineColor:         ['color'],

  font:                 [[['fontStyle', 'fontVariant', 'fontWeight'], 'fontSize', ['lineHeight'], 'fontFamily']],
  fontStyle:            ['normal', 'italic', 'oblique', 'inherit'],
  fontVariant:          ['normal', 'small-caps', 'inherit'],
  fontWeight:           ['normal', 'number', 'bold', 'inherit'],
  fontFamily:           ['strings', 'inherit'],
  fontSize:             ['length', 'percentage', 'inherit',
                         'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'],

  color:                ['color'],
  letterSpacing:        ['normal', 'length', 'inherit'],
  textDecoration:       ['none', 'capitalize', 'uppercase', 'lowercase'],
  textAlign:            ['left', 'right', 'center', 'justify'],
  textIdent:            ['length', 'percentage'],
  lineHeight:           ['normal', 'number', 'length', 'percentage'],

  listStyle:            [['list-style-type', 'list-style-position', 'list-style-image']],
  listStyleType:        ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman',
                         'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'none',
                         'upper-alpha', 'inherit'],
  listStyleImage:       ['url', 'none', 'inherit'],
  listStylePosition:    ['inside', 'outside', 'none'],

  height:               ['length', 'auto'],
  maxHeight:            ['length', 'auto'],
  minHeight:            ['length', 'auto'],
  width:                ['length', 'auto'],
  maxWidth:             ['length', 'auto'],
  minWidth:             ['length', 'auto'],

  display:              ['inline', 'block', 'list-item', 'run-in', 'inline-block', 'table', 'inline-table', 'none',
                         'table-row-group', 'table-header-group', 'table-footer-group', 'table-row',
                         'table-column-group', 'table-column', 'table-cell', 'table-caption'],
  visibility:           ['visible', 'hidden'],
  'float':              ['none', 'left', 'right'],
  clear:                ['none', 'left', 'right', 'both', 'inherit'],
  overflow:             ['visible', 'hidden', 'scroll', 'auto'],
  position:             ['static', 'relative', 'absolute', 'fixed'],
  top:                  ['length', 'auto'],
  left:                 ['length', 'auto'],
  right:                ['length', 'auto'],
  bottom:               ['length', 'auto'],
  zIndex:               ['integer'],
  cursor:               ['auto', 'crosshair', 'default', 'hand', 'move', 'e-resize', 'ne-resize', 'nw-resize',
                         'n-resize', 'se-resize', 'sw-resize', 's-resize', 'w-resize', 'text', 'wait', 'help']
}, LSD.Document.prototype.styles || (LSD.Document.prototype.styles = {}));

(function(Styles, CSS) {
  Styles.$root = true;
  var expanded = ['borderWidth', 'borderColor', 'borderStyle', 'padding', 'margin', 'border'];
  for (var side, sides = ['Top', 'Right', 'Bottom', 'Left'], i = 0; side = sides[i++];) {
    CSS['border' + side]           = [['border' + side + 'Width', 'border' + side + 'Style', 'border' + side + 'Color']];
    CSS['border' + side + 'Width'] = ['length', 'thin', 'thick', 'medium'];
    CSS['border' + side + 'Style'] = ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'inherit', 'none'];
    CSS['border' + side + 'Color'] = ['color'];
    CSS['margin' + side]           = ['length', 'percentage', 'auto'];
    CSS['padding' + side]          = ['length', 'percentage', 'auto'];
    for (var j = 0, prop; prop = expanded[j++];) {
      if (!CSS[prop]) CSS[prop] = [[]];
      CSS[prop][0].push(prop.replace(/^([a-z]*)/, '$1' + side));
      if (i == 4) CSS[prop].push('collection')
    }
    if (i % 2 == 0)
      for (var j = 1, adj; adj = sides[j+=2];)
        CSS['borderRadius' + side + adj] = ['length', 'none'];
  };
  for (var property in CSS) {
    var style = Styles[property] = LSD.Styles.Property(CSS[property], Styles);
    var hyphenated = property.replace(/(^|[a-z])([A-Z])/g, function(m, a, b) {
      return a + '-' + b.toLowerCase();
    });
    style.property = property;
    style.hyphenated = hyphenated;
    Styles[hyphenated] = Styles[property];
  }
  Styles.cssFloat = Styles.styleFloat = Styles['float'];
})(LSD.Styles, LSD.Document.prototype.styles);

/*
  A parser that handles CSS values. Refer to specs for comprehensive
  demonstration of features.
*/

LSD.Styles.Parser = new LSD.RegExp({
  url_fn:     'url|local|src',
  url_src:    '.*?',
  url:        '(<url_fn>)\\((<url_src>)\\)',
              
  fn_args:    '<inside_parens>*',
  fn_name:    '[-_a-zA-Z0-9]*',
  fn:         '(<fn_name>)\\s*\\((<fn_args>)\\)',
              
  integer:    '[-+]?\\d+',
  'float':    '[-+]?\\d+\\.\\d*|\\d*\\.\\d+',
  length:     '(<integer>|<float>)(em|px|pt|%|fr|deg|(?=$|[^a-zA-Z0-9.]))',
  operator:   '([-+]|[\\/%^~=><*\\^!|&]+)',
  delimeters: ',|\\s',
  separator:  '\\s*(<delimeters>)\\s*',
              
  string:     '<string>',
  token:      '([^$,\\s\\/()]+)'
}, {
  fn: function(name, args) {
    var parsed = args == null ? [] : this.exec(args, undefined, true)
    switch (name) {
      case '+': case '-':
        if (isFinite(parsed)) {
          return name === '-' ? - parsed : parsed;
        } else {
          this.stack.push(name);
          return parsed;
        }
        break;
      default:
        if (!name) return parsed;
        var obj = {};
        obj[name] = parsed;
        return obj;
    }
  },
  length: function(number, unit) {
    var num = parseFloat(number);
    if (this.meta && this.stack.length) {
      var chr = number.charAt(0)
      switch (chr) {
        case '+': case '-':
          var last = this.stack[this.stack.length - 1];
          if (!last || !last.match) {
            this.stack.push(chr);
            if (chr === '-') num = - num;
          }
      };
    }
    return unit ? {number: num, unit: unit} : num;
  },
  /*
    Url is an specific case of a function that does not require its argument
    be escaped with quotes.
  */
  url: function(type, path) {
    var obj = {};
    var first = path.charAt(0), length = path.length;
    if (first == path.charAt(length - 1) && (first == '"' || first == "'"))
      path = path.substring(1, length - 1);
    obj[type] = path
    return obj;
  },
  /*
    Values may constitute a list when separated with whitespaces or commas.
    Either way makes an array of values. A whitespace separated value inside
    of a comma separated value makes a nested array.
  */
  separator: function(character) {
    switch (character) {
      case ',':
        if (this.result[0] && !this.result[0].push) this.result = [this.result];
        this.result.push(this.stack = []);
        break;
      default:
        if (this.meta || this.stack !== this.result) return;
        var stack = this.stack, length = stack.length, last = stack[length - 1]
        if (last.push) this.stack = this.stack[length - 1] = [last];
    }
  },
  string: true,
  token: true,
  operator: true
}, true);