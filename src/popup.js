document.getElementById('rnBttn').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentUrl = tabs[0].url;
      
        // Check if the URL is a chess.com game
        if (currentUrl.startsWith("https://www.chess.com/game/live/")) {

            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: function() {
                    var met = document.querySelector('meta[property="og:image"]');
                    return met.content;
                }            
            }, function(result) {
                var username = result[0].result.split("/").slice(-2)[0];
                let pgn = findGame(username, currentUrl);

            });
        }

        else {
            alert("Not a valid chess.com game page.")
        }
    });
});

function findGame(username, currentUrl) {
    const date = new Date();
    let [m, y] = [date.getMonth() + 1, date.getFullYear()];
    //API expects YYYY/MM format
    m = m < 10 ? '0' + m : '' + m;
    let apiUrl = `https://api.chess.com/pub/player/${username}/games/${y}/${m}`;
    console.log(apiUrl);
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const games = data.games;
            const selectedGame = games.find(game => game.url === currentUrl);
            if (selectedGame != null) {
                console.log(selectedGame.pgn);
                openLichess(selectedGame.pgn);
                return selectedGame.pgn;
            }            
        });  
}

function openLichess(pgn) {
    fetch('https://lichess.org/api/import', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            pgn: pgn
        })
    })
    .then(response => {
        console.log(response.status);
        return response.json();
    })
    .then(data => {
        console.log(data.url);
        chrome.tabs.create({ url: data.url });
    })
}
  
