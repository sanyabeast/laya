"use strict";
define(function(){

	var laya;

	var Laya = function(Laya, AttrProcessor, CSS, Template, Util, Wrappers, TagProcessor){
		if (laya){
			return laya;
		}

		laya = this;

		this.Laya = Laya;
		this.AttrProcessor = AttrProcessor;
		this.CSS = CSS;
		this.Template = Template;
		this.Util = Util;
		this.Wrappers = Wrappers;
		this.TagProcessor = TagProcessor;
	};

	Laya.prototype = {
		setBase : function(base){
			this.base = base;
			this.init();
		},
		init : function(){
			this.util = new this.Util(this);
			this.util.patchNative();
			this.wrappers = new this.Wrappers(this);
			this.css = new this.CSS(this);
			this.attrProcessor = new this.AttrProcessor(this);
			this.tagProcessor = new this.TagProcessor(this);

			console.log(this);

			this._attrTplGetter = this._attrTplGetter.bind(this);
		},
		commands : ["#", "~", "@"],
		_rootElement : document,
		get rootElement(){
			return this._rootElement;
		},
		set rootElement(selector){
			this._rootElement = document.querySelector(selector);
		},
		select : function(selector, noCache, callback, context){
			this.rootElement.select(selector, noCache, callback, context);
		},
		console : {
			warn : function(){
				console.warn.apply(console, arguments);
			},
			error : function(){
				console.error.apply(console, arguments);
			},
		},
		make : function(data, userData){
			var html = this.pickValue(data);
			var dom = this.util.HTML2DOM(html);

			for (var a = 0, l = dom.childNodes.length; a < l; a++){
				dom.replaceChild(this.process(dom.childNodes[a], userData), dom.childNodes[a]);
			}

			if (dom.childNodes.length == 1){
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
			var attrs = dom.attributes;
			var name;
			var text;
			var type;
			var linked = false;
			var tagProcessor;
			var tagName = dom.tagName ? dom.tagName.toLowerCase() : null;

			/*attributes processing*/
			if (attrs){
				for (var a = 0, l = attrs.length; a < l; a++){
					this.setAttribute(dom, attrs[a], userData);
				}
			}

			/*children iterating*/
			if (dom.childNodes){

				for (var b = 0, children = []; b < dom.childNodes.length; b++){
					children[b] = dom.childNodes[b];
				}

				for (var a = 0; a < children.length; a++){
					if (children[a].nodeType == 3){
						text = this.util.superTrim(children[a].nodeValue);

						type = this.typeof(text);

						do {
							text = this.pickValue(text, userData);
							type = this.typeof(text);
							if (type == "~"){
								linked = text;
							}

						} while (this.commands.indexOf(type) > -1)

						if (text instanceof window.Node){
							dom.replaceChild(text, children[a]);
						} else {
							children[a].nodeValue = text;
							if (linked){
								base.on(linked.split("~")[1], "change", this._onTextNodeValueChanged.bind(children[a]))
							}
						}

					} else if (children[a].nodeType == 1){
						this.processIteration(children[a], userData);
					}

				}
			}

			/*tag processing*/
			if (tagName){
				tagProcessor = this.tagProcessor.getProcessorName(tagName);
				if (tagProcessor){
					this.tagProcessor.process(tagProcessor, dom, tagName);
				}
			}

			return dom;

		},
		typeof : function(data){
			if (typeof data != "string"){
				return  data;
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
				case "~":
					return this.pickValueByLink(data.split(type)[1]);
				break;
				case "@":
					return this.pickUserValue(data.split(type)[1], userData);
				break;
				case "#":
					return this.make("~" + data.split(type)[1], userData);
				break;
				default:
					//this.console.warn("Raw value alert", data, userData);
					return data;
				break;
			}
		},
		pickValueByLink : function(path){
			return this.base.get(path);
		},
		pickUserValue : function(name, src){
			if (!name || !src){
				this.console.warn("User`s value is not provided for `" + name + "`", src);
				return null;
			}

			return src[name];
		},
		setAttribute : function(element, attr, userData){
			var rawvalue;
			var _this = this;

			if (attr.rawvalue){
				rawvalue = attr.rawvalue;
			} else {
				rawvalue = attr.value;
				rawvalue = this.Template.fast(rawvalue, userData, this._attrTplGetter);
			}

			var value = this.pickValue(rawvalue, userData);

			var name  = attr.name;
			var type  = this.typeof(rawvalue);
			var processorName  = this.attrProcessor.getProcessorName(name);

			if (processorName){
				this.attrProcessor.process(processorName, element, value, name);
			} else {
				element.setAttribute(name, value);
			}

			if (type == "~" && attr._changeListener != true){
				attr._changeListener = true;
				base.on(rawvalue.split("~")[1], "change", this.setAttribute.bind(this, element, attr, userData));
			}
		},
		_attrTplGetter : function(data, userData){
			var type = this.typeof(data);
			var result = data;

			do {
				result = this.pickValue(result, userData);
				type = this.typeof(result);
			} while (this.commands.indexOf(type) > -1)

			return result;;

		},
		_onTextNodeValueChanged : function(value){
			this.nodeValue = value;
		}
	};

	Object.assign(Laya, Laya.prototype);

	/*---------------------------------------------------------------*/
	return Laya;

});
