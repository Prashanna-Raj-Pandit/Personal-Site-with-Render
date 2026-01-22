from flask import Flask, render_template, jsonify, abort
import json

app = Flask(__name__)

def load_data():
    """Load portfolio data from JSON file"""
    with open('data.json', 'r') as f:
        return json.load(f)

@app.route('/')
def index():
    """Main portfolio page"""
    data = load_data()
    return render_template('index.html', data=data)

@app.route('/skills')
def skills():
    """Skills page"""
    data = load_data()
    return render_template('skills.html', data=data)

@app.route('/project/<project_id>')
def project_detail(project_id):
    """Individual project detail page"""
    data = load_data()
    project = next((p for p in data['projects'] if p['id'] == project_id), None)
    if not project:
        abort(404)
    return render_template('project_detail.html', project=project, data=data)

@app.route('/achievement/<achievement_id>')
def achievement_detail(achievement_id):
    """Individual achievement detail page"""
    data = load_data()
    achievement = next((a for a in data['achievements'] if a['id'] == achievement_id), None)
    if not achievement:
        abort(404)
    return render_template('achievement_detail.html', achievement=achievement, data=data)

@app.route('/api/data')
def get_data():
    """API endpoint to get portfolio data"""
    data = load_data()
    return jsonify(data)

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)


