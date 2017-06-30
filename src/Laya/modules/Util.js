"use strict";
define(function(){

	var Util = function(laya){
		this.laya = laya;
	};

	Util.prototype = {
		patchNative : function(){
			var _this = this;
			var Node = window.Node.prototype;
			var NodeList = window.NodeList.prototype;

			this.addProp(Node, "setStyle", {
				value : function(name, value){
					this.style[name] = value;
				}
			});

			this.addProp(Node, "toggle", function(classname){
				if (this.classList.contains(classname)){
					this.classList.remove(classname);
				} else {
					this.classList.add(classname);
				}
			});

			this.addProp(Node, "classes", {
				get : function(){
					return this.classList;
				}
			});

			this.addProp(Node, "addChild", {
				value : function(child){ this.appendChild(child); }
			});

			this.addProp(Node, "on", {
				value : function(options){

					var eventName = options.eventName;
					var callback = options.callback;
					var context = options.context;
					var name = options.name || _this.randString();
					var capture = options.capture || false;

					if (context){
						var handler = function(){
							callback.apply(context, arguments);
						};
					} else {
						var handler = function(evt){
							callback(evt);
						};
					}



					this.addEventListener(eventName, handler, capture);

					this.eventHandlers = this.eventHandlers || {};
					this.eventHandlers[eventName] = this.eventHandlers[eventName] || {};
					this.eventHandlers[eventName][name] = handler;
				}
			});

			this.addProp(Node, "off", {
				value : function(options){
					var eventName = options.eventName;
					var name = options.name;

					this.removeEventListener(eventName, this.eventHandlers[eventName][name]);
					delete this.eventHandlers[eventName][name];
				}
			});

			this.addProp(Node, "select", {
				value : function(selector, noCache, callback, context){
					this.selectorCache = this.selectorCache || {};
					var result = this.selectorCache[selector];

					if (noCache === true || !result){
						result = this.querySelectorAll(selector);
						this.selectorCache[selector] = result;
					}

					if (callback){
						for (var a = 0, l = result.length; a < l; a++){
							callback.call(context, result[a]);
						}
					}

					return result;
				}
			});



		},
		eachArr : function(arr, callback, context){

		},
		keys : function(obj){
			return Object.keys(obj);
		},
		patchProto : function(C, Laya){
			C.prototype.Laya = Laya;
			C.prototype.base = Laya.base;
			C.prototype.util = this;
			return C;
		},
		superTrim : function(input){
			input = input.replace(/\s\s+/g, " ");
			input = input.replace(/(\r\n|\n|\r)/gm,"");
			input = input.trim();
			return input;
		},
		priorProp: function(name){
			var result = null;

			for (var a = 1; a < arguments.length; a++){
				if (arguments[a][name]){
					result = arguments[a][name];
				}
			}

			return result;
		},
		HTML2DOM : function(html){
			var temp = document.createElement("div");
			var node;
			temp.innerHTML = html;
			var dom = document.createDocumentFragment();

			while(temp.childNodes.length){
				node = temp.childNodes[0];
				temp.removeChild(node);
				dom.appendChild(node);
			}

			temp.remove();
			return dom;
		},
		addProp : function(target, name, description){
			Object.defineProperty(target, name, description);
		},
		randString : function(prefix, postfix){
			return (prefix||"") + Math.random().toString(36).substring(7) + (postfix||"");
		}
	};

	return Util;

});
