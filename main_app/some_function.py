from datetime import date, timedelta, datetime
from flask import jsonify
from .models import (
    Semester, User, Subject, Course
)
from datetime import datetime
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify





def get_days(number_of_classday: int, date_obj: date, target_weekday: list):

    monday = date_obj - timedelta(days=date_obj.weekday())
    index = 0
    days = []
    while True:
        day = monday + timedelta(days=int(target_weekday[index])-2)
        if day > date_obj:
            days.append(day)
        if len(days) == number_of_classday:
            return days
        index += 1
        if index == len(target_weekday):
            monday += timedelta(days=7)
            index = 0
        




def get_order(date: str):
    if date:
        if type(date) is str:
            date = datetime.strptime(date, "%d/%m/%Y")
        if date.month > 6 or (date.day > 1 and date.month > 6): 
            return 2 
        else: return 1
    return None





def insert_year(date, year):
    if date is not None:
        date = datetime.strptime(date,'%d/%m')
        date = date.replace(year=int(year))
        return date
    return None


def check_duplicate(schedule, schedules):
    print(schedule, schedules)
    for sch in schedules:
        for day, perior in sch.items():
            if str(day) in schedule:
                for per in perior:
                    print(per, schedule[str(day)])
                    if per in schedule[str(day)]:
                        return False
    return True


def get_final_result(scores, scores_weights):
    if None in scores:
        return None
    sum_ = 0
    for index in range(len(scores)):
        sum_ += scores[index]*scores_weights[index]
    return sum_/100


def get_gpa2(score):
    if score >= 8.5: return 4
    if score >= 7.7: return 3.5
    if score >= 7.0: return 3
    if score >= 6.2: return 2.5
    if score >= 5.5: return 2
    if score >= 4.7: return 1.5
    if score >= 4: return 1
    return 0


if __name__ == "__main__":

    today = date(2025, 10, 20)
    days = get_days(number_of_classday=15, date_obj=today, target_weekday=[3, 6, 8])
    print(len(days))
    print(days)



def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in roles:
                return jsonify({
                    "msg": "Forbidden",
                    "required_roles": roles
                }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper