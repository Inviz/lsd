Event.Keys = {
	keyOf: function(code) {
		return Event.KeyNames[code];
	}
};



(function() {
	
	//borrowed from google closure
	
	Browser.Features.keydown = (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version == 525));
	
	Event.KeyNames = {
	  8: 'backspace',
	  9: 'tab',
	  13: 'enter',
	  16: 'shift',
	  17: 'control',
	  18: 'alt',
	  19: 'pause',
	  20: 'caps-lock',
	  27: 'esc',
	  32: 'space',
	  33: 'pg-up',
	  34: 'pg-down',
	  35: 'end',
	  36: 'home',
	  37: 'left',
	  38: 'up',
	  39: 'right',
	  40: 'down',
	  45: 'insert',
	  46: 'delete',
	  48: '0',
	  49: '1',
	  50: '2',
	  51: '3',
	  52: '4',
	  53: '5',
	  54: '6',
	  55: '7',
	  56: '8',
	  57: '9',
	  65: 'a',
	  66: 'b',
	  67: 'c',
	  68: 'd',
	  69: 'e',
	  70: 'f',
	  71: 'g',
	  72: 'h',
	  73: 'i',
	  74: 'j',
	  75: 'k',
	  76: 'l',
	  77: 'm',
	  78: 'n',
	  79: 'o',
	  80: 'p',
	  81: 'q',
	  82: 'r',
	  83: 's',
	  84: 't',
	  85: 'u',
	  86: 'v',
	  87: 'w',
	  88: 'x',
	  89: 'y',
	  90: 'z',
	  93: 'context',
	  107: 'num-plus',
	  109: 'num-minus',
	  112: 'f1',
	  113: 'f2',
	  114: 'f3',
	  115: 'f4',
	  116: 'f5',
	  117: 'f6',
	  118: 'f7',
	  119: 'f8',
	  120: 'f9',
	  121: 'f10',
	  122: 'f11',
	  123: 'f12',
	  187: 'equals',
	  188: ',',
	  190: '.',
	  191: '/',
	  220: '\\',
	  224: 'meta'
	};
	
	Event.Codes = {
	  MAC_ENTER: 3,
	  BACKSPACE: 8,
	  TAB: 9,
	  NUM_CENTER: 12,
	  ENTER: 13,
	  SHIFT: 16,
	  CTRL: 17,
	  ALT: 18,
	  PAUSE: 19,
	  CAPS_LOCK: 20,
	  ESC: 27,
	  SPACE: 32,
	  PAGE_UP: 33,     // also NUM_NORTH_EAST
	  PAGE_DOWN: 34,   // also NUM_SOUTH_EAST
	  END: 35,         // also NUM_SOUTH_WEST
	  HOME: 36,        // also NUM_NORTH_WEST
	  LEFT: 37,        // also NUM_WEST
	  UP: 38,          // also NUM_NORTH
	  RIGHT: 39,       // also NUM_EAST
	  DOWN: 40,        // also NUM_SOUTH
	  PRINT_SCREEN: 44,
	  INSERT: 45,      // also NUM_INSERT
	  DELETE: 46,      // also NUM_DELETE
	  ZERO: 48,
	  ONE: 49,
	  TWO: 50,
	  THREE: 51,
	  FOUR: 52,
	  FIVE: 53,
	  SIX: 54,
	  SEVEN: 55,
	  EIGHT: 56,
	  NINE: 57,
	  QUESTION_MARK: 63, // needs localization
	  A: 65,
	  B: 66,
	  C: 67,
	  D: 68,
	  E: 69,
	  F: 70,
	  G: 71,
	  H: 72,
	  I: 73,
	  J: 74,
	  K: 75,
	  L: 76,
	  M: 77,
	  N: 78,
	  O: 79,
	  P: 80,
	  Q: 81,
	  R: 82,
	  S: 83,
	  T: 84,
	  U: 85,
	  V: 86,
	  W: 87,
	  X: 88,
	  Y: 89,
	  Z: 90,
	  META: 91,
	  CONTEXT_MENU: 93,
	  NUM_ZERO: 96,
	  NUM_ONE: 97,
	  NUM_TWO: 98,
	  NUM_THREE: 99,
	  NUM_FOUR: 100,
	  NUM_FIVE: 101,
	  NUM_SIX: 102,
	  NUM_SEVEN: 103,
	  NUM_EIGHT: 104,
	  NUM_NINE: 105,
	  NUM_MULTIPLY: 106,
	  NUM_PLUS: 107,
	  NUM_MINUS: 109,
	  NUM_PERIOD: 110,
	  NUM_DIVISION: 111,
	  F1: 112,
	  F2: 113,
	  F3: 114,
	  F4: 115,
	  F5: 116,
	  F6: 117,
	  F7: 118,
	  F8: 119,
	  F9: 120,
	  F10: 121,
	  F11: 122,
	  F12: 123,
	  NUMLOCK: 144,
	  SEMICOLON: 186,            
	  DASH: 189,                 
	  EQUALS: 187,               
	  COMMA: 188,                
	  PERIOD: 190,               
	  SLASH: 191,                
	  APOSTROPHE: 192,           
	  SINGLE_QUOTE: 222,         
	  OPEN_SQUARE_BRACKET: 219,  
	  BACKSLASH: 220,            
	  CLOSE_SQUARE_BRACKET: 221, 
	  META_KEY: 224,
	  MAC_FF_META: 224, // Firefox (Gecko) fires this for the meta key instead of 91
	  WIN_IME: 229
	};
	
	Event.implement({
		isTextModifyingKeyEvent:	function(e) {
		  if (this.alt && this.control ||
		      this.meta ||
		      // Function keys don't generate text
		      this.code >= Event.Codes.F1 &&
		      this.code <= Event.Codes.F12) {
		    return false;
		  }
		
		  // The following keys are quite harmless, even in combination with
		  // CTRL, ALT or SHIFT.
		  switch (this.code) {
		    case Event.Codes.ALT:
		    case Event.Codes.SHIFT:
		    case Event.Codes.CTRL:
		    case Event.Codes.PAUSE:
		    case Event.Codes.CAPS_LOCK:
		    case Event.Codes.ESC:
		    case Event.Codes.PAGE_UP:
		    case Event.Codes.PAGE_DOWN:
		    case Event.Codes.HOME:
		    case Event.Codes.END:
		    case Event.Codes.LEFT:
		    case Event.Codes.RIGHT:
		    case Event.Codes.UP:
		    case Event.Codes.DOWN:
		    case Event.Codes.INSERT:
		    case Event.Codes.NUMLOCK:
		    case Event.Codes.CONTEXT_MENU:
		    case Event.Codes.PRINT_SCREEN:
		      return false;
		    default:
		      return true;
		  }
		},
		
		firesKeyPressEvent: function(held) {
			if (!Browser.Features.keydown) {
		    return true;
		  }

		  if (Browser.Platform.mac && this.alt) {
		    return Event.Codes.isCharacterKey(this.code);
		  }

		  // Alt but not AltGr which is represented as Alt+Ctrl.
		  if (this.alt && !this.control) {
		    return false;
		  }

		  // Saves Ctrl or Alt + key for IE7, which won't fire keypress.
		  if (Browser.Engine.trident &&
		      !this.shift &&
		      (held == Event.Codes.CTRL ||
		       held == Event.Codes.ALT)) {
		    return false;
		  }

		  // When Ctrl+<somekey> is held in IE, it only fires a keypress once, but it
		  // continues to fire keydown events as the event repeats.
		  if (Browser.Engine.trient && this.control && held == this.code) {
		    return false;
		  }

		  switch (this.code) {
		    case Event.Codes.ENTER:
		      return true;
		    case Event.Codes.ESC:
		      return !Browser.Engine.webkit;
		  }

		  return this.isCharacterKey();
		},
		
		isCharacterKey: function(code) {
		  if (this.code >= Event.Codes.ZERO &&
		      this.code <= Event.Codes.NINE) {
		    return true;
		  }

		  if (this.code >= Event.Codes.NUM_ZERO &&
		      this.code <= Event.Codes.NUM_MULTIPLY) {
		    return true;
		  }

		  if (this.code >= Event.Codes.A &&
		      this.code <= Event.Codes.Z) {
		    return true;
		  }

		  switch (this.code) {
		    case Event.Codes.SPACE:
		    case Event.Codes.QUESTION_MARK:
		    case Event.Codes.NUM_PLUS:
		    case Event.Codes.NUM_MINUS:
		    case Event.Codes.NUM_PERIOD:
		    case Event.Codes.NUM_DIVISION:
		    case Event.Codes.SEMICOLON:
		    case Event.Codes.DASH:
		    case Event.Codes.EQUALS:
		    case Event.Codes.COMMA:
		    case Event.Codes.PERIOD:
		    case Event.Codes.SLASH:
		    case Event.Codes.APOSTROPHE:
		    case Event.Codes.SINGLE_QUOTE:
		    case Event.Codes.OPEN_SQUARE_BRACKET:
		    case Event.Codes.BACKSLASH:
		    case Event.Codes.CLOSE_SQUARE_BRACKET:
		      return true;
		    default:
		      return false;
		  }
		}
	});
})();