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
				if (this.laya.wrappers[value]){
					this.laya.wrappers[value](el);
				} else {
					console.warn("Laya: no wrapper specified:", value, el);
				}
			},
			"data-replace" : function(el, value, name, userData){
				if (value instanceof Node){
					el.setAttribute("data-replace", "");
					util.copyAttrs(el, value);
					value = this.laya.process(value, userData);
					el.parentNode.replaceChild(value, el);
				}
			},
			"data-on:*" : function(el, value, name){
				var eventName = name.replace("data-on:", "");
				el.on({
					eventName : eventName,
					callback : value,
				});
			},
			"data-on:clickoutside" : function(el, value, name){
				if (typeof value != "function"){
						console.warn("Laya: no callback specified", el, value, name);
						return;
				}

				document.on({
					eventName : "mousedown",
					callback : value
				});

				el.on({
					eventName : "mousedown",
					callback : function(evt){evt.stopPropagation()}
				})
			},
			"data-value-linked" : function(el, path){
				el.on({
					eventName : "input",
					callback : function(){
						var value = el.value;
						base.set(path, value);
					}
				});
			}
		},
	};

	util.extend(Processor, AttrProcessor);

	return AttrProcessor;

});
