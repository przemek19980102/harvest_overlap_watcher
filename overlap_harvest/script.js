var lastNodeChange = new Date().getTime();

var todayTasks = [];
var currentStart = 0;
var currentEnd = 0;

var dialogVisible = false;

var NOT_EXISTING_TIME = 2500;

function nodeInsertedCallback(event) {
	let now = new Date().getTime();
	if(now - lastNodeChange >= 500) {
		lastNodeChange = now;
		notifyDomChanged();
	}
};

document.addEventListener('DOMSubtreeModified', nodeInsertedCallback);
notifyDomChanged();

function notifyDomChanged() {
	setTimeout(function() {
		parseCurrentDayTimesheet();
		lookForInputDialog();
	}, 500);
}

function parseCurrentDayTimesheet() {
	if(dialogVisible) return;
	todayTasks.splice(0, todayTasks.length);

	var x = document.getElementsByClassName("entry-timestamps");
	var output = ""
	for(var i = 0; i < x.length; i++){
		var children = x[i].childNodes;
		var hours = [];
		for(var j = 0; j < children.length; j++) {
				if(children[j]) {
					if(children[j].textContent.trim().length > 0) hours.push(children[j].textContent.trim());
				}
		}
		if(hours.length == 2) {
			todayTasks.push(new Task(parseStringToIntTime(hours[0]), parseStringToIntTime(hours[1]), false));
		} else if(hours.length == 1) {
			todayTasks.push(new Task(parseStringToIntTime(hours[0]), NOT_EXISTING_TIME, true));
		}
	}
}

function lookForInputDialog() {
	isErrorVisible = false;
	var x = document.getElementById("modal-time-entry-title");
	if(x) {
		dialogVisible = true;
		var startInput = document.querySelector("input.hui-input.js-started-at");
		var endInput = document.querySelector("input.hui-input.js-ended-at");
		if(startInput && endInput) {
			var event = new Event('input', {
		    'bubbles': true,
		    'cancelable': true
			});

			startInput.addEventListener('input', function (evt) {
				currentStart = parseStringToIntTime(this.value);
				checkOverlapsWithTodayTasks();
			});
			startInput.dispatchEvent(event);

			endInput.addEventListener('input', function (evt) {
				 currentEnd = parseStringToIntTime(this.value);
				 checkOverlapsWithTodayTasks();
			});
			endInput.dispatchEvent(event);

			removeCurrentlyEditedTaskFromList(parseStringToIntTime(startInput.value), parseStringToIntTime(endInput.value));
		}

		var inputLayout = document.querySelector("#modal-time-entry-title");
		var errorLayout = document.querySelector("#myErrorView");
		if(inputLayout && !errorLayout) {
			inputLayout.innerHTML += '<span style="height:50px;color:white;display:none;background-color:RED;padding:8px;margin-bottom:8px;" id="myErrorView"><b>Entry is probably overlapped</b> with another one!</span>';
		}
	} else {
		dialogVisible = false;
	}
}

function removeCurrentlyEditedTaskFromList(startTime, endTime) {
		for(var i = todayTasks.length-1; i >= 0; i--) {
			if(todayTasks[i].start === startTime && todayTasks[i].end === endTime) {
					todayTasks.splice(i, 1);
			}
		}
}

function parseStringToIntTime(input) {
	var result = parseInt(input.split(':').join(''));
	if(isNaN(result)) result = NOT_EXISTING_TIME;
	return result;
}

function checkOverlapsWithTodayTasks() {
	if(isUserInputADuration() || isUserInputATimer()) {
		for(var i = 0; i < todayTasks.length; i++) {
			if(isUserInputATimer()) {
				if(todayTasks[i].areOverlapping(currentStart, NOT_EXISTING_TIME) && currentStart != NOT_EXISTING_TIME) {
					showTimerOverlappingError();
					return;
				}
			} else {
				if(todayTasks[i].areOverlapping(currentStart, currentEnd)) {
					showOverlappingError();
					return;
				}
			}
		}
	} else {
		showIllegalInputError();
		return;
	}
	hideError();
}

function isUserInputATimer() {
	return currentStart > 0 && currentEnd == NOT_EXISTING_TIME
}

function isUserInputADuration() {
	return currentStart <= currentEnd && currentStart != NOT_EXISTING_TIME && currentEnd != NOT_EXISTING_TIME
}

function hideError() {
	var view = document.getElementById("myErrorView");
	if(view) {
		if(view.style.display != "none") {
			view.style.display = "none";
		}
	}
}

function showOverlappingError() {
	showErrorText("<u>Entry is probably overlapped</u> with something!");
}

function showTimerOverlappingError() {
	showErrorText("<u>Timer is probably overlapping</u> with something!");
}

function showIllegalInputError() {
	showErrorText("<u>Start Time</u> and <u>End Time</u> are probably <u>incorrect</u>!");
}

function showErrorText(text) {
	var view = document.getElementById("myErrorView");
	if(view) {
		if(view.innerHTML != text) view.innerHTML = text;
		if(view.style.display != "block") {
			view.style.display = "block";
		}
	}
}

function Task(start, end, isTimer) {
	this.start = start;
	this.end = end;
	this.isTimer = isTimer;

	this.areOverlapping = function(startTime, endTime) {
		if(this.isTimer) {
			if(startTime >= this.start) return true;
			if(endTime > this.start) return true;
		} else {
			if(startTime < this.start && endTime <= this.start) return false;
			if(startTime <= this.start && endTime >= this.start) return true;
			if(startTime >= this.start && startTime < this.end) return true;
			if(startTime < this.end && endTime >= this.end) return true;
			if(startTime >= this.end && endTime > this.end) return false;
			if(startTime <= this.start && endTime >= this.end) return true;
		}
		return false;
	}
}
