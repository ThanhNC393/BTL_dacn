from . import api
from ..models import (
    Subject, Semester, User, Course, ClassDay, Result
)
from .. import db
from flask import request, jsonify
from datetime import datetime
from ..some_function import get_days


@api.route('/add_subject', methods = ['POST'])
def add_subject():
    
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    invalid = dict()
    for subject_id, info in data.items():
        new_subject = Subject(
            number_of_credit = info.get("number_of_credit") or None,
            description = info.get("description") or None,
            subject_id = subject_id,
            total_of_lessons = info.get("total_of_lessons") or None,
            weight_score_1 = info.get("weight_score_1") or None,
            weight_score_2 = info.get("weight_score_2") or None
        )
        try:
            with db.session.begin_nested():
                db.session.add(new_subject)
                db.session.flush()
        except:
            invalid[subject_id] = "this subject id is existed!"
    
    db.session.commit()
    
    if len(invalid) > 0:
        return jsonify(invalid)

    return jsonify({
        "message": "done!"
    })



@api.route('/add_semester', methods = ['POST'])
def add_semester():

    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    invalid = dict()
    for info in data:
        start_date = info.get("start_date") or None
        order = None
        if start_date:
            start_date = datetime.strptime(start_date, "%d/%m/%Y")
            if start_date.month > 6 or (start_date.day > 1 and start_date.month > 6): 
                order = 2 
            else: order = 1
        new_semester = Semester(
            year = info.get("year") or None,
            start_date = start_date,
            finish_date = info.get("finish_date") or None,
            status = False,
            order = order
        )
        print(new_semester.year, "**************************")
        if Semester.query.filter_by(year = new_semester.year, order = new_semester.order).first():
            invalid[f"Nam hoc {new_semester.year}-{int(new_semester.year)+1} hoc ky {new_semester.order}"] = "da ton tai!"
            continue

        db.session.add(new_semester)

    db.session.commit()
    
    if len(invalid) > 0:
        return jsonify(invalid)

    return jsonify({
        "message": "done!"
    })



@api.route('/add_course', methods = ['POST'])
def add_course():

    if not request.is_json:
        return({
            jsonify({
                "error":"not json!"
            })
        })
    
    data = request.get_json()
    invalid = dict()

    for info in data:
            

        semester_info = info.get('semester_info')
        if not semester_info:
            invalid['error'] = "No have semester information here!"
            continue

        #check year
        year = semester_info.get('year') or None,
        order = semester_info.get('order') or None

        semester = Semester.query.filter_by(
            year = year or None,
            order = order or None
        ).first()
        if not semester:
            invalid[f'{year[0]}-hoc ky {order}'] = 'Not existed!'
            continue
        

        #check teacher
        teacher_id = info.get('teacher_id') or None
        teacher = User.query.filter_by(
            school_id = teacher_id,
            role = 0
        ).first()
        if not teacher:
            invalid[teacher_id]="Not existed!"
            continue

        #check subject
        subject_id = info.get('subject_id') or None
        subject = Subject.query.filter_by(
            subject_id = subject_id
        ).first()
        if not subject:
            invalid[subject]="Not existed!"
            continue
        
        existed_course = Course.query.filter_by(
            semester_id = semester.id,
            teacher_id = teacher.id,
            subject_id = subject.id
        ).first()

        if existed_course:
            invalid[f'{semester.year}/hoc ky {semester.order}-{teacher.school_id}-{subject.subject_id}'] = "is existed!"
            continue

        new_course = Course(
            semester_id = semester.id,
            teacher_id = teacher.id,
            subject_id = subject.id,
            cost = info.get('cost') or None
        )
        db.session.add(new_course)
        db.session.flush()

        new_course.course_id = f"{new_course.id}_{new_course.subject.subject_id}_{new_course.semester.year}_{new_course.semester.order}"

        class_days:dict = info.get('class_day') or None

        days = get_days(
            number_of_classday=new_course.subject.total_of_lessons, 
            date_obj=new_course.semester.start_date, 
            target_weekday=list(class_days.keys())
        )    
        for day in days:
            new_class_day = ClassDay(
                course_id = new_course.id,
                status = False,
                day = day,
                prior = class_days.get(str(day.weekday()+2)) or None
            )
            db.session.add(new_class_day)
        db.session.commit()

    if len(invalid) > 0:
        return jsonify(invalid)

    return jsonify({
        "message":"done!"
    })



@api.route('/register_course', methods = ['POST'])
def register_course():
    
    if not request.is_json:
        return jsonify({
            'error': 'not json!'
        })
    
    data = request.get_json()
    invalid = dict()

    for course_id, student_ids in data.items():
        for student_id in student_ids:
            result = Result.query.filter_by(
                student_id =  student_id,
                course_id = course_id
            ).first()
            if not result:
                new_result = Result(
                    student_id =  student_id,
                    course_id = course_id,
                    paid_tuition = False
                )
                try:
                    with db.session.begin_nested():
                        db.session.add(new_result)
                        db.session.flush()
                except Exception as e:  
                    invalid["error"] = str(e)
            else:
                invalid[f"{course_id} - {student_id}"] = "existed!"
    db.session.commit()

    if len(invalid) > 0:
        return jsonify(invalid)

    return jsonify({
        "message": "done!"
    })



@api.route('/enter_score')
def enter_score():

    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })
    
    data = request.get_json()

    # for 