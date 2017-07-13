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
			"data-replace" : function(el, value, name, userData){
				var replaceSettings;

				if (el.hasAttribute("data-settings")){
					replaceSettings = el.getAttribute("data-settings");
					replaceSettings = window.JSON.parse(replaceSettings);
				}

				if (replaceSettings){
					var type = this.laya.typeof(value);

					do {
						value = this.laya.pickValue(value, [userData, replaceSettings]);
						type = this.laya.typeof(value);
					} while (this.laya.commands.indexOf(type) > -1)

				} else {
					var type = this.laya.typeof(value);

					do {
						value = this.laya.pickValue(value, userData);
						type = this.laya.typeof(value);
					} while (this.laya.commands.indexOf(type) > -1)
				}

				util.copyAttrs(el, value, ["data-replace", "data-settings"]);

				value = this.laya.process(value);

				el.parentNode.replaceChild(value, el);
			},
			"data-on:*" : function(el, value, name, userData){
				var eventName = name.replace("data-on:", "");
				value = this.laya.pickValue(value, userData);
				el.on({
					eventName : eventName,
					callback : value,
				});
			},
			"data-on:clickoutside" : function(el, value, name, userData){
				value = this.laya.pickValue(value, userData);

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
				});
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
