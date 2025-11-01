from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import (
    Column, Integer, ForeignKey, String, Date, Boolean, Float
)
from sqlalchemy.orm import validates 


    
class Account(db.Model):

    __tablename__ = 'account'
    id = Column(Integer, primary_key = True, autoincrement = True)
    account_name = Column(String(15), unique = True)
    password_hash = Column(String(200), nullable = True)
    first_login = Column(Boolean)

    school_id = Column(String(15), ForeignKey('user.school_id'))

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, plain_password):
        self.password_hash = generate_password_hash(plain_password)

    def verify_password(self, plain_password):
        return check_password_hash(self.password_hash, plain_password)


class Class(db.Model):
    __tablename__ = 'class'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    estab_date = Column(Date)



class User_Exception(Exception):
    pass

class User(db.Model):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    personal_id = Column(String(15), unique=True)
    phone_number = Column(String(10))
    address = Column(String(50))
    role = Column(Integer)
    date_of_joining = Column(Date)
    email = Column(String(50))
    school_id = Column(String(15), unique=True)
    class_id = Column(Integer, ForeignKey('class.id'), nullable=True)


    @staticmethod
    def get_user(school_id, role = None):
        if role is not None:
            teacher = User.query.filter_by(
                school_id = school_id,
                role = role
            ).first()
        else:
            teacher = User.query.filter_by(
                school_id = school_id
            ).first()
        if not teacher:
            raise User_Exception
        return teacher



class Subject_Exception(Exception):
    pass

class Subject(db.Model):
    __tablename__ = 'subject'

    id = Column(Integer, primary_key = True)
    subject_name = Column(String(100))
    number_of_credit = Column(Integer)
    description = Column(String(300))
    subject_id = Column(String(15), unique = True)
    total_of_lessons = Column(Integer)
    scores = Column(ARRAY(String))
    weights = Column(ARRAY(Integer))


    @validates("scores", "weights")
    def validate_score_weight(self, key, value):
        if value is None:
            return value
        if key == "weights":
            if value[-1] <= 0:
                raise ValueError("sum of weights must be less than 100")
            orther = self.scores
        else: 
            orther = value

        if orther is not None:
            if len(orther) != len(value):
                raise ValueError("scores and weights must have the same length!")
        return value
    
    @staticmethod
    def get_subject(subject_id):
        subject = Subject.query.filter_by(
            subject_id = subject_id
        ).first()
        if not subject:
            raise Subject_Exception
        return subject


class Admin(db.Model):
    __tablename__ = 'admin'

    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    personal_id = Column(String(15))
    phone_number = Column(String(10))
    address = Column(String(50))
    date_of_joining = Column(Date)
    email = Column(String(50))
    login_name = Column(String(10), nullable = True)
    password_hash = Column(String(200), nullable = True)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, plain_password):
        self.password_hash = generate_password_hash(plain_password)

    def verify_password(self, plain_password):
        return check_password_hash(self.password_hash, plain_password)


class Semester_Exception(Exception):
    pass

class Semester(db.Model):
    __tablename__ = 'semester'

    id = Column(Integer, primary_key=True)
    year = Column(Integer)
    start_date = Column(Date)
    finish_date = Column(Date)
    status = Column(Boolean)
    order = Column(Integer)
    semester_id = Column(String(15), unique=True)

    @staticmethod
    def get_semester(semester_id):
        semester = Semester.query.filter_by(
            semester_id = semester_id
        ).first()
        if not semester:
            raise Semester_Exception
        return semester



class Course_Exception(Exception):
    pass

class Course(db.Model):
    __tablename__ = 'course'

    id = Column(Integer, primary_key=True)
    semester_id = Column(Integer, ForeignKey('semester.id', ondelete="SET NULL"))
    teacher_id = Column(Integer, ForeignKey('user.id', ondelete="SET NULL"))
    subject_id = Column(Integer, ForeignKey('subject.id', ondelete="CASCADE"))
    course_id = Column(String(20), unique=True)
    cost = Column(Integer)

    def get_course(course_id):
        course = Course.query.filter_by(course_id = course_id).first()
        if not course:
            raise Course_Exception
        return course

        
class ClassDay(db.Model):
    __tablename__ = 'class_day'

    id = Column(Integer, primary_key=True)
    course_id = Column(String(20), ForeignKey('course.course_id', ondelete='CASCADE', onupdate='CASCADE'))
    day = Column(Date)
    status = Column(Boolean)

    prior = Column(ARRAY(Integer))

class Result_Exception(Exception):
    pass

class Result(db.Model):
    __tablename__ = 'result'

    id = Column(Integer, primary_key=True)
    student_id = Column(String(15), ForeignKey('user.school_id'))
    course_id = Column(String(20), ForeignKey('course.course_id'))
    scores = Column(ARRAY(Float))
    paid_tuition = Column(Boolean)

    def get_result(course_id):
        result = Result.query.filter_by(
            course_id = course_id
        ).first()
        if not result:
            raise Result_Exception
        return result


class DayOff(db.Model):
    __tablename__ = 'day_off'

    id = Column(Integer, primary_key=True)
    result_id = Column(Integer, ForeignKey('result.id'))
    class_day_id = Column(Integer, ForeignKey('class_day.id'))


class Change_Info_Request(db.Model):
    __tablename__ = 'change_info_request'

    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    personal_id = Column(String(15))
    phone_number = Column(String(10))
    address = Column(String(50))
    email = Column(String(50))
    status = Column(Boolean)

    school_id = Column(String(15), ForeignKey('user.school_id'))



Account.user = db.relationship('User', back_populates = 'account', uselist = False)

Class.students = db.relationship('User', back_populates='class_')

Subject.courses = db.relationship('Course', back_populates='subject', passive_deletes = True)

User.class_ = db.relationship('Class', back_populates='students')
User.account = db.relationship('Account', back_populates='user', uselist = False)
User.results = db.relationship('Result', back_populates='student')

Semester.courses = db.relationship('Course', back_populates='semester', passive_deletes = True)

Course.semester = db.relationship('Semester', back_populates='courses')
Course.teacher = db.relationship('User')
Course.subject = db.relationship('Subject', back_populates='courses')
Course.results = db.relationship('Result', back_populates='course')
Course.class_days = db.relationship('ClassDay', back_populates='course', passive_deletes = True)


ClassDay.course = db.relationship('Course', back_populates='class_days')
ClassDay.day_offs = db.relationship('DayOff', back_populates='class_day')


Result.student = db.relationship('User', back_populates='results')
Result.course = db.relationship('Course', back_populates='results')
Result.day_offs = db.relationship('DayOff', back_populates='result')

DayOff.result = db.relationship('Result', back_populates='day_offs')
DayOff.class_day = db.relationship('ClassDay', back_populates='day_offs')

Change_Info_Request.user = db.relationship('User', back_populates='change_info_request')
User.change_info_request = db.relationship('Change_Info_Request', back_populates='user')