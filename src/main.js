!(function(){

	requirejs.config({
		baseUrl : "src",
		paths : {
			"base" : "../node_modules/basejs/base",
			"file" : "../node_modules/requirejs-text/text",
		}
	});

	requirejs([
		"base", 
		"Laya/Laya",
		"App",
		"../res/index"
	], function(base, laya, App, resData){
		window.base = base;
		window.laya = laya;
		window.app = new App(resData);
	});

})();