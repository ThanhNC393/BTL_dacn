from . import api
from .. import db
from ..models import User, Account, Change_Info_Request
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
        
    try:
        if account.user.role == 2:
            cir = Change_Info_Request.query.filter_by(status=False).all()
            cir = [
                    {
                        "name":tmp.name,
                        "address":tmp.address,
                        "email":tmp.email,
                        "personal_id":tmp.personal_id,
                        "phone_number":tmp.phone_number
                    } for tmp in cir
                ]
            
        else:
            if (tmp:=account.user.change_info_request.status) is False:
                cir = [tmp]
                cir = {
                    "name":cir[0].name,
                    "address":cir[0].address,
                    "email":cir[0].email,
                    "personal_id":cir[0].personal_id,
                    "phone_number":cir[0].phone_number
                },
            else:
                cir = None
    except:
        pass
    info = {
        "name":account.user.name,
        "address":account.user.address,
        "date_of_joining":account.user.date_of_joining.strftime("%d/%m/%Y"),
        "email":account.user.email,
        "personal_id":account.user.personal_id,
        "phone_number":account.user.phone_number,
        "school_id":account.user.school_id,
        "role":account.user.role,
    }
    if account.user.role == 1:
        info["class"] = account.user.class_.id
    
    
    if account.verify_password(plain_password=data.get("password")):
        respond = create_access_token(
            identity = str(account.user.school_id),
            # identity=str(info)
            additional_claims={
                "role": account.user.role
            }
        )
        rp = {
            "token":respond, 
            "info": info
        }
        try:
            if cir:
                rp["cir_data" ] = cir,
                rp["cir"] = len(cir)
            print(rp)
        except UnboundLocalError:
            pass

        return jsonify(rp), 200

    respond = "Password isn't correct"
    return jsonify(respond), 404



@api.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    print(1)
    return jsonify({"valid": f"Hello "}), 200

