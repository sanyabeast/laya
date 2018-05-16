"use strict";
define(function(){

	var laya;

	var Laya = function(Laya, AttrProcessor, CSS, Template, Util, Wrappers, TagProcessor, Mutator){
		if (laya){
			return laya;
		}

		this._bPatters = {};

		laya = this;

		this.Laya = Laya;
		this.AttrProcessor = AttrProcessor;
		this.CSS = CSS;
		this.Template = Template;
		this.Util = Util;
		this.Wrappers = Wrappers;
		this.TagProcessor = TagProcessor;
		this.Mutator = Mutator;

		
	};

	Laya.prototype = {
		LINKED_SIGN : "~",
		LAYOUT_SIGN : "#",
		USER_VALUE_SIGN : "@",
		STRING_SIGN : "?",
		config : {
			onlyPlaneSVG : false
		},
		get outsideRootElement(){
			return this._outsideRootElement || this.rootElement || document;
		},
		set outsideRootElement(el){
			this._outsideRootElement = el;
		},
		updateAllBoundValues : function(){
			this.bindedValues.iterate(function(postalPath, layaID){
				var node = this.layaNodes.get(layaID);

				if (node){
					node.extractTextNode().updateBoundValue();
				}
				
			}, this)
		},
		get scriptGlobal(){
			if (!this._scriptGlobal) this._scriptGlobal = {
				laya : this
			};
			return this._scriptGlobal;
		},
		setBehaviourPattern : function(name, fabric){
			this._bPatters[name] = fabric;
		},
		setScriptsExtensions : function(data){
			this._scriptExtensions = data;
		},
		setBase : function(postal){
			this.postal = postal;
			this.init();
		},
		init : function(){
			this.util = new this.Util(this);
			this.util.applyPrototypePatches();
			this.wrappers = new this.Wrappers(this);
			this.css = new this.CSS(this);
			this.attrProcessor = new this.AttrProcessor(this);
			this.tagProcessor = new this.TagProcessor(this);

			this.bindedValues = new this.util.Collection({
				array : false
			});

			this.layaNodes = new this.util.Collection({
				array : false
			});
		},
		get commands(){
			if (!this._commands) this._commands = [this.LINKED_SIGN, this.LAYOUT_SIGN, this.USER_VALUE_SIGN, this.STRING_SIGN];
			return this._commands;
		},
		_rootElement : document,
		get rootElement(){
			return this._rootElement;
		},
		set rootElement(selector){
			this._rootElement = document.querySelector(selector);
			this._rootElement.mutator = new this.Mutator(this._rootElement, this._onRootMutated.bind(this));
		},
		_onRootMutated : function(evt){
			if (this.onRootMutated) this.onRootMutated(evt);
		},
		select : function(selector, noCache, callback, context){
			return this.rootElement.select(selector, noCache, callback, context);
		},
		selectByAttr : function(attrName, attrValue, noCache, callback, context){
			return this.rootElement.selectByAttr(attrName, attrValue, noCache, callback, context);
		},
		console : {
			warn : function(){
				console.warn.apply(console, arguments);
			},
			error : function(){
				console.error.apply(console, arguments);
			},
		},
		__addExtraAttributes : function(dom, extraAttributes){
			dom = dom instanceof window.DocumentFragment ? dom.children[0] : dom;

			this.util.loopList(extraAttributes, function(attrValue, attrName){
				dom.dataset[attrName] = attrValue;
			}, this);
		},
		make : function(data, userData, attributes){
			var html = this.pickValue(data, userData);

			if (!html){
				this.console.error("Laya: no layout-description specified", data, userData, html);
				return null;
			}

			var dom = this.util.HTML2DOM(html, true);

			if (typeof attributes == "object"){
				this.__addExtraAttributes(dom, attributes);
			}

			this.process(dom, userData);

			// for (var a = 0, l = dom.childNodes.length; a < l; a++){
			// 	dom.replaceChild(this.process(dom.childNodes[a], userData), dom.childNodes[a]);
			// }

			if (dom instanceof window.DocumentFragment && dom.childNodes.length == 1){
				dom = dom.childNodes[0];
			}



			return dom;

		},
		process : function(dom, userData){
			if (!dom){
				return dom;
			}

			return this.processIteration(dom, userData);
		},
		processIteration : function(dom, userData){

			if (typeof dom.hasAttribute == "function" && dom.hasAttribute("laya-no-process")){
				return;
			}

			var attrs = dom.attributes;
			var valueData;
			var tagProcessor;
			var tagName = dom.tagName ? dom.tagName.toLowerCase() : null;
			var textNodeTemplateSettings;

			/*attributes processing*/
			if (attrs){
				this.util.loopArray(attrs, function(attribute, index){
					var deffered = this.attrProcessor.deffered.indexOf(attribute.name) > -1;
					if (!deffered){
						this.setAttribute(dom, attribute, userData);
					}
				}, this);

			}

			/*children iterating*/
			if (dom.childNodes){

				var children = [];
				this.util.loopArray(dom.childNodes, function(child, index){
					children[index] = child;
				}, this);


				this.util.loopArray(children, function(child, index){
					if (child.processed){
						return;
					}
					
					if (child.nodeType == 3){
						valueData = this.reachValueData(this.util.superTrim(child.nodeValue), userData);

						if (valueData.templateData){
							textNodeTemplateSettings = this.util.parseInlineTemplate(valueData.templateData);
						}

						if (valueData.value instanceof window.Node){
							dom.replaceChild(valueData.value, child);
						} else if (typeof valueData.value == "function"){
							child.processed = true;

							child.bindValue(valueData.value);

						} else {
							child.processed = true;

							if (valueData.linked){
								child.bindValue(valueData.linked, textNodeTemplateSettings);
							} else {
								child.text = this.Template.fast(valueData.value, textNodeTemplateSettings);
							}
						}

					} else if (child.nodeType == 1){
						this.processIteration(child, userData);
					}
				}, this);
			}

			/*tag processing*/
			if (tagName){
				tagProcessor = this.tagProcessor.getProcessorName(tagName);
				if (tagProcessor){
					this.tagProcessor.process(tagProcessor, dom, tagName);
				}
			}

			if (attrs){
				this.util.loopArray(attrs, function(attribute, index){
					var deffered = this.attrProcessor.deffered.indexOf(attribute.name) > -1;

					if (deffered){
						this.setAttribute(dom, attribute, userData);
					}
				}, this);
			}

			return dom;

		},
		typeof : function(data){
			if (typeof data != "string"){
				return  null;
			}

			var lead = data[0];

			if (this.commands.indexOf(lead) > -1){
				return lead;
			} else {
				return null;
			}
		},
		pickValue : function(data, userData){
			var type = this.typeof(data);

			switch(type){
				case this.LINKED_SIGN:
					return this.pickValueByLink(data.split(type)[1]);
				break;
				case this.USER_VALUE_SIGN:
					return this.pickUserValue(data.split(type)[1], userData);
				break;
				case this.LAYOUT_SIGN:
					return this.make(this.LINKED_SIGN + data.split(type)[1], userData);
				break;
				case this.STRING_SIGN:
					return data.split(type)[1];				
				break;
				default:
					return data || "";
				break;
			}
		},
		reachValueData : function(value, userData){
			var type = this.typeof(value);
			var smartType;
			var linked = null;
			var templateData = null;

			do {
				if (typeof value == "string" && value.indexOf("##") > -1){
					templateData = value.split("##")[1];
					value = value.split("##")[0];
				}

				if (type == this.LINKED_SIGN) linked = value.split(this.LINKED_SIGN)[1];
				if (type == this.STRING_SIGN) {
					value = value.split(this.STRING_SIGN)[1];
					break;
				}

				if (this.commands.indexOf(type) > -1){
					smartType = type;
				}

				value = this.pickValue(value, userData);	 				
				type = this.typeof(value);
			} while (this.commands.indexOf(type) > -1);

			return {
				type : smartType,
				value : value,
				linked : linked,
				templateData : templateData
			};

		},
		pickValueByLink : function(path){
			return this.postal.get(path);
		},
		pickUserValue : function(name, src){
			if (!name || !src){
				this.console.warn("Laya: core: user`s value is not provided for `" + name + "`", src);
				return null;
			} else {
				if (src instanceof window.Array){
					var result;

					this.util.loopArray(src, function(token, index){
						if (token && token[name]){
							result = token[name];
						}
					}, this);

					return result || "";

				} else {
					return src[name] || "";
				}
			}
		},
		setAttribute : function(element, attr, userData){
			var rawvalue;
			var _this = this;

			if (attr.processed){
				return;
			}

			if (attr.rawvalue){
				rawvalue = attr.rawvalue;
			} else {
				rawvalue = attr.value;
				rawvalue = this.Template.fast(rawvalue, userData, this.templateGetterFromUserData.bind(this));
			}

			var name  = attr.name;
			var processorName  = this.attrProcessor.getProcessorName(name);

			if (processorName){
				this.attrProcessor.process(processorName, element, rawvalue, name, userData);
			} else {
				/*picking*/
				var data = this.reachValueData(rawvalue, userData);

				element.setAttribute(name, data.value);

				if (data.type == this.LINKED_SIGN && attr._changeListener != true){
					attr._changeListener = true;
					this.postal.on(rawvalue.split(this.LINKED_SIGN)[1], "change", function(){
							attr.processed = false;
							_this.setAttribute(element, attr, userData);
					});
				}
			}

			attr.processed = true;

			return element;
		},
		templateGetterFromUserData : function(data, userData){
			return this.reachValueData(data, userData).value;
		}
	};

	for (var k in Laya.prototype){
		Laya[k] = Laya.prototype[k];
	}


	/*---------------------------------------------------------------*/
	return Laya;

});
