"use strict";
define(function(){

	var laya;
	var util;
	var allEventListeners;
	var globalSelectorCache;
	var transformMatrix = [1, 0, 0, 1, 0, 0];

	var NodePatch = function(
	  _laya
	, _util
	, _allEventListeners
	, _globalSelectorsCache
	, _removeEventListener
	, _addEventListner
	, _nativeRemove
	){
		laya = _laya;
		util = _util;
		allEventListeners = _allEventListeners;
		globalSelectorCache = _globalSelectorsCache;
		addEventListener = _addEventListner;
		removeEventListener = _removeEventListener;
		nativeRemove = _nativeRemove;
	};

	NodePatch.prototype = {
		"removeAllEventListeners" : function(){
			var eventListeners = this._eventListeners;
			var allEventListeners = this.allEventListeners;

			_.loopList(eventListeners, function(listeners, eventName){
				_.loopList(listeners, function(listenerData, listenerID){
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

			util.loopArray(this.onRemove, function(callback){
				callback(this);
			}, this);

			if (this.childNodes){
				util.loopArray(this.childNodes, function(child){
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
				var eventListenerID = ("event-listener-") + util.generateRandString(16);
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
					this._layaID = util.generateRandString(32);
					// util.laya.layaNodes.add(this._layaID, this);
					
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
				if (comparator && comparator(children[a], util.removeHTMLTags(children[a].innerHTML))){
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
			get value(){
				return laya;
			}
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
				util.laya.console.warn("Laya: commands - no command specified", this, name, data);
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

			buff = util.sortBy(buff, comp, desc);

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
			var content = util.laya.make(util.laya.base.get(itemData), data);
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
				var util = this;

				if (!this._classes){
					this._classes = {
						remove : function(value){
							return util.classList.remove(value);
						},
						add : function(value, onAnimationEnd, context){
							return util.classList.add(value);
						},
						contains : function(value){
							return util.classList.contains(value);
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
			var util = this;
			this.addEventListener(eventName, function(evt){
				callback(evt, util);
			}, prop);
		},
		"on" : function(options){
			var _node = this;
			var eventName = options.eventName;
			var callback = options.callback;
			var context = options.context;
			var name = options.name || util.randString();
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
				util.laya.base.off(node.linked.get("subID"));
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
			util.laya.bindedValues.update(node.layaID, path);

			if (typeof path == "string"){
				node.linked.update("subID", util.laya.base.on(path, "change", this.updateBoundValue.bind(this)), true);

			} 

			this.updateBoundValue();
			
		},
		"updateBoundValue" : function(value){
			var node = this.extractTextNode();

			if (typeof node.linked.get("path") == "function"){
				node.nodeValue = node.linked.get("path")(node.linked.get("templateSettings"));
			} else if (typeof node.linked.get("path") == "string"){
				node.nodeValue = this.laya.Template.fast(value || this.laya.base.get(node.linked.get("path")), node.linked.get("templateSettings"), this.laya.templateGetterFromUserData.bind(this.laya));
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
			util.loopList(selectorCache, function(value, id){
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
				util.loopArray(result, function(node, index){
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
				if (!this._linked) this._linked = new util.Collection({
					object : true,
					content : []
				});

				return this._linked
			},
		},
		"attr" : function(name, value){
			if (!value || value == ""){
				return this.getAttribute(name);
			} else {
				this.setAttribute(name, value);
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
	};

	return NodePatch;

});