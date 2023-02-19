CREATE DATABASE markdownwiki2;
USE markdownwiki2;

CREATE TABLE files (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(2048) NOT NULL,
    content TEXT DEFAULT NULL,
    path VARCHAR(2048) DEFAULT NULL,
    extension VARCHAR(128) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE files_categories (
    file_id INT(11) NOT NULL,
    category_id INT(11) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(file_id, category_id)
);

CREATE TABLE files_tags (
    file_id INT(11) NOT NULL,
    tag_id INT(11) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(file_id, tag_id)
);

CREATE TABLE categories (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    parent_id INT(11) NOT NULL,
    name VARCHAR(1024) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(1024) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bookmarks (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    parent_id INT(11),
    title VARCHAR(2048),
    url TEXT,
    type VARCHAR(128),
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(parent_id, title, url, type)
);

INSERT INTO categories (name, parent_id) VALUES ('root', 0);
ALTER TABLE files ADD category_id INT(11) DEFAULT NULL;
UPDATE files f JOIN files_categories fc ON f.id = fc.file_id SET f.category_id = fc.category_id;
DROP TABLE files_categories;
ALTER TABLE files ADD pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD sort_index INT(11);




