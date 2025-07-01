import json

data = json.load(open(r"C:\Users\ABC\OneDrive\ytmusic_ext4\SAVED_ACTUAL_STORAGE_BROKENBYNEWSIDEBAR.json"))

mfId_to_id = {}

for i,v in data["grabbedFromLocal"]["cache"].items():
	if (v.get("mfId")): mfId_to_id[v["mfId"]] = i

new_paper_item_order = []

for item in data["grabbedFromSync"]["sidebar"]["paperItemOrder"]:
	if (mfId_to_id.get(item)):
		item = mfId_to_id[item]

	elif (item.startswith("PL") or item == "LM" or item == "SS"):
		item = "VL" + item

	elif (not item.startswith("C")):
		print("what is", item)
		continue
	
	new_paper_item_order.append(item)

data["grabbedFromSync"]["sidebar"]["paperItemOrder"] = new_paper_item_order

for folder in data["grabbedFromSync"]["sidebar"]["folders"]["folders"].values():
	newContents = []

	for item in folder["contents"]:
		if (mfId_to_id.get(item)):
			item = mfId_to_id[item]

		elif (item.startswith("PL") or item == "LM" or item == "SS"):
			item = "VL" + item

		elif (not item.startswith("C")):
			print("what is", item)
			continue
	
		newContents.append(item)
	
	folder["contents"] = newContents

#print(json.dumps(data, indent=True))

json.dump(data, open("DUMP.json","w"))