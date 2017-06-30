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
		"Player",
		"../res/index"
	], function(base, laya, Player, resData){
		window.base = base;
		window.laya = laya;
		window.player = new Player(resData);
	});

})();