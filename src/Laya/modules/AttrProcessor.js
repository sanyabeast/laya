"use strict";
define(function(){
	var AttributesProcessor = function(laya){
		this.laya = laya;
	};

	AttributesProcessor.prototype = {
		"data-type" : function(el, value){
			this.wrappers[value](el);
		},
		"data-replace" : function(el, value){
			el.parentNode.replaceChild(value, el);
		},
		"data-on-*" : function(el, value, name){
			var eventName = name.replace("data-on-", "");
			el.on({
				eventName : eventName,
				callback : value,
			});
		}
	};

	Object.defineProperty(AttributesProcessor.prototype, "getProcessorName", {
		value : function(name){
			var util = this.laya.util;
			var keys = util.keys(AttributesProcessor.prototype);

			for (var a = 0, l = keys.length, match; a < l; a++){
				match = name.match(new RegExp(keys[a]));
				if (match) return keys[a];
			}

		}
	})

	return AttributesProcessor;

});
