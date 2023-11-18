const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
	isFullScreen: () => { return ipcRenderer.invoke("isFullScreen"); },
	startAuth: () => { ipcRenderer.send("start-auth"); },
	getToken: () => { return ipcRenderer.invoke("get-token"); },
	clearToken: () => { return ipcRenderer.send("clear-token"); },
	getNowPlaying: () => { return ipcRenderer.invoke("get-nowPlaying"); },
	setBackgroundImage: (src) => { ipcRenderer.send("set-backgroundImage", src); },
	getBackgroundImage: () => { return ipcRenderer.invoke("get-backgroundImage"); },
	showNotification: () => { ipcRenderer.send("show-notification"); }
});