"use strict";
define(function(){
	var AttributesProcessor = function(laya){
		this.laya = laya;
	};

	AttributesProcessor.prototype = {
		"data-type" : function(el, value){
			this.wrappers[value](el);
		}
	};

	return AttributesProcessor;

});