from . import db
from pgvector.sqlalchemy import Vector
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Column, Integer

    
class Face_of_student(db.Model):

    __tablename__ = 'face_of_student'
    id = db.Column(db.Integer, primary_key = True, autoincrement = True)
    extracted_face = db.Column(Vector(512))

    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))


class Class(db.Model):
    __tablename__ = 'class'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    estab_date = db.Column(db.Date)



class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    personal_id = db.Column(db.String(15), unique=True)
    phone_number = db.Column(db.String(10))
    address = db.Column(db.String(50))
    role = db.Column(db.Integer)
    date_of_joining = db.Column(db.Date)
    email = db.Column(db.String(50))
    school_id = db.Column(db.String(15), nullable = False, unique=True)
    password_hash = db.Column(db.String(200), nullable = True)
    first_login = db.Column(db.Boolean)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=True)

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

    id = db.Column(db.Integer, primary_key = True)
    subject_name = db.Column(db.String(100))
    number_of_credit = db.Column(db.Integer)
    description = db.Column(db.String(300))
    subject_id = db.Column(db.String(15), unique = True)
    total_of_lessons = db.Column(db.Integer)
    weight_score_1 = db.Column(db.Integer)
    weight_score_2 = db.Column(db.Integer)



class Admin(db.Model):
    __tablename__ = 'admin'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    personal_id = db.Column(db.String(15))
    phone_number = db.Column(db.String(10))
    address = db.Column(db.String(50))
    date_of_joining = db.Column(db.Date)
    email = db.Column(db.String(50))
    login_name = db.Column(db.String(10), nullable = True)
    password_hash = db.Column(db.String(200), nullable = True)

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

    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer)
    start_date = db.Column(db.Date)
    finish_date = db.Column(db.Date)
    status = db.Column(db.Boolean)
    order = db.Column(db.Integer)



class Course(db.Model):
    __tablename__ = 'course'

    id = db.Column(db.Integer, primary_key=True)
    semester_id = db.Column(db.Integer, db.ForeignKey('semester.id'))
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'))
    cost = db.Column(db.Integer)

        

    

class ClassDay(db.Model):
    __tablename__ = 'class_day'

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    day = db.Column(db.Date)
    status = db.Column(db.Boolean)

    prior = Column(ARRAY(Integer))

    

# class ClassPrior(db.Model):
#     __tablename__ = 'class_prior'

#     id = db.Column(db.Integer, primary_key=True)
#     class_day_id = db.Column(db.Integer, db.ForeignKey('class_day.id'))
#     order = db.Column(db.Integer)



class Result(db.Model):
    __tablename__ = 'result'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    score_1 = db.Column(db.Integer)
    score_2 = db.Column(db.Integer)
    final_score = db.Column(db.Integer)
    paid_tuition = db.Column(db.Boolean)



class DayOff(db.Model):
    __tablename__ = 'day_off'

    id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey('result.id'))
    class_day_id = db.Column(db.Integer, db.ForeignKey('class_day.id'))


class Change_Info_Request(db.Model):
    __tablename__ = 'change_info_request'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    personal_id = db.Column(db.String(15))
    phone_number = db.Column(db.String(10))
    address = db.Column(db.String(50))
    email = db.Column(db.String(50))
    status = db.Column(db.Boolean)

    school_id = db.Column(db.String(15), db.ForeignKey('user.school_id'))



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
# ClassDay.class_priors = db.relationship('ClassPrior', back_populates='class_day')
ClassDay.day_offs = db.relationship('DayOff', back_populates='class_day')

# ClassPrior.class_day = db.relationship('ClassDay', back_populates='class_priors')

Result.student = db.relationship('User', back_populates='results')
Result.course = db.relationship('Course', back_populates='results')
Result.day_offs = db.relationship('DayOff', back_populates='result')

DayOff.result = db.relationship('Result', back_populates='day_offs')
DayOff.class_day = db.relationship('ClassDay', back_populates='day_offs')

Change_Info_Request.user = db.relationship('User', back_populates='change_info_request')
User.change_info_request = db.relationship('Change_Info_Request', back_populates='user')