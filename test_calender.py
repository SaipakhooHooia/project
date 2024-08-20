import calendar
import datetime
import pytz

def split_dates_by_month(dates):
  """
  將包含跨越月份日期的列表分割成多個子列表。

  Args:
    dates: 包含日期的列表。

  Returns:
    list: 包含多個子列表的列表，每個子列表代表一個月份的日期。
  """

  result = []
  current_month_dates = []

  for date in dates:
    if not current_month_dates or date >= current_month_dates[-1]:
      current_month_dates.append(date)
    else:
      result.append(current_month_dates)
      current_month_dates = [date]

  if current_month_dates:
    result.append(current_month_dates)

  return result

def get_first_day_of_week(year, month):
    """
    获取指定年月的第一天是星期几，以数字形式返回。
    0=Monday, 6=Sunday
    """
    first_day = datetime.date(year, month, 1)
    return first_day.weekday()  # 0=Monday, 6=Sunday

def test_calender():
    tz = pytz.timezone('Asia/Taipei')
    today = datetime.datetime.now(tz)
    year = today.year
    month = today.month
    day = today.day
    hour = today.hour

    print(day,hour)

    calen = calendar.Calendar()      
    if month == 1:
        last_month = 12
        last_month_calender = calen.itermonthdays3(year-1, last_month)
    else:
        last_month = month - 1
        last_month_calender = calen.itermonthdays3(year, month-1)
        last_month_dates = [x[2] for x in last_month_calender]

    this_month_calender = calen.itermonthdays3(year, month)
    this_month_dates = [x[2] for x in this_month_calender]
    
    if month == 12:
        next_month_year = year + 1
        next_month = 1
        next_month_calender = calen.itermonthdays3(year+1, next_month)
        next_next_month_year = year + 1
        next_next_month = 2
        next_next_month_calender = calen.itermonthdays3(year+1, next_next_month)
    if month == 11:
        next_next_month_year = year+1
    else:
        next_month_year = year
        next_next_month_year = year
        next_month = month + 1
        next_month_calender = calen.itermonthdays3(year, next_month)
        next_month_dates = [x[2] for x in next_month_calender]
        next_next_month = month + 2
        next_next_month_calender = calen.itermonthdays3(year, next_next_month)
        next_next_month_dates = [x[2] for x in next_next_month_calender]

    return {
        "this_year": year,
        "this_month": calendar.month_name[month],
        "this_month_dates": split_dates_by_month(this_month_dates)[1],
        "this_month_first_day": get_first_day_of_week(year, month),
        "next_month_year": next_month_year,
        "next_month": calendar.month_name[next_month],
        "next_month_dates": split_dates_by_month(next_month_dates)[1],
        "next_month_first_day": get_first_day_of_week(next_month_year, next_month),
        "next_next_month_year": next_next_month_year,
        "next_next_month": calendar.month_name[next_next_month],
        "next_next_month_dates": split_dates_by_month(next_next_month_dates)[1],
        "next_next_month_first_day": get_first_day_of_week(next_next_month_year, next_next_month),
        "today_month": calendar.month_name[month],
        "today_date": day,
        "today_hour": f'{hour}:00'
    }

'''
{'this_year': 2024, 'this_month': 'August', 
'this_month_dates': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
'this_month_first_day': 3, #禮拜四
'next_month_year': 2024, 'next_month': 'September', 'next_month_dates': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
'next_month_first_day': 6, #禮拜天
'next_next_month_year': 2024, 'next_next_month': 'October', 
'next_next_month_dates': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], 
'next_next_month_first_day': 1, #禮拜二
'today_month': 'August', 
'today_date': 12, 'today_hour': '2:00'}'''