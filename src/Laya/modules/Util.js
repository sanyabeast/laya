"use strict";
define(function(){

	var Util = function(laya){
		this.laya = laya;

		window.laya = laya;
	};

	Util.prototype = {
		parseInlineTemplate : function(tpl){
			var result = {};
			var splitted = tpl.split("##");

			for (var a = 0, key, value; a < splitted.length; a++){
				if (splitted[a].length < 3){
					continue;
				} else {
					key = splitted[a].split("=")[0];
					value = splitted[a].split("=")[1];

					result[key] = value;

				}
			}

			console.log(result);

			return result;

		},
		copyTextNodeValue : function(sourceNode, targetNode){
			if (sourceNode instanceof window.Node && sourceNode instanceof window.Text){
				sourceNode = sourceNode;
			} else {
				sourceNode.innerText = sourceNode.innerText || " ";
				sourceNode = sourceNode.childNodes[0];
			}

			if (targetNode instanceof window.Node && targetNode instanceof window.Text){
				targetNode = targetNode;
			} else {
				targetNode.innerText = targetNode.innerText || " ";
				targetNode = targetNode.childNodes[0];
			}

			if (sourceNode.linked){
				this.setTextNodeValue(targetNode, sourceNode.nodeValue, sourceNode.linked.path);
			} else {
				this.setTextNodeValue(targetNode, sourceNode.nodeValue);
			}
		},
		setTextNodeValue : function(node, text, linked, templateSettings){

			if (node instanceof window.Node && node instanceof window.Text){
				node = node;
			} else {
				node.innerText = node.innerText || " ";
				node.childNodes[0].skip = true;
				node = node.childNodes[0];
			}


			node.linked = node.linked || {};

			if (node.linked.subID && node.linked.path){
				this.laya.base.off(node.linked.path, "change", node.linked.subID);
			}


			node.nodeValue = text;

			if (linked){
				node.nodeValue = this.laya.Template(this.laya.base(linked), templateSettings);
				var subID = this.laya.base.on(linked, "change", this.laya._onTextNodeValueChanged.bind(this, node, templateSettings));
				node.linked.subID = subID;
				node.linked.path = linked;
			}

		},
		removeHTMLTags : function(data){
			return data.replace(/(<([^>]+)>)/ig, "");
		},
		patchNative : function(){
			var _this = this;
			var Node = window.Node.prototype;
			var NodeList = window.NodeList.prototype;
			var transformMatrix = [1, 0, 0, 1, 0, 0];

			this.addProp(Node, "filterChildren", {
				value : function(selector, comparator){
					var children = this.querySelectorAll(selector);

					for (var a = 0; a < children.length; a++){
						if (comparator && comparator(children[a], _this.removeHTMLTags(children[a].innerHTML))){
							children[a].classes.remove("hidden");
						} else {
							children[a].classes.add("hidden");
						}
					}

				}
			});

			this.addProp(Node, "transformMatrix", {
				get : function(){
					if (!this._transformMatrix){
						if (this.style.transform.indexOf("matrix") > -1){
							this._transformMatrix = this.style.transform.replace("matrix(", "").replace(")", "").split(",");
						} else {
							this._transformMatrix = transformMatrix.slice();
							this.transformMatrix = this.transformMatrix;
						}
					} 

					return this._transformMatrix;
				},
				set : function(matrix){
					this._transformMatrix = matrix;
					this.style.transform = "matrix(" +  matrix.join(",") + ")";
				}
			});

			this.addProp(Node, "scale", {
				get : function(){
					return this.transformMatrix[0];
				},
				set : function(value){
					this.transformMatrix[0] = this.transformMatrix[3] = value;
					this.transformMatrix = this.transformMatrix;
				}
			});

			this.addProp(Node, "x", {
				get : function(){
					return this.transformMatrix[4];
				},
				set : function(value){
					this.transformMatrix[4] = value;
					this.transformMatrix = this.transformMatrix;
				}
			});

			this.addProp(Node, "y", {
				get : function(){
					return this.transformMatrix[5];
				},
				set : function(value){
					this.transformMatrix[5] = value;
					this.transformMatrix = this.transformMatrix;
				}
			});

			this.addProp(Node, "opacity", {
				get : function(){
					if (typeof this._opacity != "number"){
						if (this.style.opacity){
							this._opacity = Number(this.style.opacity);
						} else {
							this._opacity = 1;
						}
					} 

					return this._opacity
				},
				set : function(value){
					this._opacity = value;
					this.style.opacity = value;
				}
			});

			this.addProp(Node, "laya", {
				value : this.laya
			});

			this.addProp(Node, "bounds", {
				get : function(){
					var rect = this.getBoundingClientRect();

					var result = {
						x : rect.left,
						y : rect.top,
						tnx : window.innerWidth - rect.left - rect.width,
						tny : window.innerHeight - rect.top - rect.height,
						nx : window.innerWidth - rect.left,
						ny : window.innerHeight - rect.top,
						ix : rect.right,
						iy : rect.bottom,
						get cx(){
							return this.x + this.w / 2
						},
						get cy(){
							return this.y + this.h / 2;
						},
						w : rect.width,
						h : rect.height
					};

					return result;
				}
			});

			this.addProp(Node, "setCommand", {
				value : function(name, command){
					this.commands = this.commands || {};
					this.commands[name] = command;
				}
			});

			this.addProp(Node, "invokeCommand", {
				value : function(name, data){
					this.commands = this.commands || {};

					if (this.commands[name]){
						this.commands[name](data);
					} else {
						_this.laya.console.warn("Laya: commands - no command specified", this, name, data);
					}
				}
			});

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
					var itemsHolder = this;

					if (this.hasAttribute("data-items-holder")){
						var itemsHolderSelector = this.getAttribute("data-items-holder");
						itemsHolder = this.select(itemsHolderSelector)[0];

					}

					var itemData = this.getAttribute("data-item-layout");
					var content = _this.laya.make("~" + itemData, data);
					itemsHolder.appendChild(content);
					return this;
				},
				writable : true
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
				value : function(name, child){ 
					if (typeof child == "undefined"){
						child = name;
					}

					if (!(child instanceof window.Element) && child.view instanceof window.Element){
						child = child.view;
					}

					this.appendChild(child); 
				}
			});

			this.addProp(Node, "addListener", {
				value : function(eventName, callback, prop){
					var _this = this;
					this.addEventListener(eventName, function(evt){
						callback(evt, _this);
					}, prop);
				}
			});

			this.addProp(Node, "on", {
				value : function(options){
					var _node = this;
					var eventName = options.eventName;
					var callback = options.callback;
					var context = options.context;
					var name = options.name || _this.randString();
					var capture = options.capture || false;

					if (!callback){
						return this;
					}

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

			this.addProp(Node, "view", {
				get : function(){
					return this;
				}
			});

			this.addProp(Node, "show", {
				value : function(){
					this.classes.remove("hidden");
				}
			});

			this.addProp(Node, "hide", {
				value : function(){
					this.classes.add("hidden");
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

			this.addProp(Node, "selectByAttr", {
				value : function(attrName, attrValue, noCache, callback, context){
					return this.select("[" + attrName + "='" + attrValue + "']", noCache, callback, context);
				}
			});

			this.addProp(Node, "bindValue", {
				value : function(path, templateSettings){
					var node = this;

					if (node instanceof window.Node && node instanceof window.Text){
						node = node;
					} else {
						node.innerText = node.innerText || " ";
						node.childNodes[0].skip = true;
						node = node.childNodes[0];
					}


					node.linked = node.linked || {};

					if (node.linked.subID && node.linked.path){
						this.laya.base.off(node.linked.path, "change", node.linked.subID);
					}
					

					node.nodeValue = this.laya.Template.fast(this.laya.base.get(path), templateSettings);
					var subID = this.laya.base.on(path, "change", this.laya._onTextNodeValueChanged.bind(this, node, templateSettings));
					node.linked.subID = subID;
					node.linked.path = path;
				}
			});

			this.addProp(Node, "text", {
				set : function(value){
					this.innerHTML = value;
				},
				get : function(){
					return this.innerHTML;
				}
			});

			this.addProp(Node, "translatePos", {
				value : function(x, y){
					this.style.transform = "translateX(" + x + ") translateY(" + y + ")";
				}
			});

			this.addProp(Node, "select", {
				value : function(selector, noCache, callback, context){
					if (typeof noCache == "function"){
						context = callback;
						callback = noCache;
						noCache = false;
					}

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

			this.addProp(Node, "selectId", {
				value : function(selector, noCache, callback, context){
					if (typeof noCache == "function"){
						context = callback;
						callback = noCache;
						noCache = false;
					}


					selector = "#" + selector;

					this.selectorCache = this.selectorCache || {};
					var result = this.selectorCache[selector];

					if (noCache === true || !result){

						
						result = this.querySelector(selector);
						if (result.length) result = result[0];
						this.selectorCache[selector] = result;
					}

					if (result.length) result = result[0];

					if (callback){
						callback.call(context, result);
					}


					return result;
				}
			});

			this.addProp(Node, "selectClass", {
				value : function(selector, noCache, callback, context){
					if (typeof noCache == "function"){
						context = callback;
						callback = noCache;
						noCache = false;
					}

					this.selectorCache = this.selectorCache || {};
					var result = this.selectorCache[selector];

					if (noCache === true || !result){
						result = this.getElementsByClassName(selector);
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

			this.addProp(Node, "selectQuery", {
				value : function(selector, noCache, callback, context){
					if (typeof noCache == "function"){
						context = callback;
						callback = noCache;
						noCache = false;
					}

					return this.select(selector, noCache, callback, context);
				}
			});



		},
		wrapScript : function(script){
			return this.laya.Template.fast("(function(extensions, common){'use strict'; {{script}} })", {
				script : script
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
		evalInContext : function(script, context){
			return function() { return eval(script); }.call(context);
		},
		copyAttrs : function(source, target, exclude){
			if (source.attributes){
				for (var a = 0, mergedAttr, attr; a < source.attributes.length; a++){
					attr = source.attributes[a];
					if (exclude.indexOf(attr.name) < 0){
						if (target.hasAttribute(attr.name)){
							mergedAttr = target.getAttribute(attr.name) + " " + attr.value;
							mergedAttr = this.superTrim(mergedAttr);
							target.setAttribute(attr.name, mergedAttr);
						} else {
							target.setAttribute(attr.name, attr.value);
						}
					}
				}
			}

			return this;
		},
		copyInnerContent : function(source, target){
			var child;

			while (source.childNodes.length > 0){
				child = source.removeChild(source.childNodes[0]);
				target.addChild(child);
			}


			return this;
		},
		isDescedant : function(parent, testNode){
			return parent.contains(testNode);
		},
		mergeSettings : function(objA, objB){
			var result = [];

			if (window.Array.isArray(objA)){
				for (var a = 0; a < objA.length; a++){
					result.push(objA[a]);
				}
			} else {
				result.push(objA);
			}

			if (window.Array.isArray(objB)){
				for (var a = 0; a < objB.length; a++){
					result.push(objB[a]);
				}
			} else {
				result.push(objB);
			}

			return result;

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
