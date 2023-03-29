var ChessWebAPI = require('chess-web-api');

var chessAPI = new ChessWebAPI();

chessAPI.getGameByID()
chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    let game_id = url.split("/").pop();
    console.log(game_id);
});