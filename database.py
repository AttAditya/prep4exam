from deta import Deta
from uuid import uuid4
from random import shuffle

deta = Deta()
subjects = deta.Base("Subjects")
chapters = deta.Base("Chapters")
questions = deta.Base("Questions")
results_storage = deta.Base("Results")
image_drive = deta.Drive("Images")
courses = deta.Base("Courses")

def new_subject(data: dict) -> None:
	"""
	Creates a new subject.
	"""

	subject_code = ""
	subject_code += data["subject"][0].lower()

	subject_results = subjects.fetch()
	all_subjects = subject_results.items
	while subject_results.last:
		subject_results = subjects.fetch(last=subject_results.last)
		all_subjects += subject_results.items
	
	subject_codes = [subject["key"] for subject in all_subjects]
	subject_codes = [code for code in subject_codes if code.startswith(subject_code)]
	subject_code += str(len(subject_codes))
	
	subjects.put({
		"name": data["subject"],
		"chapters": []
	}, subject_code)

	return None

def subject_list() -> list:
	"""
	Gets the list of all subjects.
	"""

	subject_results = subjects.fetch()
	all_subjects = subject_results.items
	while subject_results.last:
		subject_results = subjects.fetch(last=subject_results.last)
		all_subjects += subject_results.items
	
	subject_codes = [subject["key"] for subject in all_subjects]
	subject_names = [subject["name"] for subject in all_subjects]

	subjects_list = zip(subject_codes, subject_names)

	return [list(subject) for subject in subjects_list]

def chapter_list(subject_id) -> list:
	"""
	Gets the list of all chapters.
	"""

	chapter_results = chapters.fetch()
	all_chapters = chapter_results.items
	while chapter_results.last:
		chapter_results = chapters.fetch(last=chapter_results.last)
		all_chapters += chapter_results.items
	
	chapter_codes = [chapter["key"] for chapter in all_chapters]
	chapter_names = [chapter["name"] for chapter in all_chapters]

	chapters_list = zip(chapter_codes, chapter_names)

	return [list(c) for c in chapters_list if c[0].startswith(subject_id)]

def new_chapter(data: dict) -> None:
	"""
	Creates a new chapter.
	"""

	chapter_code = ""
	chapter_code += data["subject"]
	chapter_code += "-c"

	subject = subjects.get(data["subject"])
	chapter_code += str(len(subject["chapters"]))

	subject["chapters"].append(chapter_code)
	
	subjects.put(subject, data["subject"])
	chapters.put({
		"name": data["chapter"],
		"questions": []
	}, chapter_code)

	return None

def add_question(data: dict) -> None:
	"""
	Adds a question to a subject.
	"""

	question_code = ""
	question_code += data["chapter"]
	question_code += "-q-"
	question_code += data["type"][0].lower()

	chapter = chapters.get(data["chapter"])
	question_code += str(uuid4().hex)

	chapter["questions"].append(question_code)
	
	options = []
	answer = data["answer"]
	if data["options"]:
		options.append({
			"id": question_code + "00",
			"value": data["options"][0]
		})
		options.append({
			"id": question_code + "01",
			"value": data["options"][1]
		})
		options.append({
			"id": question_code + "02",
			"value": data["options"][2]
		})
		options.append({
			"id": question_code + "03",
			"value": data["options"][3]
		})

		answer = options["ABCD".index(data["answer"])]["id"]
	
	chapters.put(chapter, data["chapter"])
	questions.put({
		"id": question_code,
		"type": data["type"],
		"question": data["question"],
		"options": options,
		"answer": answer,
		"difficulty": int(data["difficulty"]),
		"lengthiness": int(data["lengthiness"]),
		"image": data["image"]
	}, question_code)

	return None

def get_questions_from_chapters(
		chapter_codes: list = []
	) -> list:
	"""
	Gets a set of random questions, given chapter codes
	"""

	if not chapter_codes: return []

	question_codes_list = []
	questions_list = []
	for chapter_code in chapter_codes:
		chapter = chapters.get(chapter_code)
		if not chapter: continue
		question_codes_list.extend(chapter["questions"])
	
	for question_id in question_codes_list:
		question = questions.get(question_id)
		if not question: continue
		shuffle(question["options"])
		questions_list.append({
			"id": question["id"],
			"type": question["type"],
			"question": question["question"],
			"options": question["options"],
			"image": question.get("image", "")
		})
	
	shuffle(questions_list)

	return questions_list

def get_questions(
		subject_code: str,
		chapter_codes: list,
		amount: int = 1,
		qtype: str = "",
		difficulty: int = 100,
		lengthiness: int = 100,
	) -> dict:
	"""
	Gets a set of random questions, given subject, difficulty and lengthiness
	"""

	data = {
		"subject": "",
		"questions": []
	}

	subject = subjects.get(subject_code)
	if not subject: return data

	data["subject"] = subject["name"]

	questions_list = []

	if amount < 1: return data

	final_chapter_codes = chapter_codes or subject["chapters"]
	questions_list = get_questions_from_chapters(final_chapter_codes)

	filtered_questions = []
	for question in questions_list:
		question_data = questions.get(question["id"])
		if len(filtered_questions) >= amount: break
		if question_data["difficulty"] > difficulty: continue
		if question_data["lengthiness"] > lengthiness: continue
		if qtype:
			if qtype != question["type"]: continue
		filtered_questions.append(question)
	
	data["questions"] = filtered_questions
	return data

def get_course_exam(data: list) -> list:
	"""
	Creates a course exam from template
	"""

	if not data: return []

	course_data = []
	subjects_list = []

	for mix in data:
		mix_subjects = mix[0]
		mix_chapters = mix[1]
		mix_amount = mix[2]
		mix_required = mix[3]
		mix_type = mix[4]
		mix_difficulty = mix[5]
		mix_lengthiness = mix[6]

		mix_questions = []
		mix_name = ""

		for mix_itr, mix_subject in enumerate(mix_subjects):
			mix_subject_questions = get_questions(
				mix_subject,
				mix_chapters[mix_itr],
				mix_amount,
				mix_type,
				mix_difficulty,
				mix_lengthiness
			)
			mix_questions.extend(mix_subject_questions["questions"])
			if not mix_name:
				mix_name = mix_subject_questions["subject"].split("(")[0]
		
		subjects_list.append(mix_name)
		mix_name = f"{mix_name} - Section {subjects_list.count(mix_name)}"
		
		shuffle(mix_questions)
		course_data.append({
			"subject": mix_name,
			"questions": mix_questions[:mix_amount],
			"required": mix_required
		})
	
	return course_data

def get_course_exam_no_section(data: list) -> list:
	"""
	Creates a course exam from template (only subject tabs)
	"""

	if not data: return []

	course_data = []
	subjects_list = []

	for mix in data:
		mix_subjects = mix[0]
		mix_chapters = mix[1]
		mix_amount = mix[2]
		mix_required = mix[3]
		mix_type = mix[4]
		mix_difficulty = mix[5]
		mix_lengthiness = mix[6]

		mix_questions = []
		mix_name = ""

		for mix_itr, mix_subject in enumerate(mix_subjects):
			mix_subject_questions = get_questions(
				mix_subject,
				mix_chapters[mix_itr],
				mix_amount,
				mix_type,
				mix_difficulty,
				mix_lengthiness
			)
			mix_questions.extend(mix_subject_questions["questions"])
			if not mix_name:
				mix_name = mix_subject_questions["subject"].split("(")[0]

		if mix_name not in subjects_list:
			subjects_list.append(mix_name)
			course_data.append({
				"subject": mix_name,
				"sub-sections": []
			})
		
		mix_name_index = subjects_list.index(mix_name)
		shuffle(mix_questions)
		course_data[mix_name_index]["sub-sections"].append({
			"questions": mix_questions[:mix_amount],
			"required": mix_required
		})
	
	return course_data

def get_course_exam_single(data: list) -> list:
	"""
	Creates a course exam from template (no tabs)
	"""

	if not data: return []

	course_data = []
	subjects_list = []

	for mix in data:
		mix_subjects = mix[0]
		mix_chapters = mix[1]
		mix_amount = mix[2]
		mix_required = mix[3]
		mix_type = mix[4]
		mix_difficulty = mix[5]
		mix_lengthiness = mix[6]

		mix_questions = []
		mix_name = "all"

		for mix_itr, mix_subject in enumerate(mix_subjects):
			mix_subject_questions = get_questions(
				mix_subject,
				mix_chapters[mix_itr],
				mix_amount,
				mix_type,
				mix_difficulty,
				mix_lengthiness
			)
			mix_questions.extend(mix_subject_questions["questions"])

		if mix_name not in subjects_list:
			subjects_list.append(mix_name)
			course_data.append({
				"subject": mix_name,
				"sub-sections": []
			})
		
		mix_name_index = subjects_list.index(mix_name)
		shuffle(mix_questions)
		course_data[mix_name_index]["sub-sections"].append({
			"questions": mix_questions[:mix_amount],
			"required": mix_required
		})
	
	return course_data

def check_questions(response_data: list = []) -> list:
	"""
	Check questions if correct or not
	"""

	if not response_data: return []

	results_data = []

	for question_id in response_data:
		question = response_data[question_id]
		
		question.update({
			"id": question_id,
			"correct": False
		})

		if not question["answered"]:
			results_data.append(question)
			continue

		question_data = questions.get(question_id)
		if question["type"] == "objective":
			if question["value"] == question_data["answer"]:
				question["correct"] = True
			
			results_data.append(question)
			continue
			
		try:
			flt_val_given = int(float(question["value"]) * 100) / 100
		except:
			results_data.append(question)
			continue
		
		try:
			flt_val_ans = int(float(question_data["answer"]) * 100) / 100
		except:
			question["correct"] = True
			results_data.append(question)
			continue

		if flt_val_ans == flt_val_given:
			question["correct"] = True
		
		results_data.append(question)
		continue

	return results_data

def analyse_results(results_data: list) -> dict:
	"""
	Analysis of results
	"""

	if not results_data: return {}
	
	tally_data = {}
	overall = {
		"attempted": 0,
		"unattempted": 0,
		"correct": 0,
		"incorrect": 0
	}

	for question in results_data:
		subject = question["id"].split("-")[0]
		
		if subject not in tally_data:
			tally_data[subject] = {
				"objective": {
					"attempted": 0,
					"unattempted": 0,
					"correct": 0,
					"incorrect": 0
				},
				"subjective": {
					"attempted": 0,
					"unattempted": 0,
					"correct": 0,
					"incorrect": 0
				}
			}
		
		tally_data[subject][question["type"]]["attempted"] += int(question["answered"])
		tally_data[subject][question["type"]]["unattempted"] += 1 - int(question["answered"])
		tally_data[subject][question["type"]]["correct"] += int(question["correct"])
		tally_data[subject][question["type"]]["incorrect"] += 1 - int(question["correct"])
	
		tally_attempted = tally_data[subject][question["type"]]["attempted"]
		tally_data[subject][question["type"]]["incorrect"] *= int(bool(tally_attempted))

		overall["attempted"] += int(question["answered"])
		overall["unattempted"] += 1 - int(question["answered"])
		overall["correct"] += int(question["correct"])
		overall["incorrect"] += 1 - int(question["correct"])

		overall_attempted = overall["attempted"]
		overall["incorrect"] *= int(bool(overall_attempted))

	analysed_data = {}
	analysed_data.update(tally_data)
	
	for subject_code in analysed_data:
		subject = analysed_data[subject_code]

		objective_data = subject["objective"]
		correct = objective_data["correct"]
		attempted = objective_data["attempted"] if objective_data["attempted"] else 1
		objective_data["accuracy"] = 100 * correct / attempted

		subjective_data = subject["subjective"]
		correct = subjective_data["correct"]
		attempted = subjective_data["attempted"] if subjective_data["attempted"] else 1
		subjective_data["accuracy"] = 100 * correct / attempted

		subject_data = subjects.get(subject_code)
		
		subject_name = subject_code
		if subject_data:
			subject_name = subject_data["name"]

		analysed_data[subject_code] = {
			"name": subject_name,
			"objective": objective_data,
			"subjective": subjective_data
		}
	
	correct = overall["correct"]
	attempted = overall["attempted"] if overall["attempted"] else 1
	overall["accuracy"] = 100 * correct / attempted

	analysed_data = {
		"overall": overall,
		"individual": analysed_data
	}

	return analysed_data

