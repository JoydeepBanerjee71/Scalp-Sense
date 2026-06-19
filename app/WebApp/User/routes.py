from flask import Blueprint, render_template, redirect, url_for, jsonify, session
import sqlite3

IMAGE_DB_PATH = './app/database/user_images.db'
user_bp = Blueprint('user',__name__)

@user_bp.route('/home')
def home():
    return render_template('User/user_home.html')

@user_bp.route('/about')
def about_default():
    return redirect(url_for('main.web.user.home', _anchor='about_us'))

@user_bp.route('/about/<person>')
def about(person=None):
    if person == 'joydeep':
        IMAGE_URL = url_for('static', filename='css/User/img/joydeep.jpeg')
        NAME = 'JOYDEEP BANERJEE'
        DESCRIPTION = """
            Joydeep Banerjee led the ScalpSense team. As the project lead, he ideated the overall project and system design, and spearheaded the development of our Machine Learning models and the AI Chatbot. 
            <br><br>
            Joydeep also designed the user interface (UI), managed the Firebase integration, and collaborated extensively on building the robust backend infrastructure that powers the platform alongside Souptik.
        """
        LINKEDIN = '#'
        GITHUB = '#'
        return render_template('User/user_aboutus.html', IMAGE_URL=IMAGE_URL, NAME=NAME, DESCRIPTION=DESCRIPTION, LINKEDIN=LINKEDIN, GITHUB=GITHUB)

    elif person == 'souptik':
        IMAGE_URL = url_for('static', filename='css/User/img/souptik.jpeg')
        NAME = 'SOUPTIK SAHA'
        DESCRIPTION = """
            Souptik Saha is the driving force behind ScalpSense's frontend development. He built out the entire frontend structure, ensuring a seamless and modern user experience.
            <br><br>
            In addition to his frontend work, Souptik designed the API endpoints and worked closely on the backend architecture alongside Joydeep, ensuring smooth communication between the frontend and our ML models.
        """
        LINKEDIN = '#'
        GITHUB = '#'
        return render_template('User/user_aboutus.html', IMAGE_URL=IMAGE_URL, NAME=NAME, DESCRIPTION=DESCRIPTION, LINKEDIN=LINKEDIN, GITHUB=GITHUB)

    return redirect(url_for('main.web.user.home', _anchor='about_us'))

@user_bp.route('/info')
def info():
    return render_template('User/user_info.html')

@user_bp.route('self-test')
def self_test():
    return render_template('User/user_selftest.html')


@user_bp.route('self-test/<method>')
def self_test_method(method):
    if method == 'capture':
        return render_template('User/user_selftest_capture.html')
    elif method == 'upload':
        return render_template('User/user_selftest_upload.html')
    elif method == 'result':
        return render_template('User/user_selftest_result.html')
    elif method == 'history':
        return render_template('User/user_selftest_history.html')
    elif method == 'form':
        return render_template('User/user_selftest_form.html')
    else:
        return redirect(url_for('main.web.user.self_test'))
    
@user_bp.route('chat')
def chat():
    return render_template('User/user_chat.html')
    
@user_bp.route('profile')
def profile():
    return render_template('User/user_profile.html')

@user_bp.route('marketplace')
def marketplace():
    return render_template('User/user_marketplace.html')
    