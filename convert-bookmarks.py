import pprint
import bookmarks_parser
import json
import sys

if (len(sys.argv) != 2):
    print("Usage: python extract-bookmarks.py bookmarks.html")
    sys.exit(1)

bookmarks = bookmarks_parser.parse(sys.argv[1])

bookmarks_json = json.dumps(bookmarks)

with open("bookmarks/bookmarks.json", "w", encoding="utf8") as f:
    f.write(bookmarks_json)
    f.close()
