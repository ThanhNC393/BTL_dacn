import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()
base_dir = os.path.abspath(os.path.dirname(__file__))

class config():
    SECRET_KEY = os.environ.get('SECRETE_KEY') or 'hard to guess string'
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.googlemail.com')
    MAIL_PORT = os.environ.get('MAIL_POST', 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    FLASKY_MAIL_SUBJECT_PREFIX = '[Flasky]'
    FLASKY_MAIL_SENDER = 'Admin ThanhNC'
    FLASKY_ADMIN = os.environ.get('FLASKY_ADMIN')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('SECRETE_KEY') or 'hard to guess string'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES')))
    @staticmethod
    def init_app(app):
        pass


class development_config(config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')


config = {
    'development':development_config,
}