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
            findGame(username, currentUrl)
                .then(pgn => {
                    if (pgn) {
                        openLichess(pgn);
                    }
                    else {
                        alert("Couldn't find game!");
                    }
                })
        });
    }
    else {
        alert("Not a valid chess.com game page.")
    }
});

async function findGame(username, currentUrl) {
    const date = new Date();
    let [m, y] = [date.getMonth() + 1, date.getFullYear()];
    let attempts = 0;
    
    while (attempts < 24) {
        console.log(attempts);
        //API expects YYYY/MM format
        const apiUrl = `https://api.chess.com/pub/player/${username}/games/${y}/${m < 10 ? '0' + m : m}`;
        console.log(apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        const games = data.games;
        const selectedGame = games.find(game => game.url === currentUrl);
        
        if (selectedGame) {
            return selectedGame.pgn;
        }

        // Decrement month and year
        m--;
        if (m === 0) {
            m = 12;
            y--;
        }
        
        attempts++;
    }
    
    console.log('Reached maximum number of attempts');
    return null;
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
  
