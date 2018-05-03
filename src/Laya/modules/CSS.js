"use strict";
define([
		"prefixfree"
	], function(prefixfree){

	var CSS = function(laya){
		this.laya = laya;
		this.template = null;
		this.settings = null;

		this.prevUpdateTime = 0;
		this.updateTimeoutID;

		this.update = this.update.bind(this);
	};

	CSS.prototype = {
		put : function(css){
			this.styleElement.innerText = css;
		},
		setup : function(css, settings){
			css = css.replace(/root_element/g, "{{@rootElement}}")
			css = css.replace(/resBaseURL/g, this.laya.config.resBaseURL || "");
			this.settings = settings;
			this.template = new this.laya.Template(css);

			var styleElement = document.createElement("style");
			styleElement.id = "laya-styles";
		  	styleElement.type = "text/css";

		  	this.styleElement = styleElement;

		 	var head = document.getElementsByTagName("head");

		 	if (head && head[0]){
		 		head[0].appendChild(styleElement);
		 	}

		 	this.update();
		},
		update : function(){
			clearTimeout(this.updateTimeoutID);

			if (!this.template){
				return;
			}

			if (+new Date() - this.prevUpdateTime < 300){
				this.updateTimeoutID = setTimeout(this.update, 300);
				return;
			}


			this.prevUpdateTime = +new Date();

			var _this = this;
			this.put(this.template.make(this.settings, function(data, userData){
				var type  = _this.laya.typeof(data);
				var value = _this.laya.pickValue(data, userData);

				// if (type == "~"){
				// 	_this.laya.postal.on(data.split(type)[1], "change", _this.update);
				// }

				return value;

			}));
		}
	};

	return CSS;

});
