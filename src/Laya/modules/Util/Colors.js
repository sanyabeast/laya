"use strict";
define(function(){

	var Colors = function(){

	};

	Colors.prototype = {
		convert : {
			HSL2RGB : HSL2RGB,
			HEX2RGB : HEX2RGB,
			RGB2HEX : RGB2HEX
		},
		typeis : function(colorValue){
			switch(true){
				case (colorValue.match(/rgb/) != null):
					return "rgb";
				break;
				case (colorValue.match(/hsl/) != null):
					return "hsl";
				break;
				case (colorValue.match(/#/) && colorValue.match(/#/).index == 0):
					return "hex";
				break;
			}
		},	
		toRGBObject : function(colorValue){
			var type = this.typeis(colorValue);
			var data = this.toObject(colorValue, type);

			switch(type){
				case "rgb":
					return data;
				break;
				case "hsl":
					return this.convert.HSL2RGB(data);
				break;
				case "hex":
					return this.convert.HEX2RGB(data);
				break;
			}
		},
		toObject : function(color, type){
			switch(type){
				case "rgb":
					var match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

					return {
						r : Number(match[1]),
						g : Number(match[2]),
						b : Number(match[3]),
						a : Number(match[4]) || 1,
					}

				break;
				case "hsl":
					var match = color.match(/^hsla?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

					return {
						h : Number(match[1]),
						s : Number(match[2]),
						l : Number(match[3]),
						a : Number(match[4]) || 1,
					}
				break;
				case "hex":
					return {
						hex : color,
						alpha : 1
					}
				break;
			}
		},
		getColorsDelta : function(colorA, colorB){
			var ca = this.toRGBObject(colorA);
			var cb = this.toRGBObject(colorB);

			return (Math.abs(ca.r - cb.r) + Math.abs(ca.g - cb.g) + Math.abs(ca.b - cb.b) + Math.abs(ca.a - cb.a));

		},
		nearestColor : function(colorsColl, color){
			var result;
			var delta = false;
			var currentDelta = false;

			for (var k in colorsColl){
				var currentDelta = this.getColorsDelta(colorsColl[k], color);

				if (currentDelta == 0){
					continue;
				}

				if (delta === false || currentDelta < delta){
					delta = currentDelta;
					result = colorsColl[k];
				}
			}

			return {
				color : result,
				delta : delta
			};

		},
		// trimColorsObject : function(colors, minDelta){
		// 	var result = {};

		// 	for (var k in)

		// }
	};

	return Colors;

	function HSL2RGB (color) {
		var h = color.h;
		var s = color.s;
		var l = color.l;
		var a = color.a;


	    var r, g, b, m, c, x

	    if (!isFinite(h)) h = 0
	    if (!isFinite(s)) s = 0
	    if (!isFinite(l)) l = 0

	    h /= 60
	    if (h < 0) h = 6 - (-h % 6)
	    h %= 6

	    s = Math.max(0, Math.min(1, s / 100))
	    l = Math.max(0, Math.min(1, l / 100))

	    c = (1 - Math.abs((2 * l) - 1)) * s
	    x = c * (1 - Math.abs((h % 2) - 1))

	    if (h < 1) {
	        r = c
	        g = x
	        b = 0
	    } else if (h < 2) {
	        r = x
	        g = c
	        b = 0
	    } else if (h < 3) {
	        r = 0
	        g = c
	        b = x
	    } else if (h < 4) {
	        r = 0
	        g = x
	        b = c
	    } else if (h < 5) {
	        r = x
	        g = 0
	        b = c
	    } else {
	        r = c
	        g = 0
	        b = x
	    }

	    m = l - c / 2
	    r = Math.round((r + m) * 255)
	    g = Math.round((g + m) * 255)
	    b = Math.round((b + m) * 255)

	    return { r: r, g: g, b: b, a : a || 1 }

	}

	function HEX2RGB (color) {
		var hex = color.hex;
		var alpha = color.alpha;

	    var r = parseInt(hex.slice(1, 3), 16),
	        g = parseInt(hex.slice(3, 5), 16),
	        b = parseInt(hex.slice(5, 7), 16);

	    if (alpha) {
	    	return { r : r, g : g, b : b, a : alpha };
	    } else {
	        return { r : r, g : g, b : b, a : 1 };
	    }
	}

	function RGB2HEX(color) {
		var r = color.r;
		var g = color.g;
		var b = color.b;

	    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}


});