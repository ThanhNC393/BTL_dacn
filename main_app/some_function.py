from datetime import date, timedelta
from flask import jsonify
from .models import (
    Semester, User, Subject, Course
)


def get_days(number_of_classday: int, date_obj: date, target_weekday: list):

    monday = date_obj - timedelta(days=date_obj.weekday())
    # return monday + timedelta(days=target_weekday)
    index = 0
    days = []
    while True:
        days.append(monday + timedelta(days=int(target_weekday[index])-2))
        if len(days) == number_of_classday:
            return days
        index += 1
        if index == len(target_weekday):
            monday += timedelta(days=7)
            index = 0
        




class Semester_Exception(Exception):
    pass

def check_semester(year, order):
    semester = Semester.query.filter_by(
        year = year or None,
        order = order or None
    ).first()
    if not semester:
        raise Semester_Exception
    return semester





class Teacher_Exception(Exception):
    pass

def check_teacher(teacher_id):
    teacher = User.query.filter_by(
        school_id = teacher_id,
        role = 0
    ).first()
    if not teacher:
        raise Teacher_Exception
    return teacher




class Subject_Exception(Exception):
    pass

def check_subject(subject_id):
    subject = Subject.query.filter_by(
        subject_id = subject_id
    ).first()
    if not subject:
        raise Subject_Exception
    return subject





class Course_Exception(Exception):
    pass

def check_course(course_id):
    course = Course.query.filter_by(course_id = course_id).first()
    if not course:
        raise Course_Exception
    return course



if __name__ == "__main__":

    today = date(2025, 10, 20)
    days = get_days(number_of_classday=15, date_obj=today, target_weekday=[3, 6, 8])
    print(len(days))
    print(days)