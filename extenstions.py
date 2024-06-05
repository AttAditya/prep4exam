import os

def f(filename: str = None, **changes) -> str:
	"""
	Read the content of a file
	"""
	
	if not filename: return ""
	if not os.path.isfile(filename): return ""

	content: str = ""
	with open(filename, "r") as file:
		content: str = file.read()
		file.close()

		for change in changes:
			updated_change = "[[" + str(change).replace("_", "-") + "]]"
			content = content.replace(updated_change, str(changes[change]))
		
		return content
	
