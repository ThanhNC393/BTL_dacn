from . import api
from .. import db
from ..models import User, Class, Change_Info_Request
from flask import jsonify, request
from datetime import datetime




@api.route('/register_teacher', methods=['POST'])
def register_teachers():

    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404

    data:dict = request.get_json() 
    invalid = dict()
    for _, val in data.items():
        new_teacher = User(
            name = val['name'],
            personal_id = val['personal_id'],
            phone_number = val['phone_number'],
            address = val['address'],
            date_of_joining = val['date_of_joining'],
            email = val['email'],
            role = 0,
            first_login = 1
        )
        date = datetime.strptime(new_teacher.date_of_joining, '%d/%m/%Y')
        db.session.add(new_teacher)

        try:
            db.session.flush()
        except:
            db.session.rollback()
            invalid[val['personal_id']] = "This personal id is existed!"
            continue

        new_teacher.school_id = f"{date.year}GV{new_teacher.id}"
        new_teacher.password = f"{date.day}{date.month}{date.year}"
        db.session.commit()
    
    if len(invalid) != 0:
        return jsonify(invalid)

    return jsonify({
        "message": "done!"
    })


@api.route('/get_teachers', methods = ['GET'])
def get_teachers():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404

    data = request.get_json()
    
    if len(data) == 0:
        teachers = User.query.filter_by(role = 1).all()
    else:
        teachers = []
        for school_id in data:
            teacher  = User.query.filter_by(school_id = school_id, role = 1).first()
            if teacher is not None:
                teachers.append(teacher)

    return jsonify({
        teacher.school_id:{
            'name' : teacher.name,
            'personal_id' : teacher.personal_id,
            'phone_number' : teacher.phone_number,
            'address' : teacher.address,
            'date_of_joining' : teacher.date_of_joining,
            'email' : teacher.email,
            'school_id' : teacher.school_id
        } for teacher in teachers
    })


@api.route('/register_student', methods = ['POST'])
def register_students():
    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404

    data:dict = request.get_json() 
    invalid = dict()

    for _, val in data.items():
        clss = Class.query.filter_by(name = val['class_name']).first()
        if not clss:
            invalid[val['personal_id']] = "Not have this class!"
            continue
        new_student = User(
            name = val['name'] or None,
            personal_id = val['personal_id'] or None,
            phone_number = val['phone_number'] or None,
            address = val['address']or None,
            date_of_joining = val['date_of_joining']or None,
            email = val['email'] or None,
            class_id = clss.id,
            role = 1,
            first_login = 1
        )
        date = datetime.strptime(new_student.date_of_joining, '%d/%m/%Y')

        try:
            with db.session.begin_nested():
                db.session.add(new_student)
                db.session.flush()
        except:
            # db.session.rollback()
            invalid[val['personal_id']] = "This personal id is existed!"
            continue

        new_student.school_id = f"{date.year}SV{new_student.id}"
        new_student.password = f"{date.day}{date.month}{date.year}"
    db.session.commit()

    if len(invalid) != 0:
        return jsonify(invalid)

    return jsonify({
        "message": "done!"
    })



@api.route('/get_students', methods = ['GET'])
def get_students():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404

    data = request.get_json()
    
    if len(data) == 0:
        students = User.query.filter_by(role = 1).all()
    else:
        students = []
        for school_id in data:
            student  = User.query.filter_by(school_id = school_id, role = 0).first()
            if student is not None:
                students.append(student)

    return jsonify({
        student.school_id:{
            'name' : student.name,
            'personal_id' : student.personal_id,
            'phone_number' : student.phone_number,
            'address' : student.address,
            'date_of_joining' : student.date_of_joining,
            'email' : student.email,
            'school_id' : student.school_id,
            'class_name' : student.class_.name
        } for student in students
    })



@api.route('/add_class', methods = ['POST'])
def add_class():

    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404

    data:dict = request.get_json() 

    duplicate_class = dict()

    for _, val in data.items():
        if len(Class.query.filter_by(name = val['name']).all()) != 0:
            duplicate_class[val['name']] = False
            continue
        class_ = Class(
            name = val['name'],
            estab_date = val['estab_date']
        )
        db.session.add(class_)
        db.session.commit()

    if len(duplicate_class) != 0:
        return duplicate_class
    
    return jsonify({
        "message": "done!"
    })



@api.route('/change_info', methods = ['POST'])
def change_info():
    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()

    if len(data) == 0:
        return jsonify({
            "error": "Not have data in API!"
        })
    
    invalid = dict()

    for school_id, info in data.items():
        object = User.query.filter_by(school_id = school_id).first()
        try:
            with db.session.begin_nested():
                object.name = info.get('name') or object.name
                object.personal_id = info.get('personal_id') or object.personal_id
                object.phone_number = info.get('phone_number') or object.phone_number
                object.address = info.get('address') or object.address
                object.role = info.get('role') or object.role
                object.date_of_joining = info.get('date_of_joining') or object.date_of_joining
                object.email = info.get('email') or object.email
                if "class_name" in info:
                    clss = Class.query.filter_by(name = info["class_name"]).first()
                    if clss is not None:
                        object.class_id = clss.id 
                db.session.flush()
        except:
            # db.session.rollback()
            invalid[school_id] = "This personal id is existed!"
            continue
    db.session.commit()

    if len(invalid) != 0:
        return jsonify(invalid)
    return jsonify({
        "message": "done!"
    })



@api.route('/request_change_info', methods = ['POST'])
def request_change_info():

    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    invalid = dict()
    for school_id, info in data.items():
        request_ = Change_Info_Request.query.filter_by(school_id = school_id, status = False).first()
        if request_ is not None and request_.status==False:
            invalid[school_id] = "Another request is being processed!"
            continue

        new_request = Change_Info_Request(
            name = info.get('name') or None,
            personal_id = info.get('personal_id') or None,
            phone_number = info.get('phone_number') or None,
            address = info.get('address') or None,
            email = info.get('email') or None,
            school_id = school_id,
            status = 0
        )
        db.session.add(new_request)
    db.session.commit()
            
    if len(invalid) != 0:
        return jsonify(invalid)
    
    return jsonify({
        "message": "done!"
    })



@api.route('/approve_change_request', methods = ['POST'])
def approve_change_request():
    
    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404
    
    data = request.get_json()
    all_changes = dict()
    requests = dict()
    for school_id in data:
        request_ = Change_Info_Request.query.filter_by(school_id = school_id, status=False).first()
        if request_ is None:
            continue
        all_changes[school_id] = {
            "name" : request_.name,
            "personal_id" : request_.personal_id,
            "phone_number" : request_.phone_number,
            "address" : request_.address,
            "email" : request_.email
        }
        requests[school_id] = request_

    from ...flasky import app

    with app.test_request_context('/api/v1/change_info', method='post', json = all_changes):
        respond = change_info().get_json()
        for school_id in all_changes:
            if school_id not in respond:
                requests[school_id].status = True
        db.session.commit()
        return respond

