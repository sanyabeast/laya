"use strict";
define([
		"./Super/Processor",
		"./Util"
], function(Processor, Util){

	var util = new Util();

	var AttrProcessor = function(laya){
		this.laya = laya;
	};

	AttrProcessor.prototype = {
		processors : {
			"data-type" : function(el, value){
				this.laya.wrappers[value](el);
			},
			"data-replace" : function(el, value){
				el.parentNode.replaceChild(value, el);
			},
			"data-on:*" : function(el, value, name){
				var eventName = name.replace("data-on:", "");
				el.on({
					eventName : eventName,
					callback : value,
				});
			}
		},
	};

	util.extend(Processor, AttrProcessor);

	return AttrProcessor;

});
