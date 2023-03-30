chrome.action.onClicked.addListener(async function(tab) {
    const currentUrl = tab.url;
    // Check if the URL is a chess.com game
    if (currentUrl.startsWith("https://www.chess.com/game/live/")) {
        chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
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
                    } else {
                        console.error(`Couldn't find game!`);
                    }
                })
        });
    } else {
        console.error(`Couldn't find game!`);
    }
});

async function getDate(gameID) {
    try {
        const url = `https://www.chess.com/callback/live/game/${gameID}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.game.pgnHeaders.Date;
    } catch (error) {
        console.error(`Error fetching date for game ${gameID}: ${error}`);
        return null;
    }
}

async function findGame(username, currentUrl) {
    const gameID = currentUrl.split("/").pop();

    const dateStr = await getDate(gameID);
    const [y, m] = dateStr.split(".").slice(0, 2);

    const apiUrl = `https://api.chess.com/pub/player/${username}/games/${y}/${m}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    const selectedGame = data.games.find(game => game.url === currentUrl);
    if (selectedGame) {
        return selectedGame.pgn;
    }
    return null;
}

function openLichess(pgn) {
    fetch('https://lichess.org/api/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
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

