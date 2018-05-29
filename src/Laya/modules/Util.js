"use strict";
define([
		"./Util/Colors",
		"./Util/Collection",
		"./Util/ProcessedSVG",
		"./Util/fetch-pf"
	], function(Colors, Collection, ProcessedSVG){

	

	var Util = function(laya){
		this.laya = laya;
	};



	/*-------*/
	Util.prototype = {
		colors : new Colors(),
		processSVG : ProcessedSVG.process,
		getInvisibleElementsMetrics : function(element, showCallback, hideCallback){
			var zIndex = element.style.zIndex;
			var transform = element.style.transform;
			var transition = element.style.transition;

			element.style.zIndex = "-1!important";
			
			if (showCallback){
				showCallback(element);
			}

			var rect = element.getBoundingClientRect();

			element._rect = element._rect || {};

			for (var k in rect){
				element._rect[k] = rect[k];
			}

			element._rect.width /= element.scaleX;
			element._rect.height /= element.scaleY;
			element._rect.x -= element.x;
			element._rect.y -= element.y;
			
			if (hideCallback){
				hideCallback(element);
			}

			element.style.zIndex = zIndex;

			return element._rect;

		},
		selectorIsEqual : function(selectorA, selectorB){
			return document.querySelector(selectorA).matches(selectorB);
		},
		generateRandString : function(length){
			var result = "";

			while (result.length < length){
				result = result + (Math.random().toString(32).substring(3, 16).replace(/[0-9]/g, ""));
			}

			result = result.substring(0, length);

			return result;

		},
		extractedCallbacksCache : {},
		extractCallbackFromScriptElement : function(scriptNode, context){
			if (!scriptNode){
				this.laya.warn("Laya: attr-processor: data-on:* - no callback script", el, callback, name);
				return false;
			}

			if (scriptNode.extractedCallback){
				return scriptNode.extractedCallback;
			}

			var script = scriptNode.innerText;


			if (this.extractedCallbacksCache[script]){
				return this.extractedCallbacksCache[script];
			}

			var callback;

			script = this.laya.util.wrapScript(script);

			callback = eval(script);
			if (context) callback = callback.bind(context);

			scriptNode.innerText = "";
			scriptNode.extractedCallback = callback;

			this.extractedCallbacksCache[script] = callback;

			return callback;
		},
		extractJSONFromAttribute : function(node, attrName){
			var result = null;
			var _this = this;

			if (node.hasAttribute(attrName)){
				result = node.getAttribute(attrName);
				result = this.strReplaceAll(result, "'", "\"");
			}

			try {
				result = JSON.parse(result);
			} catch (err){
				console.log(err);
				if (_this.laya){
					_this.laya.console.warn("failed to extract JSON from attribute", err);
				}
				result = null;
			}

			return result;

		},
		strReplaceAll : function(string, a, b){
			return string.replace(new RegExp(a, "g"), b);
		},
		parseInlineTemplate : function(tpl){
			var result = {};
			
			if (tpl.indexOf("{") == 0){
				result = JSON.parse(this.strReplaceAll(tpl, "'", "\""));
			} else {
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
			var Element = window.Element.prototype;
			var transformMatrix = [1, 0, 0, 1, 0, 0];
			var addEventListener = Node.addEventListener;
			var removeEventListener = Node.removeEventListener;
			var nativeRemove = Element.remove;
			var allEventListeners = {
				count : 0
			};

			var globalSelectorCache = {};
			Object.defineProperty(globalSelectorCache, "__count", {
				get : function(){
					var count = 0;
					_this.loopList(this, function(elementToken, name){
						if (name == "__count"){
							return;
						}
						
						_this.loopList(elementToken, function(selector){
							count++;
						});
					});

					return count;
				},
				enumerable : false
			})


			this.defineProperties(window.Element.prototype, {
				"remove" : function(){
					this.runOnRemoveCallbacks(function(element){
						nativeRemove.call(element);
					});
				},
				"nodeValue" : {
					get : function(){
						return this.innerHTML;
					},
					set : function(value){
						this.innerHTML = value;
					}
				},
			});


			this.defineProperties(window.Node.prototype, {
				"setSrc" : function(src){
					var tagName = this.tagName.toLowerCase();

					if (tagName == "svg" && this.wrapper instanceof ProcessedSVG){
						this.wrapper.src = src;
					} else if (tagName == "img"){
						this.src = src;
						_this.laya.attrProcessor.process("src", this, src, "src", null);
					}
				},
				"removeAllEventListeners" : function(){
					var eventListeners = this._eventListeners;
					var allEventListeners = this.allEventListeners;

					_this.loopList(eventListeners, function(listeners, eventName){
						_this.loopList(listeners, function(listenerData, listenerID){
							// console.log(listenerID);
							this.removeEventListener(eventName, listenerData.callback, listenerData.useCapture);
							delete eventListeners[eventName][listenerID];
							delete allEventListeners[eventName][listenerID];
							allEventListeners.count--;
						}, this);

					}, this);

					delete this._eventListeners;
				},
				"runOnRemoveCallbacks" : function(onComplete){

					this.removeAllEventListeners();
					delete this.selectorCache[this.layaID];
					this.laya.layaNodes.remove(this.layaID);

					_this.loopArray(this.onRemove, function(callback){
						callback(this);
					}, this);

					if (this.childNodes){
						_this.loopArray(this.childNodes, function(child){
							child.runOnRemoveCallbacks();
						});
					}

					if (onComplete){
						onComplete(this);
					}
				},
				"onRemove" : {
					get : function(){
						var onRemove = this._onRemove;
						if (!onRemove) onRemove = [];
						this._onRemove = onRemove;
						return onRemove;
					}
				},
				"remove" : function(){
					this.runOnRemoveCallbacks(function(element){
						nativeRemove.call(element);
					});
				},
				"allEventListeners" : {
					get : function(){
						return allEventListeners;
					}
				},
				"eventListeners" : {
					get : function(){
						if (!this._eventListeners){
							this._eventListeners = {};
						}

						return this._eventListeners;
					}
				},
				"addEventListener" : function(eventName, callback, useCapture){
						var eventListenerID = ("event-listener-") + _this.generateRandString(16);
					var eventListeners = this.eventListeners;
					var allEventListeners = this.allEventListeners;

					eventListeners[eventName] = eventListeners[eventName] || {};
					allEventListeners[eventName] = allEventListeners[eventName] || {};

					eventListeners[eventName][eventListenerID] = allEventListeners[eventName][eventListenerID] = {
						callback : callback,
						useCapture : useCapture,
						node : this
					};

					allEventListeners.count++;

					addEventListener.call(this, eventName, callback, useCapture);
				},
				removeEventListener : function(eventName, callback, useCapture){
					if (eventName && callback){
						removeEventListener.call(this, eventName, callback, useCapture);
					} else if (eventName){
						var eventListeners = this.eventListeners;

						if (eventListeners[eventName]){
							for (var k in eventListeners[eventName]){
								this.removeEventListener(eventName, eventListeners[eventName][k].callback, eventListeners[eventName][k].useCapture);
								delete eventListeners[eventName][k];
							}
						}

					} else {
						var eventListeners = this.eventListeners; 

						for (var k in eventListeners){
							this.removeEventListener(k);
						}
					}
				},
				"layaID" : {
					get : function(){
						if (!this._layaID) {
							this._layaID = _this.generateRandString(32);
							// _this.laya.layaNodes.add(this._layaID, this);
							
							if (this.setAttribute){
								this.setAttribute("data-laya-id", this._layaID);
							}

						}
						return this._layaID;
					}
				},
				"filterChildren" : function(selector, comparator){
					var children = this.querySelectorAll(selector);

					for (var a = 0; a < children.length; a++){
						if (comparator && comparator(children[a], _this.removeHTMLTags(children[a].innerHTML))){
							children[a].classes.remove("hidden");
						} else {
							children[a].classes.add("hidden");
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
				"scaleX" : {
					get : function(){
						return this.transformMatrix[0];
					},
					set : function(value){
						this.transformMatrix[0] = value;
						this.transformMatrix = this.transformMatrix;
					}
				},
				"scaleY" : {
					get : function(){
						return this.transformMatrix[3];
					},
					set : function(value){
						this.transformMatrix[3] = value;
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
				"numWidth" : {
					set : function(value){
						this.style.width = value + (this.style.width.replace(/[0-9]/g, "") || "px");
					},
					get : function(){
						return window.parseInt(this.style.width) || (this.bounds.w);
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
				"resetStyles" : function(){
					this.removeAttribute("style");
				},
				"contentFilter" : function(selector, value, onMatch, onDismatch){

					this.select(selector, true, function(node){
						if (node.innerHTML.match(value)){
							onMatch(node);
						} else {
							onDismatch(node);
						}
					}, this);
				},
				"bounds" : {
					get : function(){
						var rect = this.getBoundingClientRect();

						this._boundsRect = this._boundsRect || {
							get cx(){
								return this.x + this.w / 2
							},
							get cy(){
								return this.y + this.h / 2;
							},
						};


						this._boundsRect.x   = rect.left;
						this._boundsRect.y   = rect.top;
						this._boundsRect.tnx = window.innerWidth - rect.left - rect.width;
						this._boundsRect.tny = window.innerHeight - rect.top - rect.height;
						this._boundsRect.nx  = window.innerWidth - rect.left;
						this._boundsRect.ny  = window.innerHeight - rect.top;
						this._boundsRect.ix  = rect.right;
						this._boundsRect.iy  = rect.bottom;
						
						this._boundsRect.w = rect.width;
						this._boundsRect.h = rect.height;

						return this._boundsRect;
					}
				},
				"setCommand" : function(name, command){
					this.commands = this.commands || {};
					this.commands[name] = command;
				},
				"invokeCommand" : function(name, data){
					this.commands = this.commands || {};

					if (this.commands[name]){
						this.commands[name](data);
					} else {
						_this.laya.console.warn("Laya: commands - no command specified", this, name, data);
					}
				},
				"sortBy" : function(comp, desc){
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

				},
				"addItem" : function(data, userData){
					var itemsHolder = this;

					if (this.hasAttribute("data-items-holder")){
						var itemsHolderSelector = this.getAttribute("data-items-holder");
						itemsHolder = this.select(itemsHolderSelector, true).first;

					}

					if (userData){
						data = this.laya.util.mergeSettings(data, userData);
					}

					var itemData = this.getAttribute("data-item-layout");
					var content = _this.laya.make(_this.laya.postal.get(itemData), data);
					itemsHolder.appendChild(content);
					
					return content;
				},
				"setMultipleStyles" : function(style){
					for (var k in style){
						this.style[k] = style[k];
					}

					return this;
				},
				"setStyle" : function(name, value){
					this.style[name] = value;
				},
				"toggle" : function(classname){
					if (this.classList.contains(classname)){
						this.classList.remove(classname);
					} else {
						this.classList.add(classname);
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
									return _this.classList.add(value);
								},
								contains : function(value){
									return _this.classList.contains(value);
								}
							}
						}
						return this._classes;
					}
				},
				"addChild" : function(name, child){ 
					if (typeof child == "undefined"){
						child = name;
					}

					if (!(child instanceof window.Element) && child.view instanceof window.Element){
						child = child.view;
					}

					this.appendChild(child); 
				},
				"addListener" : function(eventName, callback, prop){
					var _this = this;
					this.addEventListener(eventName, function(evt){
						callback(evt, _this);
					}, prop);
				},
				"on" : function(options){
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

					// this.eventHandlers = this.eventHandlers || {};
					// this.eventHandlers[eventName] = this.eventHandlers[eventName] || {};
					// this.eventHandlers[eventName][name] = handler;
				},
				"view" : {
					get : function(){
						return this;
					}
				},
				"show" :  function(){
					this.classes.remove("hidden");
				},
				"hide" : function(){
					this.classes.add("hidden");
				},
				"off" : function(options){
					var eventName = options.eventName;
					var name = options.name;

					this.removeEventListener(eventName, this.eventHandlers[eventName][name]);
					delete this.eventHandlers[eventName][name];
				},
				"selectByAttr" : function(attrName, attrValue, noCache, callback, context){
					return this.select("[" + attrName + "='" + attrValue + "']", noCache, callback, context);
				},
				"selectByAttrs" : function(description, noCache, callback, context){
					var attrSelector = "";

					for (var k in description){
						attrSelector = attrSelector + "[" + k + "=" + "\"" + description[k] + "\"]" 
					}

					return this.select(attrSelector, noCache, callback, context);

				},
				"disconnectNode" : function(){
					if (this.parentNode && !this._disconnected){
						this._disconnected = true;
						this._parentNode = this.parentNode || this._parentNode;
						this._parentNode.disconnectedNodes = this._parentNode.disconnectedNodes || {};
						this.parentNode.removeChild(this);
						this._parentNode.disconnectedNodes[this.layaID] = this;
					}
				},	
				"connectNode" : function(){
					if (this._parentNode && this._disconnected){
						this._disconnected = false;
						this._parentNode.addChild(this);
						this._parentNode.disconnectedNodes = this._parentNode.disconnectedNodes || {};
						delete this._parentNode.disconnectedNodes[this.layaID];
					}
				},
				"unbindValue" : function(){
					var node = this.extractTextNode();
					if (node.linked.bound) {
						_this.laya.postal.off(node.linked.get("subID"));
						node.linked.bound = false;
					}

					this.laya.layaNodes.remove(node.layaID);
					
					return node;
				},
				"descedantsCache" : {
					get : function(){
						if (!this._descedantsCache) this._descedantsCache = {};
						return this._descedantsCache;
					},
				},
				"bindValue" : function(path, templateSettings){
					var node;
					var linked;

					if (this.setAttribute){
						this.setAttribute("data-bound-value", path);
					} else if (this.parentNode && this.parentNode.setAttribute){
						this.parentNode.setAttribute("data-bound-value", path);

					}

					node = this.unbindValue();
					linked = node.linked;

					this.laya.layaNodes.add(node.layaID, node);

					node.linked.update("templateSettings", templateSettings || null);
					node.linked.update("path" , path);
					node.linked.bound = true;
					_this.laya.bindedValues.update(node.layaID, path);

					if (typeof path == "string"){
						node.linked.update("subID", _this.laya.postal.on(path, this.updateBoundValue.bind(this)), true);

					} 

					this.updateBoundValue();
					
				},
				"updateBoundValue" : function(value){
					var node = this.extractTextNode();
					var value;

					if (typeof node.linked.get("path") == "function"){
						node.nodeValue = node.linked.get("path")(node.linked.get("templateSettings"));
					} else if (typeof node.linked.get("path") == "string"){
						node.nodeValue = this.laya.Template.fast(value || this.laya.postal.get(node.linked.get("path")), node.linked.get("templateSettings"), this.laya.templateGetterFromUserData.bind(this.laya));
					}

				},
				"text" : {
					set : function(value){
						var node = this.unbindValue();
						node.nodeValue = value;
					},
					get : function(){
						return this.extractTextNode().nodeValue;
					}
				},
				"translatePos" : function(x, y){
					this.style.transform = ["translate(", x, ",", y, ")"].join("");
					// this.style.transform = "translateX(" + x + ") translateY(" + y + ")";
				},
				"clearSelectorCache" : function(){
					var selectorCache = this.selectorCache;
					_this.loopList(selectorCache, function(value, id){
						delete selectorCache[id];
					}, this);
				},
				"selectorCache" : {
					get : function(){
						return globalSelectorCache;
					}
				},
				"select" : function(selector, noCache, callback, context){
					var layaID = this.layaID;

					if (typeof noCache == "function"){
						context = callback;
						callback = noCache;
						noCache = false;
					}


					this.selectorCache[layaID] = this.selectorCache[layaID] || {};
					var result = this.selectorCache[layaID][selector];

					if (noCache === true || !result){
						result = this.querySelectorAll(selector);
						if (noCache !== true){
							this.selectorCache[layaID][selector] = result;
						}
					}

					if (callback){
						_this.loopArray(result, function(node, index){
							callback.call(context, node, index);
						}, this);
					}

					return result;
				},
				"selectId" : function(selector, noCache, callback, context){
					return this.select.call(this, "#" + selector, noCache, callback, context);
				},
				"selectClass" : function(selector, noCache, callback, context){
					return this.select.call("." + selector, noCache, callback, context);
				},
				"selectQuery" : function(selector, noCache, callback, context){
					return this.select.apply(this, arguments);
				},
				"extractTextNode" : function(){

					if (this.attr("data-laya-binding") == "html" || (this.parentNode && this.parentNode.attr("data-laya-binding") == "html")){
						var isElement = this instanceof window.Element;
						return (isElement) ? this : this.parentNode;
					}

					var result = this._textNode;

					if (!result){
						if (this instanceof window.Node && this instanceof window.Text){
							result = this;
						} else if (this instanceof window.Node && !(this instanceof window.Text)){
							if (this.childNodes.length){
								result = this.childNodes[0];
							} else {
								this.innerHTML = " ";
								this.childNodes[0].thisValue = "";
								result = this.childNodes[0];
							}
						}

						this._textNode = result;
					}

					return result;
					
				},
				"linked" : {
					get : function(){
						if (!this._linked) this._linked = new Collection({
							object : true,
							content : []
						});

						return this._linked
					},
				},
				"attr" : function(name, value){
					if (!value || value == ""){
						return this.getAttribute && this.getAttribute(name);
					} else {
						this.setAttribute && this.setAttribute(name, value);
					}
				},
				"scrollToPos" : function(position){
					this.scrollTop = position;
				},
				"scrollToElement" : function(element){
					if (typeof element == "string"){
						element = this.select(element).first;
					}

					if (element){
						this.scrollTop = element.offsetTop;
						
					}
				}
			});

			this.defineProperties(window.NodeList.prototype, {
				"first" : {
					get : function(){
						return this[0];
					}
				},
				"select" : function(selector, noCache, callback, context){
					for (var a = 0; a < this.length; a++){
						this[a].select.apply(this[a], arguments);
					}
				},
				iterate : function(callback, context){
					for (var a = 0, l = this.length; a < l; a++){
						callback.call(context || null, this[a], a);
					}
				}
			});			

		},
		wrapScript : function(script){
			return this.laya.Template.fast("(function(extensions, common, userData){'use strict'; {{script}} })", {
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
					if (!exclude || (exclude && exclude.indexOf(attr.name) < 0)){
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
			parent.descedantsCache[testNode.layaID] = parent.contains(testNode);
			return parent.descedantsCache[testNode.layaID];
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
			C.prototype.postal = Laya.postal;
			C.prototype.util = this;
			return C;
		},
		superTrim : function(input){
			if (typeof input == "number"){
				input = input.toString();
			}

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
		__cachedHTML2DOMData : {},
		domParser : new DOMParser(),
		HTML2DOM : function(html, noCache){
			/*if (this.__cachedHTML2DOMData[html] && noCache !== true){
				return this.__cachedHTML2DOMData[html].cloneNode(true);
			}*/

			html = this.superTrim(html);
			/*var temp = document.createElement("div");
			var node;
			temp.innerHTML = html;*/

			var temp = this.domParser.parseFromString(html, "text/html");
			var node;
			var dom = document.createDocumentFragment();

			while(temp.body.childNodes.length){
				node = temp.body.childNodes[0];
				temp.body.removeChild(node);
				dom.appendChild(node);
			}

			temp.body.remove();

			/*this.__cachedHTML2DOMData[html] = dom;*/

			return dom;
		},
		defineProperties : function(target, props){
			for (var k in props){
				if (typeof props[k] == "function"){
					Object.defineProperty(target, k, {
						value : props[k],
						writable : true,
						configurable : true
					});
				} else {
					Object.defineProperty(target, k, props[k]);
				}

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
			for (var k in b){
				a[k] = b[k]
			}
		},
		inheritClass : function(Dad, Son){
			var Result = function(){
				Dad.apply(this, arguments);
				Son.apply(this.arguments);
			};

			Result = this.assign(Son.prototype, Dad.prototype);
			return Result;
		},
		loopArray : function(arr, callback, ctx){
			var _break = false;
			for (var a = 0, l = arr.length; a < l; a++){
				_break = callback.call(ctx, arr[a], a, arr);
				if (_break){
					break;
				}
			}
		},
		loopList : function(list, callback, ctx){
			var _break = false;
			for (var a in list){
				_break = callback.call(ctx, list[a], a, list);
				if (_break){
					break;
				}
			}
		},
		resolveURL : function(){
			var result = Array.prototype.join.call(arguments, "/");
			// result = result.replace(new RegExp("//", "g"), "/");
			result = result.replace(new RegExp("\\\\", "g"), "\\");

			// console.log(result);

			return result;
		},
		Collection : Collection
	};

	

	return Util;

});
