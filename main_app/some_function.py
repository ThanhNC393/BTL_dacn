from datetime import date, timedelta, datetime
from flask import jsonify
from .models import (
    Semester, User, Subject, Course
)
from datetime import datetime


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




def get_final_result(scores, scores_weights):
    sum_ = 0
    for index in range(len(scores)):
        sum_ += scores[index]*scores_weights[index]
    return sum_/100



if __name__ == "__main__":

    today = date(2025, 10, 20)
    days = get_days(number_of_classday=15, date_obj=today, target_weekday=[3, 6, 8])
    print(len(days))
    print(days)