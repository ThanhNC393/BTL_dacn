from . import db
from pgvector.sqlalchemy import Vector
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import (Column, Integer, ForeignKey, String, Date, Boolean,
                        )

    
class Face_of_student(db.Model):

    __tablename__ = 'face_of_student'
    id = Column(Integer, primary_key = True, autoincrement = True)
    extracted_face = Column(Vector(512))

    student_id = Column(Integer, ForeignKey('user.id'))


class Class(db.Model):
    __tablename__ = 'class'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    estab_date = Column(Date)



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
    password_hash = Column(String(200), nullable = True)
    first_login = Column(Boolean)
    class_id = Column(Integer, ForeignKey('class.id'), nullable=True)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, plain_password):
        self.password_hash = generate_password_hash(plain_password)

    def verify_password(self, plain_password):
        return check_password_hash(self.password_hash, plain_password)


class Subject(db.Model):
    __tablename__ = 'subject'

    id = Column(Integer, primary_key = True)
    subject_name = Column(String(100))
    number_of_credit = Column(Integer)
    description = Column(String(300))
    subject_id = Column(String(15), unique = True)
    total_of_lessons = Column(Integer)
    weight_score_1 = Column(Integer)
    weight_score_2 = Column(Integer)



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



class Semester(db.Model):
    __tablename__ = 'semester'

    id = Column(Integer, primary_key=True)
    year = Column(Integer)
    start_date = Column(Date)
    finish_date = Column(Date)
    status = Column(Boolean)
    order = Column(Integer)



class Course(db.Model):
    __tablename__ = 'course'

    id = Column(Integer, primary_key=True)
    semester_id = Column(Integer, ForeignKey('semester.id'))
    teacher_id = Column(Integer, ForeignKey('user.id'))
    subject_id = Column(Integer, ForeignKey('subject.id'))
    course_id = Column(String(20), unique=True)
    cost = Column(Integer)

        

    

class ClassDay(db.Model):
    __tablename__ = 'class_day'

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('course.id'))
    day = Column(Date)
    status = Column(Boolean)

    prior = Column(ARRAY(Integer))




class Result(db.Model):
    __tablename__ = 'result'

    id = Column(Integer, primary_key=True)
    student_id = Column(String(15), ForeignKey('user.school_id'))
    course_id = Column(String(20), ForeignKey('course.course_id'))
    score_1 = Column(Integer)
    score_2 = Column(Integer)
    final_score = Column(Integer)
    paid_tuition = Column(Boolean)



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



Face_of_student.student = db.relationship('User', back_populates = 'face')

Class.students = db.relationship('User', back_populates='class_')

Subject.courses = db.relationship('Course', back_populates='subject')

User.class_ = db.relationship('Class', back_populates='students')
User.face = db.relationship('Face_of_student', back_populates='student')
User.results = db.relationship('Result', back_populates='student')

Semester.courses = db.relationship('Course', back_populates='semester')

Course.semester = db.relationship('Semester', back_populates='courses')
Course.teacher = db.relationship('User')
Course.subject = db.relationship('Subject', back_populates='courses')
Course.results = db.relationship('Result', back_populates='course')
Course.class_days = db.relationship('ClassDay', back_populates='course')


ClassDay.course = db.relationship('Course', back_populates='class_days')
ClassDay.day_offs = db.relationship('DayOff', back_populates='class_day')


Result.student = db.relationship('User', back_populates='results')
Result.course = db.relationship('Course', back_populates='results')
Result.day_offs = db.relationship('DayOff', back_populates='result')

DayOff.result = db.relationship('Result', back_populates='day_offs')
DayOff.class_day = db.relationship('ClassDay', back_populates='day_offs')

Change_Info_Request.user = db.relationship('User', back_populates='change_info_request')
User.change_info_request = db.relationship('Change_Info_Request', back_populates='user')