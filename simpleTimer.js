const date = document.getElementById("date");
const timer = document.getElementById("timer");
const clock = document.getElementById("clock-image");

var timerCount = 0;
var isPopupClicked = false;
var isTimerEnabled = false;

window.api.getBackgroundImage().then(function (result) {
	var image = document.getElementById("clock-image");
	if (result == "") {
		image.src = "";
		clock.style.visibility = "hidden";
	} else {
		image.src = result;
		clock.style.visibility = "visible";
	}
});

document.getElementById("spotify-login").addEventListener("click", () => {
	window.api.startAuth();
});

document.getElementById("spotify-logout").addEventListener("click", () => {
	window.api.clearToken();
	update();
});

setInterval(update, 1000);
update();

function toggleLogin(token) {
	window.api.isFullScreen().then(function (result) {
		if (result) {
			document.getElementById("spotify-login").style.visibility = "hidden";
			document.getElementById("spotify-logout").style.visibility = "hidden";
		} else {
			if (token == "") {
				document.getElementById("spotify-login").style.visibility = "visible";
				document.getElementById("spotify-logout").style.visibility = "hidden";
			} else {
				document.getElementById("spotify-login").style.visibility = "hidden";
				document.getElementById("spotify-logout").style.visibility = "visible";
			}
		}
	});
}

function update() {
	window.api.getNowPlaying().then(function (result) {
		if (result) {
			document.getElementById("spotify").style.visibility = "visible";
			document.getElementById("nowPlayingInfo").textContent = result.playingInfo;
			document.getElementById("nowPlayingSpotify-image").src = result.playingImage;
			document.getElementById("nowPlayingTime").textContent = result.playingTime;
			if (result.isPlaying) {
				document.getElementById("nowPlayingPause").style.visibility = "hidden";
			} else {
				document.getElementById("nowPlayingPause").style.visibility = "visible";
			}
		} else {
			document.getElementById("spotify").style.visibility = "hidden";
			document.getElementById("nowPlayingInfo").textContent = "";
			document.getElementById("nowPlayingSpotify-image").src = "";
			document.getElementById("nowPlayingTime").textContent = "";
			document.getElementById("nowPlayingPause").style.visibility = "hidden";
		}
	});

	window.api.getToken().then(function (result) {
		toggleLogin(result);
	});

	window.api.isFullScreen().then(function (result) {
		if (result) {
			document.getElementById("left-buttons").style.visibility = "hidden";
			document.getElementById("right-buttons").style.visibility = "hidden";
			document.getElementById("timer-cancel").style.visibility = "hidden";
		} else {
			document.getElementById("left-buttons").style.visibility = "visible";
			document.getElementById("right-buttons").style.visibility = "visible";
			if (isTimerEnabled) document.getElementById("timer-cancel").style.visibility = "visible";
			else document.getElementById("timer-cancel").style.visibility = "hidden";
		}
	});

	var now = new Date();
	var YYYY = now.getFullYear();
	var MM = now.getMonth() + 1;
	var DD = now.getDate();
	var hours = now.getHours();
	var minutes = now.getMinutes();
	var seconds = now.getSeconds();

	date.textContent = YYYY + "/" + MM + "/" + DD;

	if (!isTimerEnabled) {
		if (hours > 9) var hZero = "";
		else var hZero = "0";
		if (minutes > 9) var mZero = "";
		else var mZero = "0";
		if (seconds > 9) var sZero = "";
		else var sZero = "0";
		timer.textContent = hZero + hours + ":" + mZero + minutes + ":" + sZero + seconds;
	}
	else {
		var h = Math.floor(timerCount / 3600);
		var m = Math.floor(timerCount % 3600 / 60);
		var s = Math.floor(timerCount % 60);
		if (h > 9) var hZero = "";
		else var hZero = "0";
		if (m > 9) var mZero = "";
		else var mZero = "0";
		if (s > 9) var sZero = "";
		else var sZero = "0";
		timer.textContent = hZero + h + ":" + mZero + m + ":" + sZero + s;
	}

	if (isTimerEnabled) {
		timerCount--;
		if (timerCount <= -1) {
			new Audio("./assets/win/audio/endTimer.mp3").play();
			isTimerEnabled = false;
			window.api.showNotification();
			update();
		}
	} else {
		document.getElementById("timer-cancel").style.visibility = "hidden";
	}
}

document.getElementById("input-file").addEventListener("change", (event) => {
	const file = event.target.files[0];

	if (!file) return;

	const reader = new FileReader();

	reader.onload = (event) => {
		var image = document.getElementById("clock-image");
		image.src = event.target.result;
		window.api.setBackgroundImage(event.target.result);
		image.style.visibility = "visible";
	}

	reader.readAsDataURL(file);
});

document.getElementById("timer-button").addEventListener("click", (event) => {
	document.getElementById("popup").style.visibility = "visible";
});

document.getElementById("popup-back").addEventListener("click", (event) => {
	isPopupClicked = true;
});

document.getElementById("popup").addEventListener("click", (event) => {
	if (!isPopupClicked)
		document.getElementById("popup").style.visibility = "hidden";

	isPopupClicked = false;
});

document.getElementById("popup-close").addEventListener("click", (event) => {
	document.getElementById("popup").style.visibility = "hidden";
});

document.getElementById("popup-button").addEventListener("click", (event) => {
	new Audio("./assets/win/audio/startTimer.mp3").play();
	var value = document.getElementById("time").value;
	timerCount = 0;
	var times = value.split(":");
	timerCount += times[0] * 3600;
	timerCount += times[1] * 60;
	isTimerEnabled = true;
	update();
	document.getElementById("popup").style.visibility = "hidden";
	document.getElementById("timer-cancel").style.visibility = "visible";
});

document.getElementById("timer-cancel").addEventListener("click", (event) => {
	new Audio("./assets/win/audio/endTimer.mp3").play();
	isTimerEnabled = false;
	update();
});