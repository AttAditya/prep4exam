var current_step = 0;
var show = [
	show_subject,
	show_chapter
]
var set = [
	set_subject,
	set_chapter
]
var data = {
	"subject": "",
	"chapter": ""
}

var update_content = true;

var heading_element = null;
var description_element = null;
var content_element = null;

async function post_data(button) {
	await fetch("/subject/chapter/new", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(data)
	}).then(req => req.text()).then(res => {
		button.classList.remove("is-loading");
		if (res == "SUCCESS") {
			button.onclick = () => {
				location.href = "/";
			}
		} else {
			heading_element.innerHTML = "Chapter Not Added";
			description_element.innerHTML = "Failed to add the chapter to the subject.";
			button.innerHTML = `
				<span class="is-size-5 is-flex is-vcentered">
					Retry
				</span>
				<div class="ml-1 icon is-flex is-vcentered is-small">
					<i class="fa-solid fa-arrow-rotate-right"></i>
				</div>
			`;
			button.classList.remove("is-success");
			button.classList.add("is-danger");
			button.onclick = () => {
				location.reload();
			}
		}
	});
}

async function next_step(button) {
	button.innerHTML = `
		<span class="is-size-5 is-flex is-vcentered">
			Next
		</span>
		<div class="ml-1 icon is-flex is-vcentered is-small">
			<i class="fa-solid fa-arrow-right"></i>
		</div>
	`;

	if (current_step && current_step <= show.length) {
		set[current_step - 1]();
	} else {
		if (!(current_step < show.length)) {
			heading_element.innerHTML = "Chapter Added";
			description_element.innerHTML = "Added the chapter to the subject.";
			content_element.innerHTML = "";
			button.innerHTML = `
				<span class="is-size-5 is-flex is-vcentered">
					Done
				</span>
				<div class="ml-1 icon is-flex is-vcentered is-small">
					<i class="fa-solid fa-check"></i>
				</div>
			`;

			button.classList.add("is-loading");
			await post_data(button);
		}
	}

	if (((show.length - current_step) > 0) && update_content) {
		show[current_step]();
	}
	
	current_step += 1;
	update_content = true;
}

async function show_subject() {
	heading_element.innerHTML = "Subject";
	description_element.innerHTML = "Select a subject to add question."
	content_element.innerHTML = `
		<div class="select">
			<select id="subject-select"></select>
		</div>
	`;
	document.getElementById("next-button").disabled = true;

	await fetch("/subject/fetch").then(req => req.json()).then(res => {
		for (let subject of res) {
			document.getElementById("subject-select").innerHTML += `
				<option value="${subject[0]}">${subject[0]} - ${subject[1]}</option>
			`;
		}
		document.getElementById("next-button").disabled = false;
	});
}

function set_subject() {
	data["subject"] = document.getElementById("subject-select").value;
}

function show_chapter() {
	heading_element.innerHTML = "Chapter";
	description_element.innerHTML = "Add the chapter."
	content_element.innerHTML = `
		<input type="text" id="chapter-input" class="input" placeholder="Chapter Name">
	`;
}

function set_chapter() {
	input_element = document.getElementById("chapter-input");
	data["chapter"] = input_element.value;
	if (!data["chapter"]) {
		current_step -= 1;
		update_content = false;
		input_element.classList.add("is-danger");
		input_element.focus();
	}
}

function load() {
	heading_element = document.getElementById("heading");
	description_element = document.getElementById("description");
	content_element = document.getElementById("data");
}

