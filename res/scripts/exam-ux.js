var token = "anonymous"

var q_index = 0;
var tab_index = 0;

var total_questions = 0;
var tolal_tabs = 0;

var current_question = {};
var current_response = {};

var responses = {};
var questions_data = [];

var objective_layout = `
	<div class="field">
		<span class="column is-full p-2">
			<input class="is-checkradio mr-2" type="radio" name="answer" id="answer-a-trigger" value="a" onclick="update_answer(this);">
			<label for="answer-a-trigger" class="column is-full" id="answer-a">Option A</label>
		</span>
		<span class="column is-full p-2">
			<input class="is-checkradio mr-2" type="radio" name="answer" id="answer-b-trigger" value="b" onclick="update_answer(this);">
			<label for="answer-b-trigger" class="column is-full" id="answer-b">Option B</label>
		</span>
		<span class="column is-full p-2">
			<input class="is-checkradio mr-2" type="radio" name="answer" id="answer-c-trigger" value="c" onclick="update_answer(this);">
			<label for="answer-c-trigger" class="column is-full" id="answer-c">Option C</label>
		</span>
		<span class="column is-full p-2">
			<input class="is-checkradio mr-2" type="radio" name="answer" id="answer-d-trigger" value="d" onclick="update_answer(this);">
			<label for="answer-d-trigger" class="column is-full" id="answer-d">Option D</label>
		</span>
	</div>
`;
var subjective_layout = `
	<input class="input" type="text" id="answer-i" value="" onchange="update_answer(this);" onkeypress="this.onchange();" onpaste="this.onchange();" oninput="this.onchange();">
	<div class="column is-12-mobile is-6 columns is-multiline box m-0 my-2 p-2 buttons are-small is-2 is-variable is-gapless is-flex">
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">1</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">2</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">3</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">4</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">5</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">6</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">7</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">8</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">9</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">-</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">0</div>
		<div onclick="type_in_answer(this);" class="column is-4-mobile is-4 button m-0 p-0">.</div>
		<div onclick="type_in_answer(this);" class="column is-6-mobile is-6 button m-0 p-0">Clear</div>
		<div onclick="type_in_answer(this);" class="column is-6-mobile is-6 button m-0 p-0">Backspace</div>
	</div>
`;

function clear_objective() {
	document.getElementsByName("answer").forEach(ans => {ans.checked = false});
	current_response["value"] = "";
	current_response["answered"] = false;
	responses[current_question["id"]] = current_response;

	load_buttons();
}

function clear_subjective() {
	document.getElementById("answer-i").value = "";
	current_response["value"] = "";
	current_response["answered"] = false;
	responses[current_question["id"]] = current_response;

	load_buttons();
}

function clear_response() {
	if (current_question["type"] == "objective") {
		clear_objective();
	} else {
		clear_subjective();
	}
}

function type_in_answer(key) {
	let answer_element = document.getElementById("answer-i");
	if ("1234567890".includes(key.innerHTML)) {
		if (answer_element.value == "0") {
			answer_element.value = "";
		}
		answer_element.value += key.innerHTML;
	} else if (key.innerHTML == "Backspace") {
		answer_element.value = answer_element.value.slice(0, answer_element.value.length - 1);
	} else if (key.innerHTML == ".") {
		if (!answer_element.value.includes(".")) {
			answer_element.value += key.innerHTML;
		}
	} else if (key.innerHTML == "-") {
		if (!answer_element.value.startsWith("-")) {
			if (answer_element.value != "0") {
				answer_element.value = key.innerHTML + answer_element.value;
			}
		} else {
			answer_element.value = answer_element.value.slice(1, answer_element.value.length);
		}
	}
	answer_element.onchange();
	if (key.innerHTML == "Clear" || !answer_element.value) {
		clear_subjective();
	}

	load_buttons();
}

function get_attempt_data() {
	let not_seen = 0;
	let not_attempted = 0;
	let attempted = 0;
	let marked = 0;
	let marked_answered = 0;

	for (let __tab in questions_data) {
		for (let button in questions_data[__tab]["questions"]) {
			let button_response_data = responses[questions_data[__tab]["questions"][button]["id"]];

			if (questions_data[__tab]["questions"][button]["id"] in responses) {
				if (button_response_data["seen"]) {
					if (button_response_data["marked"]) {
						if (button_response_data["answered"]) {
							marked_answered = marked_answered + 1;
							attempted = attempted + 1;
						} else {
							marked = marked + 1;
						}
					} else {
						if (button_response_data["answered"]) {
							attempted = attempted + 1;
						} else {
							not_attempted = not_attempted + 1;
						}
					}
				} else {
					not_seen = not_seen + 1;
				}
			} else {
				not_seen = not_seen + 1;
			}
		}
	}

	return {
		"not_seen": not_seen,
		"not_attempted": not_attempted,
		"attempted": attempted,
		"marked": marked,
		"marked_answered": marked_answered
	}
}

function render_question() {
	let question_number_element = document.getElementById("question-number");
	let question_element = document.getElementById("question");
	let answer_element = document.getElementById("answer");
	let mark_button = document.getElementById("mark-button");

	question_number_element.innerHTML = q_index + 1;
	question_element.innerHTML = current_question["question"];

	for (let not_hidden_image of document.getElementsByClassName("is-not-hidden")) {
		not_hidden_image.classList.add("is-hidden");
		not_hidden_image.classList.remove("is-not-hidden");
	}

	if (!!current_question["image"]) {
		document.getElementById(`question-image-${tab_index}-${q_index}`).classList.remove("is-hidden");
		document.getElementById(`question-image-${tab_index}-${q_index}`).classList.add("is-not-hidden");
	}

	if (current_question["type"] == "objective") {
		answer_element.innerHTML = objective_layout;
		document.getElementById("answer-a").innerHTML = current_question["options"][0]["value"];
		document.getElementById("answer-b").innerHTML = current_question["options"][1]["value"];
		document.getElementById("answer-c").innerHTML = current_question["options"][2]["value"];
		document.getElementById("answer-d").innerHTML = current_question["options"][3]["value"];

		document.getElementById("answer-a-trigger").disabled = false;
		document.getElementById("answer-b-trigger").disabled = false;
		document.getElementById("answer-c-trigger").disabled = false;
		document.getElementById("answer-d-trigger").disabled = false;
		
		if (current_response["answered"]) {
			answer_index = current_question["options"].map(option => option.id).indexOf(current_response["value"]);
			document.getElementById(`answer-${"abcd"[answer_index]}-trigger`).checked = true;
		} else {
			if (get_attempt_data().attempted >= questions_data[tab_index].required) {
				document.getElementById("answer-a-trigger").disabled = true;
				document.getElementById("answer-b-trigger").disabled = true;
				document.getElementById("answer-c-trigger").disabled = true;
				document.getElementById("answer-d-trigger").disabled = true;
			}
		}
	} else {
		answer_element.innerHTML = subjective_layout;
		document.getElementById("answer-i").value = current_response["value"];
	}

	if (current_response["marked"]) {
		mark_button.innerHTML = "Marked for Review";
	} else {
		mark_button.innerHTML = "Mark for Review";
	}

	current_response["seen"] = true;
	responses[current_question["id"]] = current_response;

	load_buttons();
}

function mark_for_review() {
	current_response["marked"] = !current_response["marked"];
	responses[current_question["id"]] = current_response;

	render_question();
	load_buttons();
}

function update_answer(option) {
	if (get_attempt_data().attempted < questions_data[tab_index].required) {
		current_response["answered"] = true;
		
		if (current_question["type"] == "objective") {
			option_index = "abcd".indexOf(option.value);
			current_response["value"] = current_question["options"][option_index]["id"];
		} else {
			current_response["value"] = option.value;
		}
		
		responses[current_question["id"]] = current_response;
	}

	load_buttons();
}

function load_question_data() {
	current_question = questions_data[tab_index]["questions"][q_index];
	current_response = {
		"seen": true,
		"answered": false,
		"marked": false,
		"type": current_question["type"],
		"value": ""
	}

	if (current_question["id"] in responses) {
		current_response = responses[current_question["id"]];
	}
}

function load_question_images() {
	let images_container = document.getElementById("questions-images");

	for (let __tab in questions_data) {
		for (let question_index in questions_data[__tab]["questions"]) {
			if (!!!questions_data[__tab]["questions"][question_index]["image"]) {
				images_container.innerHTML += `<img src="/image/${questions_data[__tab]["questions"][question_index]["image"]}" id="question-image-${__tab}-${question_index}" class="is-hidden" />`;
			}
		}
	}
}

function next_question() {
	if (current_question["id"]) {
		responses[current_question["id"]] = current_response;
	}
	
	document.getElementById(`tab-${tab_index + 1}`).classList.remove("is-success");
	q_index += 1;
	if (q_index >= total_questions) {
		q_index = 0;
		tab_index += 1;
		if (tab_index >= tolal_tabs) {
			tab_index = 0;
		}
	}
	document.getElementById(`tab-${tab_index + 1}`).classList.add("is-success");

	load_question_data();
	render_question();
}

function prev_question() {
	if (current_question["id"]) {
		responses[current_question["id"]] = current_response;
	}
	
	document.getElementById(`tab-${tab_index + 1}`).classList.remove("is-success");
	q_index -= 1;
	if (q_index < 0) {
		q_index = total_questions - 1;
		tab_index -= 1;
		if (tab_index < 0) {
			tab_index = tolal_tabs - 1;
		}
	}
	document.getElementById(`tab-${tab_index + 1}`).classList.add("is-success");

	load_question_data();
	render_question();
}

function load_tabs() {
	let tabs_element = document.getElementById("tabs");
	tolal_tabs = questions_data.length;

	for (let tab in questions_data) {
		tabs_element.innerHTML += `<button id="tab-${Number(tab) + 1}" onclick="change_tab(this);" class="button ml-0 mb-1 mr-2">${questions_data[tab]["subject"]}</button>`;
	}

	tab_index = 0;
	q_index = 0;

	document.getElementById(`tab-${tab_index + 1}`).classList.add("is-success");

	load_buttons();
	load_question_data();
	render_question();
}

function change_tab(tab) {
	document.getElementById(`tab-${tab_index + 1}`).classList.remove("is-success");
	tab_index = Number(tab.id.slice(-1)) - 1;
	document.getElementById(`tab-${tab_index + 1}`).classList.add("is-success");
	q_index = 0;

	load_buttons();
	load_question_data();
	render_question();
}

function load_buttons() {
	let buttons_element = document.getElementById("questions-buttons");
	buttons_element.innerHTML = "";
	total_questions = questions_data[tab_index]["questions"].length;

	for (let button in questions_data[tab_index]["questions"]) {
		let button_id = `t${Number(tab_index) + 1}-q${Number(button) + 1}`
		buttons_element.innerHTML += `<button onclick="change_question(this);" class="button p-3 m-0 mt-2 mr-2" id="${button_id}">${Number(button) + 1}</button>`;
		let button_element = document.getElementById(button_id);

		if (questions_data[tab_index]["questions"][button]["id"] in responses) {
			let button_response_data = responses[questions_data[tab_index]["questions"][button]["id"]];
			
			if (button_response_data["seen"]) {
				if (button_response_data["marked"]) {
					if (button_response_data["answered"]) {
						button_element.classList.add("is-info");
					} else {
						button_element.classList.add("is-warning");
					}
				} else {
					if (button_response_data["answered"]) {
						button_element.classList.add("is-success");
					} else {
						button_element.classList.add("is-danger");
					}
				}
			}
		}
		
		if (button_element.innerHTML.length < 2) {
			button_element.innerHTML = "0" + button_element.innerHTML;
		}
	}

	let count_1 = document.getElementById("count-1");
	let count_2 = document.getElementById("count-2");
	let count_3 = document.getElementById("count-3");
	let count_4 = document.getElementById("count-4");
	let count_5 = document.getElementById("count-5");

	let attempt_data = get_attempt_data();
	
	count_1.innerHTML = String(attempt_data.not_seen);
	count_2.innerHTML = String(attempt_data.not_attempted);
	count_3.innerHTML = String(attempt_data.attempted);
	count_4.innerHTML = String(attempt_data.marked);
	count_5.innerHTML = String(attempt_data.marked_answered);

	if (count_1.innerHTML.length < 2) {
		count_1.innerHTML = "0" + count_1.innerHTML;
	}
	if (count_2.innerHTML.length < 2) {
		count_2.innerHTML = "0" + count_2.innerHTML;
	}
	if (count_3.innerHTML.length < 2) {
		count_3.innerHTML = "0" + count_3.innerHTML;
	}
	if (count_4.innerHTML.length < 2) {
		count_4.innerHTML = "0" + count_4.innerHTML;
	}
	if (count_5.innerHTML.length < 2) {
		count_5.innerHTML = "0" + count_5.innerHTML;
	}

	if (attempt_data.attempted < questions_data[tab_index].required) {
		if (!document.getElementById("max-attempt-warn").classList.contains("is-hidden")) {
			document.getElementById("max-attempt-warn").classList.add("is-hidden");
		}
	} else {
		if (document.getElementById("max-attempt-warn").classList.contains("is-hidden")) {
			document.getElementById("max-attempt-warn").classList.remove("is-hidden");
		}
	}
}

function change_question(question_button) {
	q_index = Number(question_button.id.split("q")[1]) - 1;

	load_question_data();
	render_question();
	load_buttons();
}

async function load(course, utoken="", hours, minutes, seconds) {
	let screen = document.getElementById("loading-screen");

	if (!screen.classList.contains("is-active")) {
		screen.classList.add("is-active");
	}

	await fetch(`/course/fetch/${course}`).then(req => req.json()).then(res => {
		questions_data = res;
		load_tabs();
		screen.classList.remove("is-active");
		start_timer(Number(hours), Number(minutes), Number(seconds), times_up);
	});

	if (!!utoken) {
		token = utoken;
	}
}

var timer_interval = null;
var stop_timer = false;

var timer_data_hours = 0;
var timer_data_minutes = 0;
var timer_data_seconds = 0;

function times_up() {
	let screen = document.getElementById("loading-screen");
	let screen_content = document.getElementById("loading-screen-data");

	screen_content.innerHTML = `
		Time's Up!
	`;
	
	if (!screen.classList.contains("is-active")) {
		screen.classList.add("is-active");
	}

	window.setTimeout(submit_response, 5000);
}

function submit_screen() {
	let screen = document.getElementById("loading-screen");
	let screen_content = document.getElementById("loading-screen-data");

	screen_content.innerHTML = `
		Submit?
		<br>
		<button class="button is-success" onclick="submit_response();">
			Submit
		</button>
		<button class="button is-danger" onclick="resume_test();">
			Cancel
		</button>
	`;
	
	if (!screen.classList.contains("is-active")) {
		screen.classList.add("is-active");
	}
}

function resume_test() {
	let screen = document.getElementById("loading-screen");
	if (screen.classList.contains("is-active")) {
		screen.classList.remove("is-active");
	}
}

async function submit_response() {
	let screen = document.getElementById("loading-screen");
	let screen_content = document.getElementById("loading-screen-data");

	screen_content.innerHTML = `
		Submitting...
	`;
	
	if (!screen.classList.contains("is-active")) {
		screen.classList.add("is-active");
	}

	stop_timer = true;

	for (let __tab of questions_data) {
		for (let question of __tab["questions"]) {
			if (!(question["id"] in responses)) {
				responses[question["id"]] = {
					"seen": false,
					"answered": false,
					"marked": false,
					"type": current_question["type"],
					"value": ""
				}
			}
		}
	}

	await fetch(`/exam/submit`, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			"token": token,
			"responses": responses
		})
	}).then(req => req.json()).then(res => {
		if (res["status"] == 200) {
			screen_content.innerHTML = `
				Submitted <i class="fa-solid fa-check"></i>
				<br>
				<a href="/result/${res["result-id"]}">
					<button class="button is-success m-2">
						Results Page
					</button>
				</a>
			`;
		}
	});
}

function show_timer() {
	timer_element = document.getElementById("time-left");

	timer_element.innerHTML = "";
	timer_element.innerHTML += String(timer_data_hours);
	timer_element.innerHTML += ":";
	
	if (String(timer_data_minutes).length < 2) {
		timer_element.innerHTML += "0";
	}
	
	timer_element.innerHTML += String(timer_data_minutes);
	timer_element.innerHTML += ":";
	
	if (String(timer_data_seconds).length < 2) {
		timer_element.innerHTML += "0";
	}
	
	timer_element.innerHTML += String(timer_data_seconds);
}

function start_timer(hours, minutes, seconds, on_end) {
	timer_data_hours = hours;
	timer_data_minutes = minutes;
	timer_data_seconds = seconds;

	show_timer();

	var timer_interval = window.setInterval(() => {
		if (!(timer_data_hours + timer_data_minutes + timer_data_seconds)) {
			on_end();
			stop_timer = true;
		}
		
		if (!!stop_timer) {
			window.clearInterval(timer_interval);
		}

		timer_data_seconds -= 1;
		if (timer_data_seconds < 0) {
			timer_data_seconds = 59;
			timer_data_minutes -= 1;

			if (timer_data_minutes < 0) {
				timer_data_minutes = 59;
				timer_data_hours -= 1;

				if (timer_data_hours < 0) {
					timer_data_hours = 0;
					timer_data_minutes = 0;
					timer_data_seconds = 0;
				}
			}
		}

		show_timer();
	}, 1000);
}

