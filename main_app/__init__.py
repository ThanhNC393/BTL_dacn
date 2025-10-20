from flask import Flask
from ..config import config
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

mail = Mail()
db = SQLAlchemy()
mg = Migrate()


def create_app(config_name):
    app = Flask(__name__)
    config_ = config[config_name]
    app.config.from_object(config_)
    config_.init_app(app)
    mail.init_app(app)
    db.init_app(app)
    mg.init_app(app, db)

    from .api import api

    app.register_blueprint(api, url_prefix = '/api/v1')

    return app