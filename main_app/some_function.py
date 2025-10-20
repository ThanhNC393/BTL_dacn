from datetime import date, timedelta


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
        

if __name__ == "__main__":

    today = date(2025, 10, 20)
    days = get_days(number_of_classday=15, date_obj=today, target_weekday=[3, 6, 8])
    print(len(days))
    print(days)