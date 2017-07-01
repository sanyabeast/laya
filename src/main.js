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
		"examples/Player",
		"examples/Match3",
		"../res/index"
	], function(base, laya, Player, Match3, resData){
		window.base = base;
		window.laya = laya;
		//window.player = new Player(resData);
		window.match3 = new Match3(resData);
	});

})();
