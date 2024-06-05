var course_data = []

async function load_subs(el_id) {
	await fetch("/subject/fetch").then(req => req.json()).then(res => {
		for (let subject of res) {
			document.getElementById(el_id).innerHTML += `
				<option value="${subject[0]}" id="${el_id}-${subject[0]}">${subject[0]} - ${subject[1]}</option>
			`;
		}
	});
}

async function load_chs(el_id, sub) {
	await fetch(`/subject/${sub}/chapter/fetch`).then(req => req.json()).then(res => {
		document.getElementById(el_id).innerHTML = "";
		for (let subject of res) {
			document.getElementById(el_id).innerHTML += `
				<option value="${subject[0]}" id="${el_id}-${subject[0]}">${subject[1]}</option>
			`;
		}
		document.getElementById(el_id).innerHTML += `
			<option>Any/All</option>
		`;
	});
}

function add_sub() {
	let mod_sel = document.getElementById("mode-select");
	let sub_sel = document.getElementById("subject-select");

	course_data.push({
		id: sub_sel.value,
		mode: mod_sel.value,
		chapters: [],
		additional_data: {
			title: document.getElementById(`subject-select-${sub_sel.value}`).innerText,
			ch_titles: []
		}
	});

	load_course_box();
}

async function load_course_box() {
	let sub_con = document.getElementById("subject-selection");
	sub_con.innerHTML = "";

	for (let section_id in course_data) {
		section = course_data[section_id];
		sub_con.innerHTML += `
			<div class="notification m-2 p-2 content has-text-black">
				<h1 class="title is-size-2">
					${section.additional_data.title}
				</h1>
				<h2 class="subtitle is-size-4 has-text-grey is-capitalized">
					${section.mode}
				</h2>
				<h3 class="is-size-4">
					Chapters(If none selected, any/all chapters considered)
				</h3>
				<div id="${section_id}-ch"></div>
				<div class="field has-addons has-addons-centered">
					<div class="control">
						<div class="select">
							<select id="chapter-${section_id}-select"></select>
						</div>
					</div>
					<div class="control">
						<button class="button is-link" onclick="add_ch(${section_id});">
							<i class="fa-solid fa-plus"></i>
							<span class="ml-2">
								Add Chapter
							</span>
						</button>
					</div>
				</div>
			</div>
		`;

		for (let chapter_id in section.chapters) {
			document.getElementById(`${section_id}-ch`).innerHTML = `
				<div class="box m-2 p-2">
					${section.additional_data.ch_titles[chapter_id]}
				</div>
			`;
		}

		await load_chs(`chapter-${section_id}-select`, section.id);
	}
}

function add_ch(sec_id) {
	let chapter_id = document.getElementById(`chapter-${sec_id}-select`).value;
	course_data[sec_id].chapters.push(chapter_id);
	course_data[sec_id].additional_data.ch_titles.push(document.getElementById(`chapter-${sec_id}-select-${chapter_id}`).innerText);

	load_course_box();
}

async function create_course() {
	subjects_id = []
	chapters_id = []
	course_data.forEach(section => { subjects_id.push(section.id) });
	course_data.forEach(section => { chapters_id.push(section.chapters) });

	await fetch("/course/new", {
		method: "POST",
		headers: {
			ContentType: "application/json"
		},
		body: JSON.stringify({
			name: document.getElementById("course-name"),
			hours: document.getElementById("course-hours"),
			minutes: document.getElementById("course-minutes"),
			seconds: document.getElementById("course-seconds"),
			content: [
				{
					subjects: subjects_id,
					chapters: chapter_id,
					amount: 60,
					required: 50,
					type: "objective",
					difficulty: 100,
					lengthiness: 100
				}
			]
		})
	});
}

