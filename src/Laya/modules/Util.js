"use strict";
define(function(){

	var Collection = function(options){
		options = options || { array : true };
		this.isArray = (options.array === true) || (options.object === false);
		this._content = this.isArray ? [] : {};

		if (options.content){
			this.addMultiple(options.content);
		}
		
	};

	Collection.prototype = {
		get content(){
			return this._content;
		},
		addMultiple : function(data){
			this._iterate(data, this.isArray, function(value, index){
				this._content[index] = value;
			});
		},
		_iterate : function(target, isArray, callback, context){
			context = context || this;

			if (isArray){
				for (var a = 0, l = target.length; a < l; a++){
					callback.call(context, target[a], a);
					if (l != target.length){
						return this._iterate.apply(this, arguments);
					}
				}
			} else {
				for (var k in target){
					callback.call(context, target[k], k);
				}
			}

			return this;
		},
		iterate : function(callback, context){
			this._iterate(this.content, this.isArray, callback, context);
		},
		contains : function(checkValue){
			var result = false;

			this.iterate(function(value){
				if (value === checkValue){
					result = true;
				}
			}, this);

			return result;

		},
		add : function(key, value){
			if (this.isArray){
				this._content.push(key);
			} else {
				this._content[key] = value;
			}
		},
		remove : function(key){
			if (this.isArray){
				this.iterate(function(value, index){
					if (value === key){
						this._content.splice(index, 1);
					}
				});
			} else {
				delete this._content[key];
			}
		},
		update : function(key, value){
			if (this.isArray){

			} else {
				this._content[key] = value;
			}
		},
		get : function(index){
			return this._content[index];
		}
	};

	var Util = function(laya){
		this.laya = laya;

		window.laya = laya;
	};

	Util.prototype = {
		generateRandString : function(length){
			var result = "";

			while (result.length < length){
				result = result + (Math.random().toString(32).substring(3, 16).replace(/[0-9]/g, ""));
			}

			result = result.substring(0, length);

			return result;

		},
		extractCallbackFromScriptElement : function(scriptNode, context){
			if (!scriptNode){
				this.laya.warn("Laya: attr-processor: data-on:* - no callback script", el, callback, name);
				return false;
			}

			if (scriptNode.extractedCallback){
				return script.extractedCallback;
			}

			var script = scriptNode.innerText;
			var callback;

			script = this.laya.util.wrapScript(script);

			callback = eval(script);
			if (context) callback = callback.bind(context);

			scriptNode.innerText = "";
			scriptNode.extractedCallback = callback;

			return callback;
		},
		extractJSONFromAttribute : function(node, attrName){
			var result = null;

			if (node.hasAttribute(attrName)){
				result = node.getAttribute(attrName);
				result = this.strReplaceAll(result, "'", "\"");
			}

			try {
				result = JSON.parse(result);
			} catch (err){
				this.laya.console.warn("failed to extract JSON from attribute", err);
				result = null;
			}

			return result;

		},
		strReplaceAll : function(string, a, b){
			return string.replace(new RegExp(a, "g"), b);
		},
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

			return result;

		},
		copyTextNodeValue : function(sourceNode, targetNode){
			sourceNode = sourceNode.extractTextNode();
			targetNode = targetNode.extractTextNode();

			if (sourceNode.linked.contains("path")){
				targetNode.bindValue(sourceNode.linked.get("path"), sourceNode.textNodeTemplate);
			} else {
				targetNode.text = sourceNode.nodeValue;
			}
		},
		removeHTMLTags : function(data){
			return data.replace(/(<([^>]+)>)/ig, "");
		},
		applyPrototypePatches : function(){
			var _this = this;
			var Node = window.Node.prototype;
			var NodeList = window.NodeList.prototype;
			var transformMatrix = [1, 0, 0, 1, 0, 0];


			this.defineProperties(window.Node.prototype, {
				"layaID" : {
					get : function(){
						if (!this._layaID) {
							this._layaID = _this.generateRandString(32);
							_this.laya.layaNodes.add(this._layaID, this);
						}
						return this._layaID;
					}
				},
				"filterChildren" : {
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
				},
				"transformMatrix" : {
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
				},
				"scale" : {
					get : function(){
						return this.transformMatrix[0];
					},
					set : function(value){
						this.transformMatrix[0] = this.transformMatrix[3] = value;
						this.transformMatrix = this.transformMatrix;
					}
				},
				"x" : {
					get : function(){
						return this.transformMatrix[4];
					},
					set : function(value){
						this.transformMatrix[4] = value;
						this.transformMatrix = this.transformMatrix;
					}
				},
				"y" : {
					get : function(){
						return this.transformMatrix[5];
					},
					set : function(value){
						this.transformMatrix[5] = value;
						this.transformMatrix = this.transformMatrix;
					}
				},
				"opacity" : {
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
				},
				"laya" : {
					value : this.laya
				},
				"bounds" : {
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
				},
				"setCommand" : {
					value : function(name, command){
						this.commands = this.commands || {};
						this.commands[name] = command;
					}
				},
				"invokeCommand" : {
					value : function(name, data){
						this.commands = this.commands || {};

						if (this.commands[name]){
							this.commands[name](data);
						} else {
							_this.laya.console.warn("Laya: commands - no command specified", this, name, data);
						}
					}
				},
				"sortBy" : {
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
				},
				"addItem" : {
					value : function(data){
						var itemsHolder = this;

						if (this.hasAttribute("data-items-holder")){
							var itemsHolderSelector = this.getAttribute("data-items-holder");
							itemsHolder = this.select(itemsHolderSelector)[0];

						}

						var itemData = this.getAttribute("data-item-layout");
						var content = _this.laya.make(base.get(itemData), data);
						itemsHolder.appendChild(content);
						return this;
					},
					writable : true
				},
				"setMultipleStyles" : {
					value : function(style){
						for (var k in style){
							this.style[k] = style[k];
						}

						return this;
					}
				},
				"setStyle" : {
					value : function(name, value){
						this.style[name] = value;
					}
				},
				"toggle" : {
					value : function(classname){
						if (this.classList.contains(classname)){
							this.classList.remove(classname);
						} else {
							this.classList.add(classname);
						}
					}
				},
				"classes" : {
					get : function(){
						var _this = this;

						if (!this._classes){
							this._classes = {
								remove : function(value){
									return _this.classList.remove(value);
								},
								add : function(value, onAnimationEnd, context){
									if (onAnimationEnd){

										var callback = function(evt){
											onAnimationEnd.call(context || null, evt);
										};

										_this.addEventListener("webkitAnimationEnd", callback, false)
									};

									_this.classList.add(value);
								},
								contains : function(value){
									return _this.classList.contains(value);
								}
							}
						}
						return this._classes;
					}
				},
				"addChild" : {
					value : function(name, child){ 
						if (typeof child == "undefined"){
							child = name;
						}

						if (!(child instanceof window.Element) && child.view instanceof window.Element){
							child = child.view;
						}

						this.appendChild(child); 
					}
				},
				"addListener" : {
					value : function(eventName, callback, prop){
						var _this = this;
						this.addEventListener(eventName, function(evt){
							callback(evt, _this);
						}, prop);
					}
				},
				"on" : {
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
				},
				"view" : {
					get : function(){
						return this;
					}
				},
				"show" :  {
					value : function(){
						this.classes.remove("hidden");
					}
				},
				"hide" : {
					value : function(){
						this.classes.add("hidden");
					}
				},
				"off" : {
					value : function(options){
						var eventName = options.eventName;
						var name = options.name;

						this.removeEventListener(eventName, this.eventHandlers[eventName][name]);
						delete this.eventHandlers[eventName][name];
					}
				},
				"selectByAttr" : {
					value : function(attrName, attrValue, noCache, callback, context){
						return this.select("[" + attrName + "='" + attrValue + "']", noCache, callback, context);
					}
				},
				"bindValue" : {
					value : function(path, templateSettings){
						var node = this.extractTextNode();
						var linked = node.linked;

						_this.laya.base.off(linked.get("subID"));


						node.linked.update("templateSettings", templateSettings || null);
						node.linked.update("path" , path);
						_this.laya.bindedValues.update(node.layaID, path);

						if (typeof path == "string"){
							node.linked.update("subID", _this.laya.base.on(path, "change", this.updateBoundValue.bind(this)));

						} 

						this.updateBoundValue();
						
					}
				},
				"updateBoundValue" : {
					value : function(value){
						var node = this.extractTextNode();

						if (typeof node.linked.get("path") == "function"){
							node.nodeValue = node.linked.get("path")(node.linked.get("templateSettings"));
						} else if (typeof node.linked.get("path") == "string"){
							node.nodeValue = this.laya.Template.fast(value || this.laya.base.get(node.linked.get("path")), node.linked.get("templateSettings"), this.laya.templateGetterFromUserData.bind(this.laya));
						}

					}
				},
				"text" : {
					set : function(value){
						this.extractTextNode().nodeValue = value;
					},
					get : function(){
						return this.extractTextNode().nodeValue;
					}
				},
				"translatePos" : {
					value : function(x, y){
						this.style.transform = "translateX(" + x + ") translateY(" + y + ")";
					}
				},
				"select" : {
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
				},
				"selectId" : {
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
				},
				"selectClass" : {
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
				},
				"selectQuery" : {
					value : function(selector, noCache, callback, context){
						if (typeof noCache == "function"){
							context = callback;
							callback = noCache;
							noCache = false;
						}

						return this.select(selector, noCache, callback, context);
					}
				},
				"extractTextNode" : {
					value : function(){
						if (this instanceof window.Node && this instanceof window.Text){
							return this;
						} else if (this instanceof window.Node && !(this instanceof window.Text)){
							if (this.childNodes.length){
								return this.childNodes[0];
							} else {
								this.innerHTML = " ";
								this.childNodes[0].thisValue = "";
								return this.childNodes[0];
							}
						}
					}
				},
				"linked" : {
					get : function(){
						if (!this._linked) this._linked = new Collection({
							object : true,
							content : []
						});

						return this._linked
					},
				}
			});

			this.defineProperties(window.NodeList.prototype, {
				"first" : {
					get : function(){
						return this[0];
					}
				},
				"select" : {
					value : function(selector, noCache, callback, context){
						for (var a = 0; a < this.length; a++){
							this[a].select.apply(this[a], arguments);
						}
					}
				},
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
		defineProperties : function(target, props){
			for (var k in props){
				Object.defineProperty(target, k, props[k]);
			}

			return this;
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
		inheritClass : function(Dad, Son){
			var Result = function(){
				Dad.apply(this, arguments);
				Son.apply(this.arguments);
			};

			Result = this.assign(Son.prototype, Dad.prototype);
			return Result;
		},
		Collection : Collection
	};

	

	return Util;

});
