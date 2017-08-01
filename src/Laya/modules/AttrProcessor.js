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
						value = this.laya.pickValue(value, [userData || {}, replaceSettings]);
						type = this.laya.typeof(value);
					} while (this.laya.commands.indexOf(type) > -1)

				} else {
					var type = this.laya.typeof(value);

					do {
						value = this.laya.pickValue(value, userData);
						type = this.laya.typeof(value);
					} while (this.laya.commands.indexOf(type) > -1)
				}

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

				value = this.laya.process(value);

				el.parentNode.replaceChild(value, el);
			},
			"data-on:*" : function(el, value, name, userData){
				var eventName = name.replace("data-on:", "");

				if (value == "script"){
					var scriptNode = el.select("script[data-callback-script='" + name +  "']")[0];
					var script = scriptNode.innerText;

					value = function(){
						this.laya.util.evalInContext(script, el);
					}.bind(this)

				} else {
					value = this.laya.pickValue(value, userData);
				}

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

				document.on({
					eventName : "mousedown",
					callback : function(evt){
						console.log(evt);
						if (!this.laya.util.isAncestor(el, evt.srcElement)){
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
			}
		},
	};

	util.extend(Processor, AttrProcessor);

	return AttrProcessor;

});
