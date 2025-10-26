from flask import Blueprint, jsonify

api = Blueprint('apis', __name__)

from . import subject, user