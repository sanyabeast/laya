"use strict";
define(function(){

	var Laya = function(Laya, AttrProcessor, CSS, Template, Util, Wrappers){
		this.Laya = Laya;
		this.AttrProcessor = AttrProcessor;
		this.CSS = CSS;
		this.Template = Template;
		this.Util = Util;
		this.Wrappers = Wrappers;
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
			this.attributesProcessors = new this.AttrProcessor(this);
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
			var html = this.getValue(data);
			var dom = this.util.HTML2DOM(html);

			for (var a = 0, l = dom.childNodes.length; a < l; a++){
				dom.replaceChild(this.fill(dom.childNodes[a], userData), dom.childNodes[a]);
			}

			if (dom.childNodes.length == 1){
				dom = dom.childNodes[0];
			}

			return dom;

		},
		fill : function(dom, userData){
			if (!dom){
				return dom;
			}

			return this.fillStep(dom, userData);
		},
		fillStep : function(dom, userData){
			var attrs = dom.attributes;
			var name;
			var text;
			var type;
			var linked = false;

			if (attrs){
				for (var a = 0, l = attrs.length; a < l; a++){
					this.setAttribute(dom, attrs[a], userData);
				}
			}


			if (dom.childNodes){

				for (var b = 0, children = []; b < dom.childNodes.length; b++){
					children[b] = dom.childNodes[b];
				}

				for (var a = 0; a < children.length; a++){
					if (children[a].nodeType == 3){
						text = this.util.superTrim(children[a].nodeValue);

						type = this.valueType(text);

						do {
							text = this.getValue(text, userData);
							type = this.valueType(text);
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
						this.fillStep(children[a], userData);
					}
					
				}
			}

			return dom;

		},
		valueType : function(data){
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
		getValue : function(data, userData){
			var type = this.valueType(data);

			switch(type){
				case "~":
					return this.getValueByLink(data.split(type)[1]);
				break;
				case "@":
					return this.getUsrValue(data.split(type)[1], userData);
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
		getValueByLink : function(path){
			return this.base.get(path);
		},
		getUsrValue : function(name, src){
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

			var value = this.getValue(rawvalue, userData);
			var name  = attr.name;
			var type  = this.valueType(rawvalue);

			if (this.attributesProcessors[name]){
				this.attributesProcessors[name].call(this, element, value);
			} else {
				element.setAttribute(name, value);				
			}

			if (type == "~" && attr._changeListener != true){
				attr._changeListener = true;
				base.on(rawvalue.split("~")[1], "change", this.setAttribute.bind(this, element, attr, userData));
			}
		},
		_attrTplGetter : function(data, userData){
			var type = this.valueType(data);
			var result = data;

			do {
				result = this.getValue(result, userData);
				type = this.valueType(result);
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