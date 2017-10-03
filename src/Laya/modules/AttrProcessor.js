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
				var replaceSettings = util.extractJSONFromAttribute(el, "data-settings");

				/*merging settings*/
				if (replaceSettings){
					userData = this.laya.util.mergeSettings(replaceSettings, userData);
				}

				/*reaching value*/
				var valueData = this.laya.reachValueData(value, userData);
				var value = valueData.value;

				if (!value){
					//console.warn("Laya: attr-processor: cannot replace node", value, el);
					return;
				}

				util.copyAttrs(el, value, ["data-replace", "data-settings"]);

				if (!value.attr("data-content-holder")){
					util.copyInnerContent(el, value);
					
				}


				if (value.hasAttribute("data-content-holder")){
					var contentHolder = value.select(value.getAttribute("data-content-holder"))[0];

					if (contentHolder){
						contentHolder.innerHTML = el.innerHTML;
						el.innerHTML = "";
					}

				}

				value = this.laya.process(value, userData);

				el.parentNode.replaceChild(value, el);
			},
			"data-on:*" : function(el, value, name, userData){
				var eventName = name.replace("data-on:", "");
				var valueData;

				if (value == "script"){
					value = this.laya.util.extractCallbackFromScriptElement(el.selectByAttr("data-callback-script", name).first, el);
					if (!value){
						return;
					} else {
						value = value.bind(el, this.laya._scriptExtensions, this.laya.scriptGlobal);
					}
				} else {
					valueData = this.laya.reachValueData(value, userData);
					value = valueData.value;
				}
				
				el.setCommand(eventName, value);

				el.on({
					eventName : eventName,
					callback : value,
				});

			},
			"data-on:clickoutside" : function(el, value, name, userData){
				var valueData;

				value = this.laya.pickValue(value, userData);

				if (value == "script"){
					value = this.laya.util.extractCallbackFromScriptElement(el.selectByAttr("data-callback-script", "data-on:clickoutside").first, el);
					if (!value){
						return;
					} else {
						value = value.bind(el, this.laya._scriptExtensions, this.laya.scriptGlobal);
					}
				} else {
					valueData = this.laya.reachValueData(value, userData);
					value = valueData.value;
				}

				if (!value){
					//this.laya.console.warn("Laya: attr-processor: data-on:clickoutside - no callback provided", arguments);
					return;
				}

				el.setCommand("clickoutside", value);

				document.on({
					eventName : "mousedown",
					callback : function(evt){
						if (!this.laya.util.isDescedant(el, evt.srcElement)){
							value(evt);
						}
					}.bind(this)
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
			},
			"data-element-script" : function(el, value, name, userData){
				var callback = this.laya.util.extractCallbackFromScriptElement(el, el.parentNode)
				callback.call(el.parentNode, this.laya._scriptExtensions, this.laya.scriptGlobal);
			},
			"data-command:*" : function(el, value, name, userData){
				var valueData = this.laya.reachValueData(value, userData);
				var callback = valueData.value;

				if (!callback){
					this.laya.console.warn("cannot set command", arguments);
				}

				el.setCommand(name.split("data-command:")[1], callback);
			},
			"data-items-list-settings" : function(el, value, name, userData){
				var valueData = this.laya.reachValueData(value, userData);
				var listSettings = valueData.value;

				for (var a = 0; a < listSettings.length; a++){
					el.addItem(this.laya.util.mergeSettings(userData, listSettings[a]));
				}

			},
		},
	};

	util.inheritClass(Processor, AttrProcessor);

	return AttrProcessor;

});
