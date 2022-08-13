import os
from pathlib import Path
from os import listdir
from os.path import isfile, join
import time
import mysql.connector
import shutil

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  password="",
  database="mainwiki3"
)

mycursor = mydb.cursor()

exclude = set(['.git', 'app'])
wiki_folder = "wiki"

print("Starting...")

def createFolderTree(wiki_folder):
    tree = {}
    count = 0
    for root, dirs, files in os.walk(wiki_folder, topdown=True):
        dirs[:] = [d for d in dirs if d not in exclude]
        md_files = [ fi for fi in files if fi.endswith(".md") ]
        if (count == 0):
            for i in dirs:
                tree[i] = {}
        else:
            parts = Path(root).parts
            if (len(parts) == 2):
                tree[parts[1]]["root"] = root
                tree[parts[1]]["folders"] = {}
                tree[parts[1]]["md_files"] = md_files
                for i in dirs:
                    tree[parts[1]]["folders"][i] = {}
            elif (len(parts) == 3):
                tree[parts[1]]["folders"][parts[2]]["root"] = root
                tree[parts[1]]["folders"][parts[2]]["folders"] = {}
                tree[parts[1]]["folders"][parts[2]]["md_files"] = md_files
                for i in dirs:
                    tree[parts[1]]["folders"][parts[2]]["folders"][i] = {}
                    tree[parts[1]]["folders"][parts[2]]["folders"][i]["root"] = join(root, i)
        count += 1

    return tree

def getMDFiles(folder):
    md_files = [f for f in listdir(folder) if isfile(join(folder, f)) and f.endswith(".md")]

    data = []
    for i in md_files:
        with open(join(folder, i), encoding="utf8") as f:
            data.append({
                "content": f.read(),
                "filename": os.path.splitext(i)[0],
                "link": "#" + os.path.splitext(i)[0]
            })
            
    return data

def getImages(root):

    extensions = ('.jpg', '.jpeg', '.png', '.gif', '.jfif', '.webp')
    files = [join(root, f) for f in listdir(root) if isfile(join(root, f)) and f.endswith(extensions)]
            
    return files

def getPDFFiles(folder):
    pdf_files = [join(folder, f) for f in listdir(folder) if isfile(join(folder, f)) and f.endswith(".pdf")]

    return pdf_files

def addMDFile(file, category_id):
    sql = "INSERT INTO files (title, content, extension) VALUES (%s, %s, %s)"
    val = (file['filename'], file['content'], 'md')
    mycursor.execute(sql, val)

    file_id = mycursor.lastrowid
    sql2 = "INSERT INTO files_categories (file_id, category_id) VALUES (%s, %s)"
    val2 = (file_id, category_id)
    mycursor.execute(sql2, val2)

def addImageFile(file, category_id):
    shutil.copy(os.getcwd() + "/" + file, os.getcwd() + "/media-files")
    filename = os.path.basename(file)
    title = os.path.splitext(filename)[0]
    extension = os.path.splitext(filename)[1]
    filepath = os.getcwd() + "/media-files/" + file
    sql = "INSERT INTO files (title, path, extension) VALUES (%s, %s, %s)"
    val = (title, filepath, extension)
    mycursor.execute(sql, val)

    file_id = mycursor.lastrowid
    sql2 = "INSERT INTO files_categories (file_id, category_id) VALUES (%s, %s)"
    val2 = (file_id, category_id)
    mycursor.execute(sql2, val2)

def addPDFFile(file, category_id):
    shutil.copy(os.getcwd() + "/" + file, os.getcwd() + "/media-files")
    filename = os.path.basename(file)
    title = os.path.splitext(filename)[0]
    extension = os.path.splitext(filename)[1]
    filepath = os.getcwd() + "/media-files/" + file
    sql = "INSERT INTO files (title, path, extension) VALUES (%s, %s, %s)"
    val = (title, filepath, extension)
    mycursor.execute(sql, val)

    file_id = mycursor.lastrowid
    sql2 = "INSERT INTO files_categories (file_id, category_id) VALUES (%s, %s)"
    val2 = (file_id, category_id)
    mycursor.execute(sql2, val2)


folderTree = createFolderTree(wiki_folder)

def addFiles(root, category_id):
    md_files = getMDFiles(root)
    for f in md_files:
        addMDFile(f, category_id)

    image_files = getImages(root)
    for f in image_files:
        addImageFile(f, category_id)

    pdf_files = getPDFFiles(root)
    for f in pdf_files:
        addPDFFile(f, category_id)

for level1_folder in folderTree:
    sql = "INSERT INTO categories (name, parent_id) VALUES (%s, %s)"
    val = (level1_folder, 1)
    mycursor.execute(sql, val)

    category_id1 = mycursor.lastrowid
    addFiles(folderTree[level1_folder]['root'], category_id1)

    for level2_folder in folderTree[level1_folder]['folders']:
        last_id = mycursor.lastrowid
        sql = "INSERT INTO categories (name, parent_id) VALUES (%s, %s)"
        val = (level2_folder, category_id1)
        mycursor.execute(sql, val)

        category_id2 = mycursor.lastrowid
        addFiles(folderTree[level1_folder]['folders'][level2_folder]['root'], category_id2)

        for level3_folder in folderTree[level1_folder]['folders'][level2_folder]['folders']:
            sql = "INSERT INTO categories (name, parent_id) VALUES (%s, %s)"
            val = (level3_folder, category_id2)
            mycursor.execute(sql, val)

            category_id3 = mycursor.lastrowid
            addFiles(folderTree[level1_folder]['folders'][level2_folder]['folders'][level3_folder]['root'], category_id3)

mydb.commit()

print("Finished.")