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


	return Collection;

});