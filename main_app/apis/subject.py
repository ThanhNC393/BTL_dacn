from . import api
from ..models import (
    Subject, Semester, User, Course, ClassDay, Result, DayOff,
    Semester_Exception, User_Exception, Subject_Exception, Course_Exception, Result_Exception
)
from .. import db
from flask import request, jsonify
from datetime import datetime
from ..some_function import (
    get_days, get_order, insert_year, get_final_result, get_gpa2
    ,check_duplicate ,
    role_required
)

#1. quan ly hoc ky
@api.route('/add_semester', methods = ['POST'])#them hoc ky
@role_required(2)
def add_semester():

    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    invalid = dict()
    dataa = []
    for info in data:
        start_date = info.get("start_date") or None
        new_semester = Semester(
            year = info.get("year") or None,
            start_date = start_date,
            finish_date = info.get("finish_date") or None,
            status = False
        )

        new_semester.start_date = insert_year(new_semester.start_date, new_semester.year)
        new_semester.finish_date = insert_year(new_semester.finish_date, int(new_semester.year)+1)
        new_semester.order = get_order(date = new_semester.start_date)
        new_semester.semester_id = f"{new_semester.year}_{new_semester.order}" 

        try:
            with db.session.begin_nested():     
                db.session.add(new_semester)
                db.session.flush()
                dataa.append(
                    {
                        "semester_id":new_semester.semester_id,
                        "year":new_semester.year,
                        "start_date":new_semester.start_date.strftime("%d/%m") or "",
                        "finish_date":new_semester.finish_date.strftime("%d/%m") or ""
                    }
                )
        except:
            invalid[f"Nam hoc {new_semester.year}-{int(new_semester.year)+1} hoc ky {new_semester.order}"] = "da ton tai!"
            continue

    db.session.commit()
    
    if len(invalid) > 0:
        return jsonify(invalid), 401

    print(dataa)
    return jsonify(dataa)



@api.route('/get_semesters', methods = ['GET', 'POST'])
@role_required(0,1,2)
def get_semester():
    all_semesters = Semester.query.all()

    data = [{
        "year" : semester.year or "",
        "start_date" : semester.start_date.strftime("%d/%m")  or "",
        "finish_date" : semester.finish_date.strftime("%d/%m") or "",
        "semester_id" : semester.semester_id
    } for semester in all_semesters]
    print(data)

    return jsonify(data), 200



@api.route('/change_info_semester', methods = ['PATCH', 'POST'])#sua thong tin hoc ky
@role_required(2)
def change_info_semester():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()

    message = {
        "invalid":dict(),
        "success":[],
        "meta_data": dict()
    }

    for semester_id, info in data.items():
        try:
            semester:Semester = Semester.get_semester(semester_id=semester_id)
        except Semester_Exception:
            message["invalid"][semester_id] = "Not have this semester!" 
            continue
        if (year:=info.get("year")):
            semester.year = year

        if (start_date:=info.get("start_date")):
            semester.start_date = insert_year(start_date, semester.year)

        if (finish_date:=info.get("finish_date")):
            semester.finish_date = insert_year(finish_date, int(semester.year)+1)

        # semester.start_date = insert_year(semester.start_date, semester.year)
        # semester.finish_date = insert_year(semester.finish_date, int(semester.year)+1)
        semester.order = get_order(date = semester.start_date)

        try:
            with db.session.begin_nested():
                semester.semester_id = f"{semester.year}_{semester.order}" 
        except:
            message["invalid"][f"Nam hoc {semester.year}-{int(semester.year)+1} hoc ky {semester.order}"] = "da ton tai!"
            continue
        message["success"].append(semester_id)

    db.session.commit()
    return jsonify(message)
        



@api.route('/delete_semester', methods = ['POST', 'DELETE'])#xoa hoc ky
@role_required(2)
def delete_semester():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()

    print(data)

    message = {
        "invalid":dict(),
        "success":[],
        "meta_data": dict()
    }

    for semester_id in data:
        semester = Semester.get_semester(semester_id=semester_id)
        if not semester:
            message["invalid"][semester_id] = "This semester is not existed"
            continue
        db.session.delete(semester)
        message["success"].append(semester_id)

    db.session.commit()
    return jsonify(message)



@api.route('/add_course', methods = ['POST'])#dang ky mon cho hoc ky
@role_required(2)
def add_course():

    if not request.is_json:
        return({
            jsonify({
                "error":"not json!"
            })
        })
    
    data = request.get_json()
    invalid = dict()
    result = dict()
    for info in data:
        semester_id = info.get('semester_id') or None
        teacher_id = info.get('teacher_id') or None
        subject_id = info.get('subject_id') or None

        try:
            semester = Semester.get_semester(semester_id = semester_id)
            teacher = User.get_user(school_id = teacher_id, role = 0)
            subject = Subject.get_subject(subject_id = subject_id)

        except Semester_Exception:
            invalid[semester_id] = 'Not existed!'
            continue
        except User_Exception:
            invalid[teacher_id]="Not existed!"
            continue
        except Subject_Exception:
            invalid[subject_id]="Not existed!"
            continue
        
        courses = db.session.query(Course).outerjoin(
            User, User.id == Course.teacher_id
        ).filter(
            Course.semester_id == semester.id,
            Course.teacher_id == teacher.id
        ).all()
        schedules = [course.schedule for course in courses]
        if not check_duplicate(info.get('class_day'), schedules=schedules):
            continue

        new_course = Course(
            semester_id = semester.id,
            teacher_id = teacher.id,
            subject_id = subject.id,
            cost = info.get('cost') or None,
            schedule = info.get('class_day') or None
        )
        db.session.add(new_course)
        db.session.flush()

                
        new_course.course_id = f"{new_course.id}_{new_course.subject.subject_id}_{new_course.semester.year}_{new_course.semester.order}"

        class_days:dict = info.get('class_day') or None


        result[new_course.course_id] = {
            "semester_id": new_course.semester_id,
            "subject_id": new_course.subject_id,
            "teacher_id": new_course.teacher_id
        }
        
        days = get_days(
            number_of_classday=new_course.subject.total_of_lessons, 
            date_obj=new_course.semester.start_date, 
            target_weekday=list(class_days.keys())
        )    
        for day in days:
            new_class_day = ClassDay(
                course_id = new_course.course_id,
                status = False,
                day = day,
                prior = class_days.get(str(day.weekday()+2)) or None
            )
            db.session.add(new_class_day)
        db.session.commit()
        print(result    )
    return jsonify(result)



@api.route('/get_courses', methods = ["GET", "POST"])
@role_required(0, 1, 2)
def get_course():
    
    courses = Course.query.all()
    return jsonify({
        course.course_id: {
            "semester_id": course.semester.semester_id,
            "teacher_id": course.teacher.school_id,
            "subject_id": course.subject.subject_id,
        }
    for course in courses}), 200



@api.route('/get_courses2', methods = ["GET", "POST"])
# @role_required(0, 1, 2)
def get_course2():
    
    # from datetime import datetime
    now = datetime.now()

    current_month = now.month
    current_year = now.year

    current_semester = f'{current_year}_{1 if current_month <6 else 2}'

    courses = db.session.query(Course).outerjoin(
        Semester, Semester.id == Course.semester_id
    ).filter(Semester.semester_id == current_semester)

    student_id = request.get_json()[0]
    results = Result.query.filter_by(student_id = student_id)
    schedules = []
    for result in results:
        schedules.append(result.course.schedule)

    list_course = []
    for result in results:
        list_course.append(result.course.subject.subject_name)
        print(list_course)

    data = dict()
    for course in courses:
        if check_duplicate(course.schedule, schedules) and course.subject.subject_name not in list_course:
            data[course.course_id] = {
                "semester_id": course.semester.semester_id,
                "teacher_id": course.teacher.name,
                "subject_id": course.subject.subject_name, 
                "schedule": course.schedule     
            }

    return jsonify(data), 200



@api.route('/get_courses3', methods = ['GET', 'POST'])
def get_course3():

    now = datetime.now()

    current_month = now.month
    current_year = now.year

    current_semester = f'{current_year}_{1 if current_month <6 else 2}'

    student_id = request.get_json()[0]

    courses = db.session.query(Result, Course).outerjoin(
        Semester, Semester.id == Course.semester_id
    ).outerjoin(
        Result, Result.course_id == Course.course_id
    ).filter(Semester.semester_id == current_semester, Result.student_id == student_id)

    data = dict()

    for course in courses:
        data[course[1].course_id] = {
            "teacher_id" : course[1].teacher.name,
            "subject_name" : course[1].subject.subject_name,
            "schedule": course[1].schedule
        }
    return jsonify(data)



@api.route('/change_info_course', methods = ['PATCH', 'POST'])#sua mon da dang ky
@role_required(2)
def change_info_course():

    if not request.is_json:
        return({
            jsonify({
                "error":"not json!"
            })
        }), 401
    
    data:dict = request.get_json()
    message = {
        "invalid":dict(),
        "success":[],
        "meta_data":dict()
    }

    courses = db.session.query(
        ClassDay, Course
    ).outerjoin(Course).filter(
        Course.course_id.in_(data.keys()),
        # ClassDay.day >= datetime.now().date()
    ).all()

    list_tkb = dict()

    for _ in data.keys():
        if _ not in list_tkb.keys():
            message["success"].append(_)
        else:
            message["invalid"][_] = "this course is not existed or finished!" 

    # print(courses)
    for class_day, course in courses:
        if course not in list_tkb:
            list_tkb[course] = []
        list_tkb[course].append(class_day)

    # print(list_tkb)

    for course, class_day in list_tkb.items():
        info = data.get(course.course_id)
        # print(info)
        try:
            if (semester := Semester.get_semester(info.get("semester_id"))):
                print(semester.semester_id, "------------------")
                course.semester_id = semester.id    
        except Semester_Exception:
            pass

        try:
            if (teacher := User.get_user(info.get("teacher_id"), role = 0)):
                course.teacher_id = teacher.id
        except User_Exception:
            pass

        try:        
            if (subject := Subject.get_subject(info.get("subject_id"))):
                course.subject_id = subject.id
        except Subject_Exception:
            pass

        if (cost := info.get("cost")):
            course.cost = cost
            print(cost)
        
       
        
        if (tkb := info.get("class_day")):
            for _ in class_day:
                db.session.delete(_)
            days = get_days(
                number_of_classday=len(class_day), 
                date_obj=datetime.today(), 
                target_weekday=list(tkb.keys())
            )    
            for day in days:
                new_class_day = ClassDay(
                    course_id = course.course_id,
                    status = False,
                    day = day,
                    prior = tkb.get(str(day.weekday()+2)) or None
                )
                db.session.add(new_class_day)

    db.session.commit()
    return jsonify(message)

    


@api.route('/delete_course', methods = ['DELETE', "POST"])#xoa mon da dang ky
@role_required(2)
def delete_course():
    if not request.is_json:
        return(
            jsonify({
                "error":"not json!"
            })
        )
    
    data:dict = request.get_json()

    message = {
        "invalid":dict(),
        "success":[],
        "meta_data":dict()
    }

    for course_id in data:
        try:
            course = Course.get_course(course_id=course_id)
        except Course_Exception:
            message["invalid"][course_id] = "This course isn't existed"    
            continue
        db.session.delete(course)
        message["success"].append(course_id)
    
    db.session.commit()

    return jsonify(message)



#------------------------------------------





#2. Quan ly mon hoc
@api.route('/add_subject', methods = ['POST'])#them mon hoc
@role_required(2)
def add_subject():
    
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    invalid = dict()
    for subject_id, info in data.items():
        scores:list = info.get("scores") or None
        if scores:
            scores.append('ck')
        weights:list = info.get("weights") or None
        if weights:
            weights.append(100 - sum(weights))
        try:
            new_subject = Subject(
                number_of_credit = info.get("number_of_credit") or None,
                description = info.get("description") or None,
                subject_id = subject_id,
                total_of_lessons = info.get("total_of_lessons") or None,
                scores = scores,
                weights = weights,
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
        return jsonify(invalid), 401

    return jsonify({
        "message": "done!"
    })



@api.route('/change_info_subject', methods = ['PATCH'])#sua thong tin mon hoc
@role_required(2)
def change_info_subject():
    if not request.is_json:
        return jsonify({
            "error": "not json!"
        }), 404
    
    data:dict = request.get_json()
    message = {
        "invalid":dict(),
        "success":[],
        "meta_data":dict()
    }

    for subject_id, info in data.items():

        try:
            subject = Subject.get_subject(subject_id=subject_id)
        except Subject_Exception:
            message["invalid"][subject_id] = "This subject isn't existed!"
            continue
        
        if (number_of_credit := info.get("number_of_credit")):
            subject.number_of_credit = number_of_credit
        
        if (total_of_lessons := info.get("total_of_lessons")):
            subject.total_of_lessons = total_of_lessons
        
        if (description := info.get("description")):
            subject.description = description
        
        try:
            with db.session.begin_nested():
                if (scores := info.get("scores")):
                    subject.scores = scores

                if (weights := info.get("weights")):
                    subject.weights = weights

        except ValueError as e:
            message["invalid"][subject_id] = str(e)
            continue

        message["success"].append(subject_id)

    db.session.commit()
    return jsonify(message)
        

        

@api.route('/delete_subject', methods = ['POST', 'DELETE'])#xoa mon hoc
@role_required(2)
def delete_subject():
    if not request.is_json:
        return(
            jsonify({
                "error":"not json!"
            })
        )
    
    data:dict = request.get_json()

    message = {
        "invalid":dict(),
        "success":[],
        "meta_data":dict()
    }

    for subject_id in data:
        try:
            subject = Subject.get_subject(subject_id=subject_id)
        except Subject_Exception:
            message["invalid"][subject_id] = "this subject isn't existed"
            continue
        db.session.delete(subject)
        message["success"].append(subject_id)
    db.session.commit()
    return jsonify(message)
    



@api.route('get_subjects', methods = ['GET', "POST"])
@role_required(0, 1, 2)
def get_subject():
    
    all_subjects = Subject.query.all()

    data = [{
        "subject_code": subject.subject_id,
        "number_of_credit":subject.number_of_credit or "",
        "description":subject.description or "",
        "total_of_lessons":subject.total_of_lessons or "",
        "subject_name":subject.subject_name or "",
        "scores":subject.scores or [],
        "weights":subject.weights or []
     } for subject in all_subjects]
    

    return jsonify(data), 200

#-----------------------






#3. Quan ly ket qua hoc tap
@api.route('/enter_score', methods = ["PATCH", "POST"])#nhap diem
@role_required(0)
def enter_score():

    if not request.is_json:
        return jsonify({
            "error":"not json!"
        }), 401
    
    data:dict = request.get_json()

    print(data)
    message = {
        "invalid":dict(),
        "success":[],
        "meta_data":dict()
    }

    for course_id, info in data.items():
        try:
            course = Course.get_course(course_id=course_id)
            rerult = Result.get_result(course_id=course_id)
        except Course_Exception:
            message["invalid"][course_id] = "not have this course!"
            continue
        except Result_Exception:
            message["invalid"][course_id] = "This course doesn't have any student!"
            continue

        for student_id, scores in info.items():
            if not User.query.filter_by(school_id = student_id, role = 1).first():
                message["invalid"][student_id] = "not have this student!"
                continue
            result = Result.query.filter_by(
                course_id = course_id,
                student_id = student_id
            ).first()
            if not result:
                message["invalid"][f"{course_id}"] = f"Not existed student{student_id} in this class!"
                continue
            score_names = result.course.subject.scores
            scores_ = result.scores.copy()
            for index in range(len(score_names)):
                # if (score := scores.get(score_names[index])):
                    # scores_[index] = score
                scores_[index] = scores.get(score_names[index])

            result.scores = scores_
            print(result.scores)
    db.session.commit()

    return jsonify(message)



@api.route('/get_score', methods = ["GET", "POST"])
@role_required(0, 1, 2)
def get_score():
    if not request.is_json:
        return jsonify(), 401
    data = request.get_json()
    result = Result.query.filter_by(student_id=data[0], course_id = data[1]).first()
    off_days = db.session.query(DayOff).outerjoin(
        ClassDay, ClassDay.id == DayOff.class_day_id
    ).outerjoin(
        Result, Result.id == DayOff.result_id
    ).outerjoin(
        Course, Course.course_id == ClassDay.course_id
    ).filter(Course.course_id == result.course_id, Result.id == result.id).all()
    return jsonify({
        "scores": result.scores,
        "scores_name": result.course.subject.scores,
        "final_result" : get_final_result(scores=result.scores, scores_weights=result.course.subject.weights),
        "off_days" : (len(off_days)/int(result.course.subject.total_of_lessons)) * 100
    })



@api.route('/get_gpa', methods = ['GET', 'POST'])
@role_required(0, 1, 2)
def get_gpa():
    if not request.is_json:
        return jsonify('not json!'), 401
    
    student_id = request.get_json()[0]
    try:
        user = User.get_user(school_id=student_id, role=1)
        results = user.results
        sum_result = 0
        sum_credit = 0
        for result in results:
            if (tmp:=get_final_result(result.scores, result.course.subject.weights)) is not None:
                tmp2 = result.course.subject.number_of_credit
                sum_result += get_gpa2(tmp) * tmp2
                sum_credit += tmp2
        return jsonify([sum_credit, sum_result/sum_credit])

    except User_Exception:
        return jsonify('not have this user!'), 401



@api.route('/roll_call', methods = ["POST"])#diem danh
@role_required(0)
def roll_call():

    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })
    
    data:dict = request.get_json()

    message = {
        "invalid":dict(),
        "success":[],
        "meta_data":dict()
    }

    for course_id, info in data.items():
        try:
            Course.get_course(course_id=course_id)
        except Course_Exception:
            message["invalid"][course_id] = "This course isn't existed!"
            continue

        for day, roll in info.items():
            try:
                for school_id in roll.get("0"):
                    result = Result.query.filter_by(student_id = school_id, course_id = course_id).first()
                    class_day = ClassDay.query.filter_by(course_id = course_id, day = datetime.strptime(day, '%d/%m/%Y').date()).first()
                    if result and class_day:
                        if DayOff.query.filter_by(
                            result_id = result.id,
                            class_day_id = class_day.id
                        ).first():
                            continue
                        day_off = DayOff(
                            result_id = result.id,
                            class_day_id = class_day.id
                        )
                        db.session.add(day_off)
                        message["success"].append(f'{school_id}-{day}-{course_id}')
                    else:
                        message["invalid"][f'{school_id}-{day}-{course_id}'] = "error"


                for school_id in roll.get("1"):
                    result = Result.query.filter_by(student_id = school_id, course_id = course_id).first()
                    class_day = ClassDay.query.filter_by(course_id = course_id, day = datetime.strptime(day, '%d/%m/%Y').date()).first()
                    if result and class_day:
                        if (day_off := DayOff.query.filter_by(
                            result_id = result.id,
                            class_day_id = class_day.id
                        ).first()):
                            db.session.delete(day_off)
                        # day_off = DayOff(
                        #     result_id = result.id,
                        #     class_day_id = class_day.id
                        # )
                        # db.session.add(day_off)
                            message["success"].append(f'{school_id}-{day}-{course_id}')
                    else:
                        message["invalid"][f'{school_id}-{day}-{course_id}'] = "error"




            except TypeError:
                message["invalid"][f'{course_id}-{day}'] = "missing data!"
                continue
    db.session.commit()

    return jsonify(message)



@api.route('/get_subject_of/<mode>', methods = ["POST", "GET"])
@role_required(0, 1, 2)
def get_subject_of(mode):
    if not request.is_json:
        return jsonify({
            "error":"not json!"
    })

    data = request.get_json()
    id = data[0] or None
    if id:
        if mode == "student":
            try:
                users = User.get_user(school_id=id, role=1)
            except User_Exception:
                return jsonify({
                    "message": "not have this student!"
                }), 404
            courses = db.session.query(User).outerjoin(
                Result, User.school_id == Result.student_id
            ).outerjoin(
                Course, Course.course_id == Result.course_id
            ).outerjoin(
                Subject, Course.subject_id == Subject.id
            ).add_column(Subject.subject_name).filter(User.school_id == users.school_id).all()
            return jsonify([name.subject_name for name in courses])
        else:
            try:
                users = User.get_user(school_id=id, role=0)
            except User_Exception:
                return jsonify(), 401
            courses = db.session.query(Course).outerjoin(
                User, User.id == Course.teacher_id,
            ).outerjoin(
                Subject, Course.subject_id == Subject.id
            ).add_column(Subject.subject_name).filter(User.id == users.id).all()
            return jsonify([name.subject_name for name in courses])

    return jsonify(), 401

            


#------------------------------------------


@api.route('/get_absent_student', methods = ['GET', 'POST'])
@role_required(0, 1, 2)
def get_absent_student():
    data = request.get_json()
    course_id = data[0]
    day = data[1]
    try:
        course = db.session.query(ClassDay).outerjoin(
            Course, ClassDay.course_id == ClassDay.course_id
        ).filter(
            Course.course_id == course_id,
            ClassDay.day == datetime.strptime(day, "%d/%m/%Y")
        ).one()
        students = course.day_offs
        return jsonify([
            student.result.student.school_id for student in students
        ])
    except Course_Exception:
        return jsonify(), 401



@api.route('/get_class_day', methods = ['GET', 'POST'])
@role_required(0, 1, 2)
def get_class_day():
    print(request.method)
    if request.method == "POST":
        course_id = request.get_json()[0]
        print(course_id)
        try:
            course  = Course.get_course(course_id=course_id)
            class_days = course.class_days
            return jsonify([
                class_day.day.strftime("%d/%m/%Y") for class_day in class_days
            ])
        except Course_Exception:
            return jsonify("Not have this course"), 401
    else:
        return jsonify()



@api.route('/get_result/<mode>', methods = ["GET", "POST"])#xem diem
@role_required(0, 1, 2)
def get_result(mode):
    
    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })

    data = request.get_json()
    id = data[0] or None
    if id:
        if mode == "student":
            student_result = Result.query.filter_by(student_id=id).all()
            if not student_result:
                return jsonify({
                    "error":"not have this student!"
                })
            rs = {
                result.course.subject.subject_name:{
                    "scores" : result.scores,
                    "scores_name" : result.course.subject.scores,
                    "weights": result.course.subject.weights
                } for result in student_result
            }
            for _, info in rs.items():
                if None not in info.get("scores"):
                    from ..some_function import get_final_result
                    tmp = get_final_result(info.get("scores"), info.get("weights"))
                    info["scores"].append(tmp)
                    info["scores_name"].append("tk")
                else:
                    info["scores"].append(None)
                    info["scores_name"].append("tk")

            return jsonify({
                result.course.subject.subject_name:{
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
                result.student.school_id:{
                    "scores" : result.scores,
                } for result in course_result
            }
            result["score_names"] = course_result[0].course.subject.scores
            return jsonify(result)
        else:
            return jsonify({
                "error":"mode is invalid"
            })
    return jsonify({
            "error":"id is invalid"
        }), 401
    


@api.route('/get_tkb/<mode>', methods=['GET', "POST"])#xem tkb
@role_required(0, 1, 2)
def get_tkb(mode):
    if not request.is_json:
        return jsonify({
            "error":"not json!"
        })

    data = request.get_json()
    id = data.get("id") or None
    if id:
        if mode == "student":
            student = User.query.filter_by(school_id=id, role=1).first()
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
                if str(row.day) not in result:
                    result[str(row.day)]=[]
                result[str(row.day)].append({
                    row.subject_name:row.prior
                })
            return jsonify(result)
        else:
            teacher = User.query.filter_by(school_id=id, role=0).first()
            if not teacher:
                return jsonify({
                    id:"Not have this teacher!"
                })
            tkb = db.session.query(ClassDay).join(
                ClassDay
            ).outerjoin(
                Subject
            ).add_columns(
                ClassDay.day, Course.course_id, ClassDay.prior, Subject.subject_name
            ).filter(Course.teacher_id == teacher.id).all()
            result = dict()
            for row in tkb:
                if str(row.day) not in result:
                    result[str(row.day)]=[]
                result[str(row.day)].append({
                    row.subject_name:row.prior
                })
            return jsonify(result)

    return jsonify({
        "error":"id is invalid"
    })



@api.route('/register_course', methods = ['POST'])#dang ky mon hoc
@role_required(1)
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
                # try:
                #     with db.session.begin_nested():
                db.session.add(new_result)
                db.session.flush()
                scores = [None for _ in new_result.course.subject.scores]
                new_result.scores = scores
                # except Exception as e:  
                    # invalid["error"] = str(e)
            else:
                invalid[f"{course_id} - {student_id}"] = "existed!"
    db.session.commit()

    if len(invalid) > 0:
        return jsonify(invalid)

    return jsonify({
        "message": "done!"
    })



@api.route('/unregister_course', methods = ['DELETE', 'POST'])
def unregister_course():
    
    if not request.is_json:
        return jsonify(), 401
    
    data = request.get_json()
    results = Result.query.filter_by(course_id = data[0], student_id = data[1])
    for result in results:
        db.session.delete(result)
    db.session.commit()

    return jsonify(), 200



@api.route('/get_subject2/<mode>', methods = ["POST", "GET"])
@role_required(0, 1, 2)
def get_subject2(mode):
    if not request.is_json:
        return jsonify({
            "error":"not json!"
    })

    data = request.get_json()
    id = data[0] or None
    if id:
        if mode == "student":
            try:
                users = User.get_user(school_id=id, role=1)
            except User_Exception:
                return jsonify({
                    "message": "not have this student!"
                }), 404
            courses = db.session.query(Course).outerjoin(
                Result, Course.course_id == Result.course_id
            ).outerjoin(
                User, User.school_id == Result.student_id
            ).outerjoin(
                Subject, Course.subject_id == Subject.id
            ).filter(User.school_id == users.school_id).all()
            return jsonify([{
                "course_id":course.course_id,
                "semester":course.semester.semester_id,
                "subject_id":course.subject_id,
                "subject_name":course.subject.subject_name
            }for course in courses])
        else:
            try:
                users = User.get_user(school_id=id, role=0)
            except User_Exception:
                return jsonify(), 401
            courses = db.session.query(Course).outerjoin(
                User, User.id == Course.teacher_id,
            ).outerjoin(
                Subject, Course.subject_id == Subject.id
            ).filter(User.id == users.id).all()
            return jsonify([{
                "course_id":course.course_id,
                "semester":course.semester.semester_id,
                "subject_id":course.subject_id,
                "subject_name":course.subject.subject_name
            }for course in courses])

    return jsonify(), 401



@api.route('/get_students_of_course', methods = ["POST", "GET"])
@role_required(0, 1, 2)
def get_students_of_course():
    if not request.is_json:
        return jsonify({
            "message":"not json!"
        }), 401
    

    course_id = request.get_json()[0]
    try:
        course = Course.get_course(course_id=course_id)
    except Course_Exception:
        return jsonify(), 401

    students = db.session.query(User, Result).outerjoin(
        Result, User.school_id == Result.student_id
    ).outerjoin(
        Course, Course.course_id == Result.course_id
    ).filter(Course.course_id == course_id).all()
    # print(students)
    return jsonify([{
        "student_id":student.school_id,
        "name":student.name,
        "scores_name":result.course.subject.scores,
        "scores":result.scores,
        "final_result": get_final_result(scores=result.scores, scores_weights=result.course.subject.weights)
    } for student, result in students])