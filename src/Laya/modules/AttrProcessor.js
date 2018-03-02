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
			"data-attributes" : function(el, value, name, userData){
				var valueData = this.laya.reachValueData(value, userData);

				this.laya.util.loopList(valueData.value, function(value, key){
					el.setAttribute(["data", key].join("-"), value);
				}, this);
			},
			"data-laya-async-script" : function(el, value, name, userData){
				var newScript = document.createElement("script");
				
				this.laya.util.loopArray(el.attributes, function(attr, index){
					newScript.attr(attr.name, attr.value);
				});

				if (el.parentNode){
					el.parentNode.replaceChild(newScript, el);
				}
			},
			"src" : function(el, value, name, userData){
				if (el.tagName == "IMG"){
					var valueData = this.laya.reachValueData(value, userData);

					el.classes.add("_image");
					if (valueData.value){

						var url = valueData.value;


						if (this.laya.config.resBaseURL && this.laya.config.resBaseURL.length){
							url = this.laya.util.resolveURL(this.laya.config.resBaseURL, url);
						}

						var isSVG = url.indexOf(".svg") > -1;
						var planeSVG = this.laya.config.onlyPlaneSVG || el.hasAttribute("data-plane-svg") || el.classes.contains("_plane-svg");

						
						if (isSVG && !planeSVG) {
							el.src = url;
							this.laya.util.processSVG(el);
							el.attr("data-svg-image", "");
						} else {
							el.classes.add("__image-loading")
							el.onload = function(){
								el.classes.remove("__image-loading")
							}
							el.src = url;
						}
						
					}
				}
				
			},
			"data-behaviour-patterns" : function(el, value, name, userData){
				var patternNames = value.split(" ");

				util.loopArray(patternNames, function(name, index){
					var patternFabric = this.laya._bPatters[name];

					if (patternFabric){
						patternFabric.call(el, this.laya._scriptExtensions, this.laya.scriptGlobal, userData);
					}
				}, this);

			},
			"data-placeholder" : function(el, value, name, userData){
				var valueData = this.laya.reachValueData(value, userData);

				el.attr("placeholder", valueData.value);

				if (valueData.linked){
					this.laya.base.on(valueData.linked, "change", function(value){
						el.attr("placeholder", value);
					}, true);
				}

				// value = this.laya.reachValueData(value, userData);

				// console.log(el, value, name, userData);
			},
			"data-replace" : function(el, value, name, userData){
				var replaceSettings = util.extractJSONFromAttribute(el, "data-settings");

				/*merging settings*/
				if (replaceSettings){
					if (replaceSettings.important){
						userData = this.laya.util.mergeSettings(userData, replaceSettings);
					} else {
						userData = this.laya.util.mergeSettings(replaceSettings, userData);
					}

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
					var contentHolder = value.select(value.getAttribute("data-content-holder"), true).first;

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
					value = this.laya.util.extractCallbackFromScriptElement(el.selectByAttr("data-callback-script", name, true).first, el);
					if (!value){
						return;
					} else {
						value = value.bind(el, this.laya._scriptExtensions, this.laya.scriptGlobal, userData);
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
					value = this.laya.util.extractCallbackFromScriptElement(el.selectByAttr("data-callback-script", "data-on:clickoutside", true).first, el);
					if (!value){
						return;
					} else {
						value = value.bind(el, this.laya._scriptExtensions, this.laya.scriptGlobal, userData);
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

				var outsideRootElement = this.laya.outsideRootElement;

				outsideRootElement.on({
					eventName : "mousedown",
					callback : function(evt){
						if (!this.laya.util.isDescedant(el, evt.target)){
							value(evt);
						}
					}.bind(this)
				});

			},
			// "data-on:click" : function(){
				
			// },
			"data-value-linked" : function(el, path){
				el.on({
					eventName : "input",
					callback : function(){
						var value = el.value;
						this.laya.base.set(path, value);
					}.bind(this)
				});
			},
			"data-element-script" : function(el, value, name, userData){
				var callback = this.laya.util.extractCallbackFromScriptElement(el, el.parentNode)
				callback.call(el.parentNode, this.laya._scriptExtensions, this.laya.scriptGlobal, userData);
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
		deffered : ["data-behaviour-patterns"]
	};

	util.inheritClass(Processor, AttrProcessor);

	return AttrProcessor;

});
