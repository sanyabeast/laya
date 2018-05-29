"use strict";
define(function(){

	/*-------*/
	var ProcessedSVG = function(img, util){
		this.waitForCache = this.waitForCache.bind(this);
		this._src = img.src;
		this.util = util;
		this.node = img;
		this.src = img.src;

		this.__currentTimeout = 2000;
		this.__broken = false;
	};

	ProcessedSVG.responseCache = {};

	ProcessedSVG.prototype = {
		waitForCache : function(){
			this.src = this._src;
		},

		set src(src){

			if (this.__broken){
				return;
			}

			this._src = src;

		    if (ProcessedSVG.responseCache[src]){
		    	if (ProcessedSVG.responseCache[src] === true){
		    		setTimeout(this.waitForCache, this.__currentTimeout);
		    		this.__currentTimeout *= 2;
		    	} else {
		    		this.processResponse(ProcessedSVG.responseCache[src], src);
		    	}
		    } else {
		    	ProcessedSVG.responseCache[src] = true;
		    	var xhr = new XMLHttpRequest();
			    xhr.open("GET", src, true);
			    xhr.onreadystatechange = function(){
			    	if (xhr.readyState != 4){
			    		return;
			    	}

			    	var text = xhr.responseText;

			    	this.processResponse(text, src);

			    }.bind(this);

			    xhr.send();
		    }		    
		},
		get src(){
			return this._src;
		},
		processResponse : function(text, src){
			var parser = new DOMParser();
	        var xmlDoc = parser.parseFromString(text, "text/xml");

	        // Get the SVG tag, ignore the rest
	        var svg = xmlDoc.getElementsByTagName('svg')[0];

	        if (!(svg instanceof window.Node)){
	        	console.warn("There are some troubles with loading svg-image: " + src);
	        	this.__broken = true;
	        	return;
	        }

	        ProcessedSVG.responseCache[src] = text;

	        // Remove any invalid XML tags as per http://validator.w3.org
	        svg.removeAttribute('xmlns:a');

	        svg.select("title", true, function(node){
	        	node.text = "";
	        	node.remove();
	        });

	        // Check if the viewport is set, if the viewport is not set the SVG wont't scale.
	        if(!svg.getAttribute('viewBox') && svg.getAttribute('height') && svg.getAttribute('width')) {
	            svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'))
	        }

	        if (this.node.hasAttribute("id")){
	        	svg.setAttribute("id", this.node.getAttribute("id"));
	        }

	        if (this.node.hasAttribute("class")){
	        	svg.setAttribute("class", this.node.getAttribute("class"));
	        }

	        svg.setAttribute("src", src);

	        svg.wrapper = this;

	        // this.util.copyAttrs(this.node, svg);


	        svg.setAttribute("laya-no-process", "");

	        if (this.node.parentNode){
	        	this.node.parentNode.replaceChild(svg, this.node);
	        }

	        this.node = svg;
		}
	};

	ProcessedSVG.process = function (img){
		return new ProcessedSVG(img, this).node;


	    var imgID = img.id;
	    var imgClass = img.className;
	    var imgURL = img.src;

	    var xhr = new XMLHttpRequest();
	    xhr.open("GET", imgURL, true);
	    xhr.onreadystatechange = function(){
	    	if (xhr.readyState != 4){
	    		return;
	    	}

	    	var text = xhr.responseText;

	    	var parser = new DOMParser();
	        var xmlDoc = parser.parseFromString(text, "text/xml");

	        // Get the SVG tag, ignore the rest
	        var svg = xmlDoc.getElementsByTagName('svg')[0];

	        // Add replaced image's ID to the new SVG
	        if(typeof imgID !== 'undefined') {
	            svg.setAttribute('id', imgID);
	        }
	        // Add replaced image's classes to the new SVG
	        if(typeof imgClass !== 'undefined') {
	            svg.setAttribute('class', imgClass+' replaced-svg');
	        }

	        // Remove any invalid XML tags as per http://validator.w3.org
	        svg.removeAttribute('xmlns:a');

	        // Check if the viewport is set, if the viewport is not set the SVG wont't scale.
	        if(!svg.getAttribute('viewBox') && svg.getAttribute('height') && svg.getAttribute('width')) {
	            svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'))
	        }

	        svg.setAttribute("src", imgURL);

	        // Replace image with new SVG
	        img.parentNode.replaceChild(svg, img);
	    };

	    xhr.send();

	};

	return ProcessedSVG;

});