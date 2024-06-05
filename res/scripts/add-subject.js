var current_step = 0;
var show = [
	show_subject
]
var set = [
	set_subject
]
var data = {
	"subject": ""
}

var update_content = true;

var heading_element = null;
var description_element = null;
var content_element = null;

async function post_data(button) {
	await fetch("/subject/new", {
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
			heading_element.innerHTML = "Subject Not Added";
			description_element.innerHTML = "Failed to add the subject.";
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
			heading_element.innerHTML = "Subject Added";
			description_element.innerHTML = "Added the subject.";
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

function show_subject() {
	heading_element.innerHTML = "Subject";
	description_element.innerHTML = "Add the subject."
	content_element.innerHTML = `
		<input type="text" id="subject-input" class="input" placeholder="Subject Name">
	`;
}

function set_subject() {
	input_element = document.getElementById("subject-input");
	data["subject"] = input_element.value;
	if (!data["subject"]) {
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

