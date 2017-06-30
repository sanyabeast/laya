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
		}
	};

	return AttributesProcessor;

});