import json

from flask import Flask, render_template, send_from_directory, request, redirect, url_for, flash
from form import MessageForm
from flask_bootstrap import Bootstrap5
import smtplib
import os

my_email = os.environ.get('EMAIL')
password = os.environ.get('EMAIL_PASSCODE')

app = Flask(__name__)  # name of current directory
app.config['SECRET_KEY'] = os.environ.get("FLASK_KEY")
Bootstrap5(app)

# web app
# URL
# https://prashannaraj.com.np/  # SSL Secure Sockets Layer

@app.route('/', methods=['POST', 'GET'])
def home():
    return render_template("index.html")

@app.route('/contact', methods=['POST', 'GET'])
def contact():
    message_form = MessageForm()
    if message_form.validate_on_submit():
        name = message_form.name.data
        email = message_form.email.data
        sub = message_form.subject.data
        message = message_form.message.data
        flash(message="Message Sent", category='success')
        with smtplib.SMTP("smtp.gmail.com", 587) as connection:
            connection.starttls()
            connection.login(user=my_email, password=password)
            connection.sendmail(from_addr=my_email, to_addrs="erprp99@gmail.com",
                                msg=f"Subject:{sub}\n\n{message}\n\nFrom:{name}\n{email}")
            connection.sendmail(from_addr=my_email, to_addrs=email,
                                msg=f"Subject:Message Received\n\n\nThanks for contacting me {name}. I'll reach out to you soon.\n\n\nSincerely,\n\nPrashanna Raj Pandit")
        return redirect(url_for('home'))
    return render_template("contact.html", form=message_form)

def send_message(message_form):
    name = message_form.name.data
    email = message_form.email.data
    sub = message_form.subject.data
    message = message_form.message.data
    # flash(message="Message Sent", category='success')
    with smtplib.SMTP("smtp.gmail.com", 587) as connection:
        connection.starttls()
        connection.login(user=my_email, password=password)
        connection.sendmail(from_addr=my_email, to_addrs="erprp99@gmail.com",
                            msg=f"Subject:{sub}\n\n{message}\n\nFrom:{name}\n{email}")
        connection.sendmail(from_addr=my_email, to_addrs=email,
                            msg=f"Subject:Message Received\n\n\nThanks for contacting me {name}. I'll reach out to you soon.\n\n\nSincerly,\n\nPrashanna Raj Pandit")
    return redirect(url_for('home'))


@app.route('/skills',methods=['POST','GET'])
def skills():
    message_form = MessageForm()
    if message_form.validate_on_submit():
        send_message(message_form)
    return render_template("skills.html", form=message_form)


@app.route('/download')
def download():
    return send_from_directory('static', path='files/Resume.pdf')


@app.route('/recent_works',methods=['POST','GET'])
def all_recent_work():
    # with open('static/data/projects.json', 'r') as f:
    #     data = json.load(f)
    message_form = MessageForm()
    if message_form.validate_on_submit():
        send_message(message_form)
    # print(data)
    return render_template("recent_work.html", form=message_form)


if __name__ == "__main__":
    app.run(debug=True)
