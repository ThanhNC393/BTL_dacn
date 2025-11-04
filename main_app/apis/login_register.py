from . import api
from .. import db
from ..models import User, Account
from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    jwt_required, get_jwt_identity
)
from datetime import datetime


@api.route('/user_login', methods = ['POST'])
def login():
    respond = None

    if not request.is_json:
        respond = "not json"
        return jsonify(respond), 404
    
    data = request.get_json()
    account = Account.query.filter_by(account_name = data.get('username')).first()
    if not account:
        respond = "this account is not existed"
        return jsonify(respond), 404
    
    if account.verify_password(plain_password=data.get("password")):
        respond = create_access_token(
            identity = str(account.user.school_id)
        )
        cir = account.user.change_info_request
        print(account.user.name)
        return jsonify({
            "token":respond, 
            "info":{
                "name":account.user.name,
                "address":account.user.address,
                "date_of_joining":account.user.date_of_joining,
                "email":account.user.email,
                "personal_id":account.user.personal_id,
                "phone_number":account.user.phone_number,
                "school_id":account.user.school_id,
                "role":account.user.role,
                "cir": len(cir)
            }
        }), 200

    respond = "Password isn't correct"
    return jsonify(respond), 404



@api.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    print(current_user)
    return jsonify({"valid": f"Hello "}), 200

