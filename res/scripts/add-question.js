var current_step = 0;
var show = [
	show_subject,
	show_chapter,
	show_question,
	show_type,
	show_options,
	show_answer,
	show_difficulty,
	show_lengthiness,
	show_image
]
var set = [
	set_subject,
	set_chapter,
	set_question,
	set_type,
	set_options,
	set_answer,
	set_difficulty,
	set_lengthiness,
	set_image
]
var data = {
	"subject": "",
	"chapter": "",
	"question": "",
	"type": "",
	"options": [],
	"answer": "",
	"difficulty": "",
	"lengthiness": "",
	"image": ""
}

var update_content = true;

var heading_element = null;
var description_element = null;
var content_element = null;

async function post_data(button) {
	await fetch("/subject/question/new", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(data)
	}).then(req => req.text()).then(res => {
		button.classList.remove("is-loading");
		if (res == "SUCCESS") {
			button.onclick = () => {
				location.reload()
				// location.href = "/";
			}
		} else {
			heading_element.innerHTML = "Question Not Added";
			description_element.innerHTML = "Failed to add the question to the subject.";
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
			heading_element.innerHTML = "Question Added";
			description_element.innerHTML = "Added the question to the subject.";
			content_element.innerHTML = "";
			button.innerHTML = `
				<span class="is-size-5 is-flex is-vcentered">
					Upload Question
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

async function show_chapter() {
	heading_element.innerHTML = "Chapter";
	description_element.innerHTML = "Select a chapter in the subject."
	content_element.innerHTML = `
		<div class="select">
			<select id="chapter-select"></select>
		</div>
	`;
	document.getElementById("next-button").disabled = true;
	
	await fetch(`/subject/${data["subject"]}/chapter/fetch`).then(req => req.json()).then(res => {
		for (let chapter of res) {
			document.getElementById("chapter-select").innerHTML += `
				<option value="${chapter[0]}">${chapter[1]}</option>
			`;
		}
		document.getElementById("next-button").disabled = false;
	});
}

function set_chapter() {
	data["chapter"] = document.getElementById("chapter-select").value;
}

function show_question() {
	heading_element.innerHTML = "Question";
	description_element.innerHTML = "Add the question."
	content_element.innerHTML = `<textarea id="question-input" class="textarea" placeholder="Question"></textarea>`;
}

function set_question() {
	input_element = document.getElementById("question-input");
	data["question"] = input_element.value;
	if (!data["question"]) {
		current_step -= 1;
		update_content = false;
		input_element.classList.add("is-danger");
		input_element.focus();
	}
}

function show_type() {
	heading_element.innerHTML = "Type";
	description_element.innerHTML = "Select the type question."
	content_element.innerHTML = `
		<div class="select">
			<select id="type-select">
				<option value="objective">Objective</option>
				<option value="subjective">Subjective</option>
			</select>
		</div>
	`;
}

function set_type() {
	data["type"] = document.getElementById("type-select").value;
	if (data["type"] == "subjective") {
		current_step += 1;
	}
}

function show_options() {
	heading_element.innerHTML = "Options";
	description_element.innerHTML = "Options for this question."
	content_element.innerHTML = `
		<input type="text" placeholder="Option A" class="input m-2" id="option-a">
		<input type="text" placeholder="Option B" class="input m-2" id="option-b">
		<input type="text" placeholder="Option C" class="input m-2" id="option-c">
		<input type="text" placeholder="Option D" class="input m-2" id="option-d">
	`;
}

function set_options() {
	input_element_a = document.getElementById("option-a");
	input_element_b = document.getElementById("option-b");
	input_element_c = document.getElementById("option-c");
	input_element_d = document.getElementById("option-d");
	data["options"][0] = input_element_a.value;
	data["options"][1] = input_element_b.value;
	data["options"][2] = input_element_c.value;
	data["options"][3] = input_element_d.value;
	if (!(data["options"][0] && data["options"][1] && data["options"][2] && data["options"][3])) {
		current_step -= 1;
		update_content = false;

		if (!data["options"][0]) {
			input_element_a.classList.add("is-danger");
			input_element_a.focus();
		} else if (input_element_a.classList.contains("is-danger")) {
			input_element_a.classList.remove("is-danger");
		}

		if (!data["options"][1]) {
			input_element_b.classList.add("is-danger");
			input_element_b.focus();
		} else if (input_element_b.classList.contains("is-danger")) {
			input_element_b.classList.remove("is-danger");
		}

		if (!data["options"][2]) {
			input_element_c.classList.add("is-danger");
			input_element_c.focus();
		} else if (input_element_c.classList.contains("is-danger")) {
			input_element_c.classList.remove("is-danger");
		}

		if (!data["options"][3]) {
			input_element_d.classList.add("is-danger");
			input_element_d.focus();
		} else if (input_element_d.classList.contains("is-danger")) {
			input_element_d.classList.remove("is-danger");
		}
	}
}

function show_answer() {
	heading_element.innerHTML = "Answer";
	description_element.innerHTML = "The correct answer to this question."
	if (data["type"] == "objective") {
		content_element.innerHTML = `
			<div class="select">
				<select id="option-select">
					<option value="A">Option A (${data["options"][0]})</option>
					<option value="B">Option B (${data["options"][1]})</option>
					<option value="C">Option C (${data["options"][2]})</option>
					<option value="D">Option D (${data["options"][3]})</option>
				</select>
			</div>
		`;
	} else {
		content_element.innerHTML = `
			<input type="text" id="answer-input" class="input" placeholder="Answer*" required>
			<div class="is-size-7">*Upto 2 decimal places only...</div>
		`;
	}
}

function set_answer() {
	if (data["type"] == "objective") {
		data["answer"] = document.getElementById("option-select").value;
	} else {
		input_element = document.getElementById("answer-input");
		data["answer"] = input_element.value;
		if (!data["answer"]) {
			current_step -= 1;
			update_content = false;
			input_element.classList.add("is-danger");
			input_element.focus();
		}
	}
}

function show_difficulty() {
	heading_element.innerHTML = "Difficulty";
	description_element.innerHTML = "Level of difficulty of question."
	content_element.innerHTML = `
		<div class="select">
			<select id="difficulty-select">
				<option value="1">Level 1 - Easy and Direct</option>
				<option value="2">Level 2 - Easy but Tricky or requires memorizing</option>
				<option value="3">Level 3 - Moderate but direct</option>
				<option value="4">Level 4 - Hard and complicated, may require tricks</option>
			</select>
		</div>
	`;
}

function set_difficulty() {
	data["difficulty"] = document.getElementById("difficulty-select").value;
}

function show_lengthiness() {
	heading_element.innerHTML = "Lengthiness";
	description_element.innerHTML = "Lengthiness of question."
	content_element.innerHTML = `
		<div class="select">
			<select id="lengthiness-select">
				<option value="1">Type I - Memory based(instant)</option>
				<option value="2">Type II - Requires basic calculation(in seconds)</option>
				<option value="3">Type III - Requires application of concept and calculation(in minutes)</option>
				<option value="4">Type IV - Multiple concepts, heavy calculation(in minutes)</option>
			</select>
		</div>
	`;
}

function set_lengthiness() {
	data["lengthiness"] = document.getElementById("lengthiness-select").value;
}

function show_image() {
	heading_element.innerHTML = "Image";
	description_element.innerHTML = "Add image to question."
	content_element.innerHTML = `
		<div class="columns">
			<div class="column is-full file is-medium is-boxed">
				<label class="file-label">
					<input class="file-input" id="image-input" type="file" accept="image/*" onchange="upload_image(this);">
					<span class="file-cta">
						<span class="file-icon">
							<i class="fas fa-upload"></i>
						</span>
						<span class="file-label" id="file-name-data">
							Choose Image
						</span>
					</span>
				</label>
			</div>
		</div>
	`;
}

function set_image() {}

async function upload_image(image_element) {
	document.getElementById("next-button").disabled = true;
	document.getElementById("file-name-data").innerHTML = image_element.files[0].name;

	let image_data = new FormData();
	image_data.append("file", image_element.files[0]);
	
	await fetch(`/image/upload`, {
		method: "POST",
		body: image_data
	}).then(req => req.json()).then(res => {
		console.log()
		if (res["status"] = "OK") {
			data["image"] = res["id"];
			document.getElementById("file-name-data").innerHTML += "(done)";
		} else {
			document.getElementById("file-name-data").innerHTML = "(failed)";
		}
		document.getElementById("next-button").disabled = false;
	});
}

function load() {
	heading_element = document.getElementById("heading");
	description_element = document.getElementById("description");
	content_element = document.getElementById("data");
}

