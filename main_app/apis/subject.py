from . import api
from ..models import (
    Subject, Semester, User, Course, ClassDay, Result
)
from .. import db
from flask import request, jsonify
from datetime import datetime
from ..some_function import (
    get_days, check_semester, check_teacher, check_subject, check_course, 
    Semester_Exception, Teacher_Exception, Subject_Exception, Course_Exception
)

@api.route('/add_subject', methods = ['POST'])
def add_subject():
    
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    invalid = dict()
    for subject_id, info in data.items():
        try:
            new_subject = Subject(
                number_of_credit = info.get("number_of_credit") or None,
                description = info.get("description") or None,
                subject_id = subject_id,
                total_of_lessons = info.get("total_of_lessons") or None,
                scores = info.get("scores") or None,
                weights = info.get("weights") or None,
                subject_name = info.get("subject_name") or None
            )
            with db.session.begin_nested():
                db.session.add(new_subject)
                db.session.flush()
        except ValueError as e:
            invalid[subject_id] = str(e)
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

        year = semester_info.get('year') or None
        order = semester_info.get('order') or None
        teacher_id = info.get('teacher_id') or None
        subject_id = info.get('subject_id') or None

        try:
            semester = check_semester(year = year, order = order)
            teacher = check_teacher(teacher_id = teacher_id)
            subject = check_subject(subject_id = subject_id)

        except Semester_Exception:
            invalid[f'{year[0]}-hoc ky {order}'] = 'Not existed!'
            continue
        except Teacher_Exception:
            invalid[teacher_id]="Not existed!"
            continue
        except Subject_Exception:
            invalid[subject_id]="Not existed!"
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

        if not Course.query.filter_by(course_id = course_id).first():
            invalid [course_id] = "not have this course!"
            continue
        
        for student_id in student_ids:
            if not User.query.filter_by(school_id=student_id, role=1).first():
                invalid[student_id] = "not have this student!"
                continue
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
                        scores = [None for _ in new_result.course.subject.scores]
                        scores.append(None)
                        new_result.scores = scores
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



@api.route('/enter_score', methods = ["POST"])
def enter_score():

    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })
    
    data:dict = request.get_json()
    invalid = dict()

    for course_id, info in data.items():

        if not Course.query.filter_by(course_id = course_id).first():
            invalid [course_id] = "not have this course!"
            continue

        if not Result.query.filter_by(course_id = course_id).first():
            invalid [course_id] = "This course doesn't have any student!"
            continue
        
        for student_id, scores in info.items():
            if not User.query.filter_by(school_id = student_id, role = 1).first():
                invalid [student_id] = "not have this student!"
                continue
            result = Result.query.filter_by(
                course_id = course_id,
                student_id = student_id
                ).first()
            if not result:
                invalid[f"{course_id}"] = f"Not existed student{student_id} in this class!"
                continue
            score_names = result.course.subject.scores
            scores_ = result.scores.copy()
            for index in range(len(score_names)):
                if score_names[index] in scores:
                    scores_[index] = scores.get(score_names[index]) or None
                    # print(result.scores[index])
            scores_[-1] = scores.get('ck') or None
            result.scores = scores_
    db.session.commit()
    if len(invalid) > 0:
        return jsonify(invalid)

    return jsonify({
        "message":"done!"
    })
    # for 



@api.route('/get_result/<mode>', methods = ["GET"])
def get_result(mode):
    
    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })

    data = request.get_json()
    id = data.get("id") or None
    if id:
        if mode == "student":
            student_result = Result.query.filter_by(student_id=id).all()
            if not student_result:
                return jsonify({
                    "error":"not have this student!"
                })
            return jsonify({
                result.course_id:{
                    "scores" : result.scores,
                    "scores_name" : result.course.subject.scores
                } for result in student_result
            })
        elif mode == "course":
            course_result = Result.query.filter_by(course_id=id).all()
            if not course_result:
                return jsonify({
                    "error":"not have this course!"
                })
            result = {
                result.student_id:{
                    "scores" : result.scores,
                } for result in course_result
            }
            result["score_names"] = course_result.course.subject.scores
            return jsonify(result)
        else:
            return jsonify({
                "error":"mode is invalid"
            })
    return jsonify({
            "error":"id is invalid"
        })
    


@api.route('/get_tkb/<mode>', methods=['GET'])
def get_tkb(mode):
    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })

    data = request.get_json()
    id = data.get("id") or None
    if id:
        if mode == "student":
            student = User.query.filter_by(school_id=id).first()
            if not student:
                return jsonify({
                    id:"Not have this student!"
                })
            tkb = db.session.query(ClassDay).join(
                ClassDay
            ).outerjoin(
                Subject
            ).join(
                Result
            ).add_columns(
                ClassDay.day, Course.course_id, ClassDay.prior, Subject.subject_name
            ).filter(Result.student_id == student.school_id).all()
            result = dict()
            for row in tkb:
                print(row)
                if str(row.day) not in result:
                    result[str(row.day)]=[]
                result[str(row.day)].append({
                    row.subject_name:row.prior
                })
            return jsonify(result)
                    

    return jsonify({
        "error":"id is invalid"
    })