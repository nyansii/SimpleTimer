const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const Store = require('electron-store');

app.setName("Simple Timer");
app.setAppUserModelId(app.name);

let win;

module.exports = { win };

function createWindow() {
	win = new BrowserWindow({
		width: 1280,
		height: 1000,
		frame: true,
		autoHideMenuBar: true,
		toolbar: false,
		maximizable: false,
		minimizable: false,
		resizable: false,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			preload: __dirname + "/preload.js",
			devTools: false
		}
	});

	win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.handle("isFullScreen", () => {
	return win.isFullScreen();
});

const url = require("url");
const { clientId, clientSecret, accessUrl, redirectUri } = require("./spotify.js");

function createAuthWindow() {
	authWindow = new BrowserWindow({
		width: 600,
		height: 800,
		autoHideMenuBar: true,
		toolbar: false,
		show: false,
		webPreferences: {
			nodeIntegration: false,
			devTools: false
		}
	});

	authWindow.webContents.on("will-redirect", (event, newUrl) => {
		try {
			if (!newUrl.toString().includes(redirectUri)) return;

			var parsedUrl = url.parse(newUrl);
			var query = parsedUrl.query.toString();
			if (!query.includes("code=")) return;
			var result = "";
			query.split("&").forEach((e) => {
				if (e.includes("code=")) {
					result = e.replace("code=", "");
				}
			});

			if (result != "") {
				getFirstAccessTokenToSpotify(result);
				authWindow.destroy();
			}
		} catch {
			return;
		}
	});

	authWindow.loadURL(accessUrl);
	authWindow.show();

	authWindow.on("closed", () => {
		authWindow = null;
	});
}

ipcMain.on("start-auth", () => {
	createAuthWindow();
});

ipcMain.handle("get-token", () => {
	return loadConfig("spotify-token");
});

ipcMain.on("clear-token", () => {
	saveConfig("spotify-token", "");
});

ipcMain.on("set-backgroundImage", (event, src) => {
	saveConfig("background-image", src);
});

ipcMain.handle("get-backgroundImage", () => {
	return loadConfig("background-image");
});

ipcMain.handle("get-nowPlaying", () => {
	return getNowPlaying(loadConfig("spotify-token"));
});

ipcMain.on("show-notification", () => {
	const title = 'Simple Timer Notification'
	const body = 'The timer has expired.'

	new Notification({
		title: title,
		body: body
	}).show()
});

function getNowPlaying(access_token) {
	if (access_token == "") return null;

	const payload = {
		"headers": { "Authorization": "Bearer " + access_token },
		"muteHttpExceptions": true // 401エラーへの対応のため
	};

	let status;

	return fetch("https://api.spotify.com/v1/me/player/currently-playing", payload)
		.then(result => {
			status = result.status;
			return result.json();
		})
		.then(data => {
			switch (status) {
				case 200:
					return {
						playingInfo: getArtistAndSongString(data),
						playingImage: getSongImage(data),
						playingTime: getPlayingTime(data),
						isPlaying: getIsPlaying(data)
					}
				case 204:
					return null;
				case 401:
					refreshAccessTokenToSpotify();
					return getNowPlaying(access_token);
				default:
				// 実行されない想定
			}
		});
}

function getArtistAndSongString(response) {
	const artist = response.item.artists[0].name;
	const song = response.item.name;
	return artist + " : " + song;
}

function getSongImage(response) {
	const imageUrl = response.item.album.images[0].url;
	return imageUrl;
}

function getPlayingTime(response) {
	const duration = response.item.duration_ms / 1000;
	const progress = response.progress_ms / 1000;
	if (Math.floor(progress % 60) > 9) var zero = "";
	else var zero = "0";
	const progressString = Math.floor(progress % 3600 / 60) + ":" + zero + Math.floor(progress % 60);
	if (Math.floor(duration % 60) > 9) var zero = "";
	else var zero = "0";
	const durationString = Math.floor(duration % 3600 / 60) + ":" + zero + Math.floor(duration % 60);
	return progressString + " / " + durationString;
}

function getIsPlaying(response) {
	return response.is_playing;
}

function getFirstAccessTokenToSpotify(authorization_code) {
	const payload = {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			"Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
		},
		body: "grant_type=authorization_code&code=" + authorization_code + "&redirect_uri=" + redirectUri
	};

	fetch("https://accounts.spotify.com/api/token", payload)
		.then(result => result.json()
			.then(data => {
				saveConfig("spotify-token", data.access_token);
				saveConfig("spotify-refresh-token", data.refresh_token);
			}));
}

function refreshAccessTokenToSpotify() {
	const payload = {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			"Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
		},
		body: "grant_type=refresh_token&refresh_token=" + loadConfig("spotify-refresh-token") + "&client_id=" + clientId
	};

	fetch("https://accounts.spotify.com/api/token", payload)
		.then(result => result.json()
			.then(data => {
				saveConfig("spotify-token", data.access_token);
				if (data.refresh_token)
					saveConfig("spotify-refresh-token", data.refresh_token);
			}));
}

const store = new Store({
	cwd: app.getPath('userData'),
	name: 'config'
});

function saveConfig(key, value) {
	store.set(key, value);
}

function loadConfig(key) {
	return store.get(key, "");
}