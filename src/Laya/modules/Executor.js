"use string";
define(function(){

	var Executor = function(laya){
		this.laya = laya;
	};

	Executor.prototype = {
		exec : function(token, data){
			var result = token;
			token = token.replace(">", "");

			if (data.length){
				data = data[data.length - 1];
			}

			try {
				result = eval(token);
			} catch (err){
				this.laya.console.warn("failed to execute token", token);
			}

			return result;
		}
	};

	return Executor;

});