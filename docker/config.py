SITENAME = input("Enter the name of the site: ")
SITE_ID = input("Enter the site id(alphanumeric): ")
SECRET_TOKEN = input("Enter the secret token: ")
SESSION_KEY = input("Enter the session key: ")
USE_2FA = input("Do you want to enable 2-Factor Authentication (if you enable you'll have to setup a Gmail account to send e-mails)? (y/n): ")
SITE_EMAIL = ""
SITE_EMAIL_PASSWORD = ""
USER_EMAIL = ""
if USE_2FA == "y":
    USE_2FA = "true"
    SITE_EMAIL = input("Enter the site's email address (Must be Gmail): ")
    SITE_EMAIL_PASSWORD = input("Enter the password for the site's email address: ")
    USER_EMAIL = input("Enter the user's email address: ")
else:
    USE_2FA = "false"
USER = input("Choose a username: ")
PASS = input("Choose a password: ")

with open("secret-config.json", "w", encoding="utf8") as f:
    f.write('{"SITENAME": "' + SITENAME + '", "SECRET_TOKEN": "' + SECRET_TOKEN + '", "SESSION_KEY": "' + SESSION_KEY + '", "SITE_ID": "' + SITE_ID + '", "USE_2FA": ' + USE_2FA + ', "SITE_EMAIL": "' + SITE_EMAIL + '", "SITE_EMAIL_PASSWORD": "' + SITE_EMAIL_PASSWORD + '", "USER_EMAIL": "' + USER_EMAIL + '", "USER": "' + USER + '", "PASS": "' + PASS + '", "DB_HOST": "localhost", "DB_NAME": "markdownwiki2", "DB_USER": "root", "DB_PASS": "123456", "DB_PORT": "3307"}')

with open("config.json", "w", encoding="utf8") as f:
    f.write('{"SITE_NAME": "' + SITENAME + '", "BACKEND_URL": "http://localhost:4001", "FRONTEND_URL": "http://localhost:3000"}')

