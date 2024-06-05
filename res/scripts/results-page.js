var data = {};

function performance_graph(dataset, container_id) {
	new ApexCharts(document.querySelector(`#${container_id}`), {
		chart: {
			type: 'donut'
		},
		series: [
			dataset["correct"],
			dataset["incorrect"],
			dataset["unattempted"]
		],
		labels: [
			"Correct",
			"Incorrect",
			"Not Attempted"
		],
		colors:[
			"hsl(141, 71%, 48%)",
			"hsl(348, 100%, 61%)",
			"hsl(48, 100%, 67%)"
		],
		dataLabels: {
			enabled: true,
			formatter: function (percentage) {
				let total_questions = dataset["correct"] + dataset["incorrect"] + dataset["unattempted"];
				let weight = percentage / 100;
				let questions_count = Math.round(total_questions * weight)
				return `${questions_count} Questions`;
			}
		}
	}).render();
}

function accuracy_graph(dataset, container_id) {
	new ApexCharts(document.querySelector(`#${container_id}`), {
		chart: {
			type: 'donut'
		},
		series: [
			dataset["accuracy"],
			100 - dataset["accuracy"],
		],
		labels: [
			"Accuracy",
			""
		],
		colors:[
			"hsl(141, 71%, 48%)",
			"hsl(348, 100%, 61%)",
		],
		dataLabels: {
			enabled: true,
			formatter: function (percentage) {
				return `${percentage} %`;
			}
		}
	}).render();
}

async function get_analytics(result_id) {
	let loading_screen = document.getElementById("loading-screen");

	if (!loading_screen.classList.contains("is-active")) {
		loading_screen.classList.add("is-active");
	}

	await fetch(`/result/fetch/${result_id}`).then(req => req.json()).then(res => {
		data = res;
		loading_screen.classList.remove("is-active");
		performance_graph(data["data"]["value"]["overall"], "overall-performance");
		accuracy_graph(data["data"]["value"]["overall"], "overall-accuracy");

		let subjects_performance_container = document.getElementById("subjects-performance-container");
		let subjects_accuracy_container = document.getElementById("subjects-accuracy-container");
		for (let subject_id in data["data"]["value"]["individual"]) {
			let subject = data["data"]["value"]["individual"][subject_id];

			let subject_name_id = subject["name"].replaceAll("(", "-");
			subject_name_id = subject_name_id.replaceAll(")", "-");

			subjects_performance_container.innerHTML += `
				<div class="column is-half">
					<h2 class="is-size-5">
						${subject["name"]} - Objective
					</h2>
					<div id="performance-${subject_name_id}-objective"></div>
				</div>
				<div class="column is-half">
					<h2 class="is-size-5">
						${subject["name"]} - Subjective
					</h2>
					<div id="performance-${subject_name_id}-subjective"></div>
				</div>
			`;

			subjects_accuracy_container.innerHTML += `
				<div class="column is-half">
					<h2 class="is-size-5">
						${subject["name"]} - Objective
					</h2>
					<div id="accuracy-${subject_name_id}-objective"></div>
				</div>
				<div class="column is-half">
					<h2 class="is-size-5">
						${subject["name"]} - Subjective
					</h2>
					<div id="accuracy-${subject_name_id}-subjective"></div>
				</div>
			`;
		}

		for (let subject_id in data["data"]["value"]["individual"]) {
			let subject = data["data"]["value"]["individual"][subject_id];

			let subject_name_id = subject["name"].replaceAll("(", "-");
			subject_name_id = subject_name_id.replaceAll(")", "-");

			performance_graph(subject["objective"], `performance-${subject_name_id}-objective`);
			performance_graph(subject["subjective"], `performance-${subject_name_id}-subjective`);
			
			accuracy_graph(subject["objective"], `accuracy-${subject_name_id}-objective`);
			accuracy_graph(subject["subjective"], `accuracy-${subject_name_id}-subjective`);
		}
	});
}

async function load(result_id) {
	await get_analytics(result_id);
}

