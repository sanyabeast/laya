"use strict";
define(function(){

	var CSS = function(laya){
		this.laya = laya;
		this.template = null;
		this.settings = null;

		this.prevUpdateTime = 0;

		this.update = this.update.bind(this);
	};

	CSS.prototype = {
		put : function(css){
			var styleElement = document.getElementById("laya-styles");
			styleElement.innerText = css;
		},
		setup : function(css, settings){
			this.settings = settings;
			this.template = new this.laya.Template(css);

			var styleElement = document.createElement("style");
			styleElement.id = "laya-styles";
		  	styleElement.type = "text/css";

		 	var head = document.getElementsByTagName("head");

		 	if (head && head[0]){
		 		head[0].appendChild(styleElement);
		 	}

		 	this.update();
		},
		update : function(){

			if (+new Date() - this.prevUpdateTime < 1000){
				return;
			}


			this.prevUpdateTime = +new Date();

			var _this = this;
			this.put(this.template.make(this.settings, function(data, userData){
				var type  = _this.laya.typeof(data);
				var value = _this.laya.pickValue(data, userData);

				if (type == "~"){
					_this.laya.base.on(data.split(type)[1], "change", _this.update);
				}

				return value;

			}));
		}
	};

	return CSS;

});
