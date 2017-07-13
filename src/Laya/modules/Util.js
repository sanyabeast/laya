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

			this.addProp(Node, "sortBy", {
				value : function(comp, desc){
					var buff = [];

					for (var a = 0, l = this.children.length; a < l; a++){
						buff.push(this.children[a]);
					}

					for (var a = 0, l = buff.length; a < l; a++){
						this.removeChild(buff[a]);
					}

					buff = _this.sortBy(buff, comp, desc);

					for (var a = 0, l = buff.length; a < l; a++){
						this.addChild(buff[a]);
					}

					return this;

				}
			});

			this.addProp(Node, "addItem", {
				value : function(data){
					var itemData = this.getAttribute("data-item-layout");
					var content = _this.laya.make("~" + itemData, data);
					this.appendChild(content);
					return this;
				}
			});

			this.addProp(Node, "setMultipleStyles", {
				value : function(style){
					for (var k in style){
						this.style[k] = style[k];
					}

					return this;
				}
			});

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
					var _node = this;
					var eventName = options.eventName;
					var callback = options.callback;
					var context = options.context;
					var name = options.name || _this.randString();
					var capture = options.capture || false;

					if (context){
						var handler = function(evt){
							callback.apply(context, evt, _node);
						};
					} else {
						var handler = function(evt){
							callback(evt, _node);
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
		sortBy : function(arr, comp, desc){
			var shuffles = 0;
			var length = arr.length;

			do {

				shuffles = 0;

				for (var a = 0, rule; a < length - 1; a++){
					rule = (desc === true) ? (comp(arr[a]) < comp(arr[a + 1])) : (comp(arr[a]) > comp(arr[a + 1]));

					if (rule){
						shuffles++;
						this.arrSwap(arr, a, a + 1);
					}
				}

			} while (shuffles > 0)

			return arr;

		},
		arrSwap : function(arr, i1, i2){
			var buff = arr[i1];
			arr[i1] = arr[i2];
			arr[i2] = buff;
			return arr;
		},
		eachArr : function(arr, callback, context){

		},
		copyAttrs : function(source, target, exclude){
			if (source.attributes){
				for (var a = 0; a < source.attributes.length; a++){
					if (exclude.indexOf(source.attributes[a].name < 0)){
						target.setAttribute(source.attributes[a].name, source.attributes[a].value);
					}
				}
			}

			return this;
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
			html = this.superTrim(html);
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
		},
		assign : function(a, b){
			return Object.assign(a, b);
		},
		extend : function(Dad, Son){
			var Result = function(){
				Dad.apply(this, arguments);
				Son.apply(this.arguments);
			};

			Result = this.assign(Son.prototype, Dad.prototype);
			return Result;
		}
	};

	return Util;

});
