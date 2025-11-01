from datetime import datetime
day = datetime.strptime("2025/11/02", "%Y/%m/%d")
print(day > datetime.today())


