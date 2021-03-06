/*
---

script: Datalist.js

description: Add your widget have a real form value.

license: Public domain (http://unlicense.org).

requires:
  - LSD.Mixin

provides:
  - LSD.Mixin.Datalist

...
*/

LSD.Mixin.Datalist = new Class({
  options: {
    actions: {
      datalist: {
        enable: function() {
          if (this.hasRemoteList()) this.attributes.set('href', this.attributes.list);
          this.attributes.set('autocomplete', 'off');
        },
        disable: function() {
          if (this.hasRemoteList()) this.attributes.unset('href', this.attributes.list);
          this.attributes.unset('autocomplete', 'off');
        }
      }
    },
    events: {
      _datalist: {
        element: {
          'input:pause': 'findSuggestions',
          'mousedown': 'unsetSuggestion'
        },
        request: {
          success: 'onSuccess'
        }
      },
      self: {
        blur: 'unsuggest',
        focus: 'findSuggestions'
      }
    },
    shortcuts: {
      up: 'suggestPrevious',
      down: 'suggestNext',
      enter: 'suggestSelected',
      left: 'findSuggestions',
      right: 'findSuggestions'
    },
    request: {
      type: 'xhr'
    },
    datalist: {
      max: 10
    }
  },

  constructors: {
    datalist: function() {
      this.suggestionItems = []
      this.suggestionIndex = -1;
    }
  },

  suggestPrevious: function(e) {
    if (this.getSuggestionsList().parentNode == null) return;
    if (--this.suggestionIndex < 0) this.suggestionIndex = this.suggestionLength - 1;
    this.selectSuggestionItem(this.suggestionIndex);
    e.preventDefault();
  },

  suggestNext: function(e) {
    if (this.getSuggestionsList().parentNode == null) return;
    if (++this.suggestionIndex == this.suggestionLength) this.suggestionIndex = 0;
    this.selectSuggestionItem(this.suggestionIndex);
    e.preventDefault();
  },

  getCurrentValue: function(suggestion) {
    var position = this.element.getSelectedRange();
    var value = this.element.get('value');
    var start = value.lastIndexOf(',', position.start - 1) + 1;
    var end = value.indexOf(',', position.end);
    if (end === -1) end = value.length;
    while (value.charAt(start) == ' ') start++;
    if (suggestion === false && position.start != position.end)
      return value.substring(start, position.start) + value.substring(position.end + 1, end)
    else return value.substring(start, end);
  },

  setCurrentValue: function(text, suggestion) {
    var old = this.getCurrentValue();
    var position = this.element.getSelectedRange();
    var value = this.element.get('value');
    var start = value.lastIndexOf(',', position.start - 1) + 1;
    var end = value.indexOf(',', position.end);
    if (end === -1) end = value.length;
    if (start != 0) text = ' ' + text;
    this.setValue(value.substring(0, start) + text + value.substring(end, value.length));
    this.element.set('value', value.substring(0, start) + text + value.substring(end, value.length));
    if (suggestion != null)
      this.element.selectRange(suggestion === false ? position.start + text.length : position.start, start + text.length);
  },

  findSuggestions: function(event) {
    var input = this.getCurrentValue();
    var same = input === this.input;
    if (!input || same && this.getSuggestionsList().parentNode) return;
    this.input = input;
    this.regexp = new RegExp(this.value.trim().replace(/\s+/, '\\s'), 'i')
    if (this.hasRemoteList()) {
      if (this.suggestedResults && same) this.onSuccess(this.suggestedResults)
      else this.send();
    }
  },

  suggestSelected: function(e) {
    this.suggested = true;
    if (this.selectedSuggestion) {
      this.setCurrentValue(this.selectedSuggestion.get('text'), false);
      if (e) e.stop();
    }
    this.unsuggest();
  },

  unsetSuggestion: function() {
    if (!this.suggested) return;
    this.suggested = false;
    this.setCurrentValue(this.getCurrentValue(false));
  },

  suggest: function(text) {
    var input = this.getCurrentValue();
    if (input != text) this.setCurrentValue(text, true);
  },

  unsuggest: function() {
    var range = this.element.getSelectedRange();
    if (range.start != range.end) this.unsetSuggestion();
    this.getSuggestionsList().dispose();
    if (this.selectedSuggestion) this.selectedSuggestion.removeClass('selected');
    this.selectedSuggestion = null;
    this.suggestionLength = 0;
    this.suggestionIndex = -1;
  },

  renderSuggestions: function(results) {
    var list = this.getSuggestionsList();
    var n = results && results.length || 0
    if (n) {
      this.suggestionLength = 0;
      for (var i = 0, j = this.options.datalist.max; i < j; i++) {
        if (i < n) {
          var item = this.getSuggestionItem(i).set('html', this.highlight(results[i]));
          if (!item.parentNode) item.inject(list);
        } else {
          var item = this.suggestionItems[i];
          if (item && item.parentNode) item.dispose();
          else break;
        }
        this.suggestionLength++;
      }
      if (!list.parentNode) list.inject(this.element, 'after');
    } else {
      if (list.parentNode) list.setStyle('display', 'none');
    }
  },

  highlight: function(result) {
    return result.replace(this.regexp, this.emphasize)
  },

  emphasize: function(value) {
    return '<strong>' + value + '</strong>';
  },

  selectSuggestionItem: function(i) {
    if (this.selectedSuggestion) this.selectedSuggestion.removeClass('selected');
    var item = this.getSuggestionItem(i);
    if (item) {
      this.selectedSuggestion = item.addClass('selected');
      this.setCurrentValue(item.get('text'), true);
    }
  },

  getSuggestionItem: function(i) {
    if (!this.suggestionItems[i]) this.suggestionItems[i] = new Element('li');
    return this.suggestionItems[i];
  },

  getSuggestionsList: function() {
    if (!this.suggestions) this.suggestions = new Element('ul', {'class': 'suggestions'}).addEvents({
      'mousedown:relay(li)': this.selectClickedSuggestion.bind(this),
      'mouseover:relay(li)': this.selectHoveredSuggestion.bind(this)
    });
    return this.suggestions;
  },

  getRequestData: function() {
    return {q: this.input}
  },

  selectClickedSuggestion: function(e, element) {
    if (this.selectedSuggestion) this.selectedSuggestion.removeClass('selected');
    this.setCurrentValue(element.get('text'), false);
  },

  selectHoveredSuggestion: function(e, element) {
    this.selectSuggestionItem(Array.prototype.slice.call(element.parentNode.childNodes).indexOf(element))
  },

  onSuccess: function(results) {
    this.suggestedResults = results;
    if (!results.push) {
      for (var i in results) {
        results = results[i];
        break;
      }
    };
    var text = results && results[0];
    if (text && (results && results[1] != null || this.getCurrentValue() != text)) {
      this.renderSuggestions(results);
    } else this.unsuggest()
  },

  hasRemoteList: function() {
    return this.attributes.list && this.attributes.list.indexOf('/') > -1
  }
});

Element.implement({

  getSelectedRange: function() {
    if (!Browser.Engine.trident) return {start: this.selectionStart, end: this.selectionEnd};
    var pos = {start: 0, end: 0};
    var range = this.getDocument().selection.createRange();
    if (!range || range.parentElement() != this) return pos;
    var dup = range.duplicate();
    if (this.type == 'text') {
      pos.start = 0 - dup.moveStart('character', -100000);
      pos.end = pos.start + range.text.length;
    } else {
      var value = this.value;
      var offset = value.length - value.match(/[\n\r]*$/)[0].length;
      dup.moveToElementText(this);
      dup.setEndPoint('StartToEnd', range);
      pos.end = offset - dup.text.length;
      dup.setEndPoint('StartToStart', range);
      pos.start = offset - dup.text.length;
    }
    return pos;
  },

  selectRange: function(start, end) {
    if (Browser.Engine.trident) {
      var diff = this.value.substr(start, end - start).replace(/\r/g, '').length;
      start = this.value.substr(0, start).replace(/\r/g, '').length;
      var range = this.createTextRange();
      range.collapse(true);
      range.moveEnd('character', start + diff);
      range.moveStart('character', start);
      range.select();
    } else {
      this.focus();
      this.setSelectionRange(start, end);
    }
    return this;
  }

});

LSD.Behavior.define('[list]', LSD.Mixin.Datalist)
