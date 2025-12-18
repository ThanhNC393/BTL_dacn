from . import api
from .. import db
from ..models import (
    User, Class, Change_Info_Request, Account, Announcement, Course, Result,
    User_Exception, ClassException, Course_Exception
)
from flask import jsonify, request
from datetime import datetime
from ..some_function import role_required




#1 - quan ly tai khoan + quan ly thong tin
@api.route('/register_teacher', methods=['POST'])#add teacher
@role_required(2)
def register_teachers():

    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404

    data:dict = request.get_json() 
    data = [data]
    invalid = dict()
    valid = []
    for val in data:
        new_teacher = User(
            name = val['name'],
            personal_id = val['personal_id'],
            phone_number = val['phone_number'],
            address = val['address'],
            date_of_joining = val['date_of_joining'],
            email = val['email'],
            role = 0,
        )
        try:
            date = datetime.strptime(new_teacher.date_of_joining, '%d/%m/%Y')
        except:
            date = datetime.strptime(new_teacher.date_of_joining, '%Y-%m-%d')

        try:
            with db.session.begin_nested():
                db.session.add(new_teacher)
                db.session.flush()
        except:
            invalid[val['personal_id']] = "This personal id is existed!"
            continue

        new_teacher.school_id = f"{date.year}GV{new_teacher.id}"


        new_account = Account(
            account_name = new_teacher.school_id,
            password = f"{date.day}{date.month}{date.year}",
            school_id = new_teacher.school_id,
            first_login = 1
        )

        db.session.add(new_account)
        valid.append({
            "school_id": new_teacher.school_id,
            "name": new_teacher.name,
            "personal_id": new_teacher.personal_id,
            "phone_number": new_teacher.phone_number,
            "address": new_teacher.address,
            "date_of_joining": new_teacher.date_of_joining,
            "email": new_teacher.email,
            "role": 0
        })
        
    db.session.commit()

    # if len(invalid) != 0:
    #     return jsonify(invalid)

    return jsonify(valid)



@api.route('/get_teachers', methods = ['GET', 'POST'])#get teachers' information
# @role_required(0, 2)
def get_teachers():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404

    data = request.get_json()
    
    if len(data) == 0:
        teachers = User.query.filter_by(role = 0).all()
    else:
        teachers = []
        for school_id in data:
            teacher  = User.query.filter_by(school_id = school_id, role = 0).first()
            if teacher is not None:
                teachers.append(teacher)

    return jsonify({
        teacher.school_id:{
            'name' : teacher.name,
            'personal_id' : teacher.personal_id,
            'phone_number' : teacher.phone_number,
            'address' : teacher.address,
            'date_of_joining' : teacher.date_of_joining.strftime("%d-%m-%Y"),
            'email' : teacher.email,
            'school_id' : teacher.school_id
        } for teacher in teachers
    })



@api.route('/register_student', methods = ['POST'])#add student
@role_required(2)
def register_students():
    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404

    data:dict = request.get_json() 
    invalid = dict()
    valid = []
    if type(data) is not list:
        data = [data]
    for val in data:
        print(val, end="\n-------------------------------\n")
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
        )
        try:
            date = datetime.strptime(new_student.date_of_joining, '%d/%m/%Y')
        except:
            date = datetime.strptime(new_student.date_of_joining, '%Y-%m-%d')

        try:
            with db.session.begin_nested():
                db.session.add(new_student)
                db.session.flush()
        except Exception as e:
            invalid[val['personal_id']] = "This personal id is existed!"
            continue

        new_student.school_id = f"{date.year}SV{new_student.id}"

        new_account = Account(
            account_name = new_student.school_id,
            password = f"{date.day}{date.month}{date.year}",
            school_id = new_student.school_id,
            first_login = 1
        )

        db.session.add(new_account)
        valid.append({
            "school_id": new_student.school_id,
            "name": new_student.name,
            "personal_id": new_student.personal_id,
            "phone_number": new_student.phone_number,
            "address": new_student.address,
            "date_of_joining": new_student.date_of_joining,
            "email": new_student.email,
            "class_name": new_student.class_.name,
            "role": 1
        })
    db.session.commit()

    # if len(invalid) != 0:
    #     return jsonify(invalid)
    print(invalid)

    return jsonify(valid)



@api.route('/get_students', methods = ['GET', 'POST'])#get students' information
@role_required(0, 1, 2)
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



@api.route('/delete_info', methods = ['DELETE', 'POST'])#delete information of an user
@role_required(2)
def delete_info():
    if not request.is_json:
        return jsonify({
            "message":"not json!"
        })

    data:dict = request.get_json()

    from ...flasky import app
    with app.test_request_context('/api/v1/delete_account', method = 'delete', json = data):
        respond = delete_account().get_json()
        deleted_account = respond.get("success")
        for school_id in data:
            if school_id in deleted_account:
                user = User.query.filter_by(school_id=school_id).first()
                db.session.delete(user)
        db.session.commit()
        return jsonify(respond)



@api.route('/add_account', methods = ['POST'])#add account
@role_required(2)
def add_account():
    
    if not request.is_json:
        return jsonify({
            "message":"not json!"
        }), 401
    message = {
        "invalid": dict(),
        "meta_data": dict(),
        "success": []
    }
    data = request.get_json()
    print(data)
    for school_id in data:
        try:
            user:User = User.get_user(school_id=school_id)
        except User_Exception:
            message["invalid"][school_id] = "This user is not existed!"
            continue
        date = user.date_of_joining
        account = Account(
            account_name = user.school_id,
            password = f"{date.day}{date.month}{date.year}",
            school_id = user.school_id
        )
        # db.session.add(account)

        with db.session.begin_nested():
            try:
                db.session.add(account)
                db.session.flush()
            except:
                message["invalid"][school_id] = "This user has owned an account!"
                continue

        message["success"].append(school_id)
    db.session.commit()
    return jsonify(message)



@api.route('/get_account', methods = ['GET', 'POST'])
@role_required(0, 2)
def get_account():
    if not request.is_json:
        return jsonify({
            "message": "not json!"
        }), 401
    
    accounts = Account.query.all()

    return jsonify([{
        "user_id" : account.account_name,
    } for account in accounts]), 200



@api.route('/edit_account', methods = ['PATCH', 'POST'])#change information of an account
@role_required(2)
def edit_account():
    
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        })

    data:dict = request.get_json()
    invalid = dict()

    for school_id, info in data.items():
        user = User.query.filter_by(school_id = school_id).first() 
        if not user:
            invalid[school_id] = "not have this school id"
            continue

        account = user.account
        if not account:
            invalid[school_id] = "this user don't have account"
            continue

        account.account_name = info.get('account_name') or account.account_name
        account.password = info.get('pass_word') or account.password
        print(info.get('pass_word'))


        # if account.first_login == True:
        #     account.first_login = False
        # db.session.add(account)
    db.session.commit()
    if len(invalid) > 0:
        return jsonify(invalid)
    return jsonify({
        "message": "done!"
    })



@api.route('delete_account', methods = ['DELETE', 'POST'])#delete account of an user
# @role_required(2) 
def delete_account():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        })

    data:dict = request.get_json()
    message = {"invalid":{}, "meta_data":{}, "success":[]}

    for school_id in data:
        user = User.query.filter_by(
            school_id = school_id
        ).first()

        if not user:
            message["invalid"][school_id] = "Not have this id!"
            continue

        account = user.account
        if not account:
            message["invalid"][school_id] = "This user doesn't have this account"
            continue

        db.session.delete(account)
        message["success"].append(school_id)

    db.session.commit()
    return jsonify(message)



@api.route('/change_info', methods = ['POST'])
# @role_required(2)
def change_info():
    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 401
    

    data:dict = request.get_json()



    if len(data) == 0:
        return jsonify({
            "error": "Not have data in API!"
        }), 401
    
    invalid = dict()


    for school_id, info in data.items():
        object = User.query.filter_by(school_id = school_id).first()
        if not object:
            invalid[school_id] = "Not existed this student!"
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
        except Exception as e:
            print(str(e))
            invalid[school_id] = "This personal id is existed!"
            continue
    db.session.commit()

    if len(invalid) != 0:
        return jsonify(invalid), 200
    return jsonify({
        "message": "done!"
    }), 200
#--------------------------------------------------------------------



# 2. Quan ly lop 


@api.route('/add_class', methods = ['POST'])
@role_required(2)
def add_class():

    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404

    data:dict = request.get_json() 

    invalid = []

    for _, val in data.items():

        try:
            class_ = Class.get_class(name = val['name'])
        except ClassException:
            estab_date = val.get('estab_date') or None
            if estab_date:
                year = datetime.strptime(estab_date,'%d-%m-%Y').year
            else: 
                year = None
            name = val.get('name') or None
            if name and year:
                name = f'{year}{name}'
            class_ = Class(
                name = name,
                estab_date = estab_date
            )
            db.session.add(class_)
            db.session.flush()
            pass
        
    db.session.commit()

    if len(invalid) != 0:
        return jsonify(invalid)
    
    return jsonify({
        "message": "done!"
    })



@api.route('/get_class', methods = ['GET', 'POST'])
@role_required(0, 1, 2)
def get_class():
    
    if not request.is_json:
        return jsonify({
            "message":"not json!"
        }), 401
    
    all_classes = Class.query.all()
    return jsonify([{
        "name": class_.name,
        "estab_date": class_.estab_date.strftime('%Y-%m-%d')
    } for class_ in all_classes])
    



@api.route('/delete_class', methods = ['DELETE', 'POST'])
@role_required(2)
def delete_class():
    
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data = request.get_json()
    invalid = []
    for class_id in data:
        try:
            class_ = Class.get_class(name = class_id)
            db.session.delete(class_)
        except ClassException:
            invalid.append(class_id)
            pass

    db.session.commit()
    if len(invalid) > 0:
        return jsonify(invalid), 200

    return jsonify({
        "message":"success!"
    })



@api.route('/change_info_class', methods = ['POST', 'PATCH'])
@role_required(2)
def change_info_class():
    
    if not request.is_json:
        return jsonify({
            "message": "invalid!"
        }), 404
    
    data = request.get_json()
    invalid=[]
    
    for class_name, info in data.items():
        try:
            class_ = Class.get_class(name = class_name)
            with db.session.begin_nested():
                if (name := info.get("name")) is not None:
                    class_.name = name
                if (estab_date := info.get("estab_date")) is not None:
                    class_.estab_date = estab_date
                db.session.flush()
        except ClassException:
            invalid.append(class_name)
            
    db.session.commit()

    if len(invalid)>0:
        return jsonify(
            invalid
        )
    
    return jsonify({
        "message":"success!"
    })

#---------------------------------------------------------------


@api.route('/request_change_info', methods = ['POST'])
@role_required(0, 1)
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
            db.session.delete(request_)
            db.session.flush()

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




@api.route('get_request_change_info', methods = ['POST'])
@role_required(0, 1, 2)
def get_request_change_info():
    if not request.is_json:
        return jsonify({
            "message":"Not json"
        }), 404
    data = request.get_json()
    if len(data) == 0:
        list_request = Change_Info_Request.query.filter_by(status=False).all()
    else:
        list_request = Change_Info_Request.query.filter_by(school_id = data[0], status=False).all()
    
    respond = [
        {
            "name": request.name,
            "personal_id": request.personal_id,
            "phone_number": request.phone_number,
            "address": request.address,
            "email": request.email,
            "school_id":request.school_id,
            "id":request.id
        } for request in list_request
    ]

    print(respond)

    return jsonify(respond), 200



@api.route('/approve_change_request', methods = ['POST'])
@role_required(2)
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
        respond = change_info()[0].get_json()
        for school_id in all_changes:
            if school_id not in respond:
                requests[school_id].status = True
        db.session.commit()
        return respond



@api.route('/reject_change_request', methods = ['POST'])
@role_required(2)
def reject_change_request():
    if not request.is_json :
        return jsonify({
            "error": "not json!"
        }), 404
    
    data = request.get_json()
    for school_id in data:
        request_ = Change_Info_Request.query.filter_by(school_id = school_id, status=False).first()
        if request_:
            db.session.delete(request_)
    db.session.commit()
    return jsonify(), 200



@api.route('/announcement', methods = ['POST'])
@role_required(0)
def announcement():
    
    if not request.is_json:
        return jsonify(), 401
    
    data = request.get_json()
    print(data)
    try:
        course = Course.get_course(course_id=data[0])
        new_ann = Announcement(
            content = data[1],
            course_id = course.course_id,
            day_upload = datetime.now() 
        )
        db.session.add(new_ann)
        db.session.commit()

    except Course_Exception:
        return jsonify(), 401

    return jsonify(), 200



@api.route('/get_announcs', methods = ['GET', 'POST'])
def get_num_announ():
    
    if not request.is_json:
        return jsonify(), 401
    
    data = request.get_json()[0]


    announs = db.session.query(Announcement, Course).outerjoin(
        Course, Announcement.course_id == Course.course_id
    ).outerjoin(
        Result, Course.course_id == Result.course_id
    ).outerjoin(
        User, User.school_id == Result.student_id
    ).filter(User.school_id == data).all()

    
    response = dict()

    for tmp in announs:
        print(tmp)
        if not response.get(str(tmp[0].day_upload)): 
            response[str(tmp[0].day_upload)] = []
        response[str(tmp[0].day_upload)].append([tmp[1].subject.subject_name, tmp[0].content])

    return jsonify(response)