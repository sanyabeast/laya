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

				/*merging settings*/
				if (replaceSettings){
					userData = this.laya.util.mergeSettings(replaceSettings, userData);
				}

				/*reaching value*/
				var type = this.laya.typeof(value);

				do {
					value = this.laya.pickValue(value, userData);
					type = this.laya.typeof(value);
				} while (this.laya.commands.indexOf(type) > -1)


				if (!value){
					console.warn("Laya: attr-processor: cannot replace node", value, el);
					return;
				}

				util.copyAttrs(el, value, ["data-replace", "data-settings"]);

				if (value.hasAttribute("data-content-holder")){
					var contentHolder = value.select(value.getAttribute("data-content-holder"))[0];

					if (contentHolder){
						contentHolder.innerHTML = el.innerHTML;
						el.innerHTML = "";
					}

				}

				//util.copyInnerContent(el, value);

				value = this.laya.process(value, userData);

				el.parentNode.replaceChild(value, el);
			},
			"data-on:*" : function(el, value, name, userData){
				var eventName = name.replace("data-on:", "");

				if (value == "script"){
					var scriptNode = el.select("script[data-callback-script='" + name +  "']")[0];

					if (!scriptNode){
						this.laya.warn("Laya: attr-processor: data-on:* - no callback script", el, value, name);
					}

					var script = scriptNode.innerText;

					value = function(){
						this.laya.util.evalInContext(script, el);
					}.bind(this)

				} else {
					while (this.laya.typeof(value) != null){
						value = this.laya.pickValue(value, userData);
					}
				}
				
				el.setCommand(eventName, value);

				el.on({
					eventName : eventName,
					callback : value,
				});

			},
			"data-on:clickoutside" : function(el, value, name, userData){
				value = this.laya.pickValue(value, userData);

				if (typeof value == "function"){
						value = value;
				} else if (typeof value == "string" && value == "script"){
						var scriptNode = el.select("script[data-callback-script='data-on:clickoutside']")[0];
						var script = scriptNode.innerText;

						value = function(){
							this.laya.util.evalInContext(script, el)
						}.bind(this);
				}

				if (!value){
					this.laya.console.warn("Laya: attr-processor: data-on:clickoutside - no callback provided", arguments);
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
				var script = el.innerText;
				var context = el.parentNode;

				if (context){
					this.laya.util.evalInContext(script, context);
				}
			},
			"data-command:*" : function(el, value, name, userData){
				var callback = value;

				while (this.laya.typeof(callback) != null){
					callback = this.laya.pickValue(callback, userData)
				}

				el.setCommand(name.split("data-command:")[1], callback);
			},
			"data-items-list-settings" : function(el, value, name, userData){
				var listSettings = value;

				while (this.laya.typeof(listSettings) != null){
					listSettings = this.laya.pickValue(listSettings, userData);
				}

				for (var a = 0; a < listSettings.length; a++){
					el.addItem(this.laya.util.mergeSettings(userData, listSettings[a]));
				}

			}
		},
	};

	util.extend(Processor, AttrProcessor);

	return AttrProcessor;

});
