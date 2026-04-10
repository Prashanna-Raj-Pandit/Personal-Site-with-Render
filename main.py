from flask import Flask, render_template, jsonify, abort, request
import json

app = Flask(__name__)

_chat_bot = None


def get_chat_bot():
    global _chat_bot
    if _chat_bot is None:
        from src.rag_bot.chat_cli import RetrievalChatCLI
        _chat_bot = RetrievalChatCLI()
    return _chat_bot

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

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'message required'}), 400
    try:
        bot = get_chat_bot()
        answer, evidence_items = bot.communicate_api(data['message'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    evidence = [
        {
            'text': item.text[:200],
            'score': round(1 - item.distance, 3) if item.distance is not None else None,
            'source': (
                (item.metadata or {}).get('source_name')
                or (item.metadata or {}).get('document_title')
                or (item.metadata or {}).get('path', '')
                or 'Knowledge Base'
            )
        }
        for item in evidence_items
    ]

    return jsonify({
        'answer': answer,
        'evidence_count': len(evidence_items),
        'evidence': evidence
    })


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)


