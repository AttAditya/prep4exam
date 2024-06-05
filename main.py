from extenstions import f
from flask import Flask, request, jsonify, send_file
from database import (
	image_drive,
	results_storage,
	courses,
	uuid4,
	new_subject,
	subject_list,
	chapter_list,
	new_chapter,
	add_question,
	get_course_exam,
	check_questions,
	analyse_results
)
from logging import getLogger, ERROR
from io import BytesIO

getLogger("werkzeug").setLevel(ERROR)

app = Flask(
	"P4E",
	static_folder="res",
	static_url_path="/res"
)

def common_elements() -> dict:
	"""
	Common elements in most of the pages.
	"""

	return {
		"meta": f("web/common/meta.html"),
		"navbar": f("web/common/navbar.html"),
		"footer": f("web/common/footer.html")
	}

@app.route("/")
def home():
	return f("web/index.html", **common_elements())

@app.route("/exam/<course>")
def course_exam(course: str):
	course_data = {
		"course": course,
		"token": f"temp-{uuid4().hex}",
		"hours": 0,
		"minutes": 0,
		"seconds": 0
	}

	if course_details := courses.get(course):
		course_data["hours"] = course_details["hours"]
		course_data["minutes"] = course_details["minutes"]
		course_data["seconds"] = course_details["seconds"]

	return f(f"web/templates/exam.html", **common_elements(), **course_data)

@app.route("/exam/submit", methods=["POST"])
def exam_submit():
	answers_data = request.json
	temp = False

	if answers_data["token"].startswith("temp"):
		temp = True
	
	result_id = "r-"
	if temp:
		result_id += "temp--"
	result_id += uuid4().hex

	results_data = check_questions(answers_data["responses"])
	results_storage.put({
		"value": results_data
	}, result_id, expire_in=24*60*60)

	return jsonify({
		"status": 200,
		"result-id": result_id,
		"can-expire": True
	})

@app.route("/result/<result_id>")
def result_page(result_id: str):
	result_data = results_storage.get(result_id)
	if not result_data:
		return "405 - restricted access"

	return f("web/utilities/results.html", **common_elements(), result_id=result_id)

@app.route("/result/fetch/<result_id>")
def result_fetch(result_id: str):
	result_data = results_storage.get(result_id)
	if not result_data:
		return jsonify({
			"result-id": result_id,
			"status": 405
		})

	result_data["value"] = analyse_results(result_data["value"])
	return jsonify({
		"result_id": result_id,
		"status": 200,
		"data": result_data
	})

@app.route("/course/new", methods=["GET", "POST"])
def course_new():
	if request.method == "GET":
		return f("web/utilities/add-course.html", **common_elements())
	
	data = request.json
	new_subject(data)
	return "SUCCESS"

@app.route("/subject/new", methods=["GET", "POST"])
def subject_new():
	if request.method == "GET":
		return f("web/utilities/add-subject.html", **common_elements())
	
	data = request.json
	new_subject(data)
	return "SUCCESS"

@app.route("/subject/fetch")
def subject_fetch():
	return jsonify(subject_list())

@app.route("/subject/<subject_id>/chapter/fetch")
def chapter_fetch(subject_id: str):
	return jsonify(chapter_list(subject_id))

@app.route("/subject/chapter/new", methods=["GET", "POST"])
def add_subject_chapter():
	if request.method == "GET":
		return f("web/utilities/add-chapter.html", **common_elements())
	
	data = request.json
	new_chapter(data)
	return "SUCCESS"

@app.route("/subject/question/new", methods=["GET", "POST"])
def add_subject_question():
	if request.method == "GET":
		return f("web/utilities/add-question.html", **common_elements())
	
	data = request.json
	add_question(data)
	return "SUCCESS"

courses.put({
	"hours": 1,
	"minutes": 0,
	"seconds": 0,
	"content": [
		{
			"subjects": ["g0"],
			"chapters": [[]],
			"amount": 60,
			"required": 50,
			"type": "objective",
			"difficulty": 100,
			"lengthiness": 100
		}
	]
}, "cuet-ug-gt")

@app.route("/course/fetch/<course>")
def fetch_course(course: str):
	if course_details := courses.get(course):
		data = []
		for section in course_details["content"]:
			data.append([
				section["subjects"],
				section["chapters"],
				section["amount"],
				section["required"],
				section["type"],
				section["difficulty"],
				section["lengthiness"]
			])
		return jsonify(get_course_exam(data))

	raw_lines = f(f"res/courses/{course}.csv").split("\n")
	raw_data = []

	for raw_line in raw_lines:
		raw_contents = raw_line.split(",")
		raw_data.append([
			raw_contents[0].split("+"),
			[
				[
					c for c in ch.split("+") if c
				] for ch in raw_contents[1].split("&")
			],
			int(raw_contents[2]),
			int(raw_contents[3]),
			raw_contents[4],
			int(raw_contents[5]),
			int(raw_contents[6]),
		])
	
	data = jsonify(get_course_exam(raw_data))
	return data

@app.route("/image/upload", methods=["POST"])
def image_upload():
	if "file" not in request.files:
		return jsonify({
			"status": 403,
			"id": ""
		})
	
	image_file = request.files["file"]
	image_id = f"i{uuid4()}_{image_file.filename}"
	image_drive.put(image_id, image_file.stream)
	
	return jsonify({
		"status": 200,
		"id": image_id
	})

@app.route("/image/<image_id>")
def image_get(image_id: str):
	image_file = image_drive.get(image_id)

	if image_file != None:
		return send_file(
			BytesIO(image_file.read()),
			download_name=image_id
		)
	
	return "Not Found"

@app.route("/sponsors")
def sponsors_page():
	return f("/web/pages/sponsors.html")

@app.route("/sponsors-image")
def sponsors_image():
	image = "/sponsors"
	return "..."

if __name__ == "__main__":
	app.run(
		host="0.0.0.0",
		port=8000
	)

