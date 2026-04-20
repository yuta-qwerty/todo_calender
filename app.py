from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)
DB_FILE = 'todo.db'

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                date TEXT NOT NULL,
                importance TEXT,
                completed BOOLEAN NOT NULL CHECK (completed IN (0, 1))
            )
        ''')
        conn.commit()

init_db()

def evaluate_importance_ai(title, description):
    """
    タスクの重要度を判定するAI用関数。
    """
    

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM tasks')
        tasks = [dict(row) for row in c.fetchall()]
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    date = data.get('date')
    
    # ここでAIによる重要度判定を実行
    importance = evaluate_importance_ai(title, description)
    
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('INSERT INTO tasks (title, description, date, importance, completed) VALUES (?, ?, ?, ?, ?)',
                  (title, description, date, importance, 0))
        conn.commit()
        task_id = c.lastrowid
        
    return jsonify({
        'id': task_id,
        'title': title,
        'description': description,
        'date': date,
        'importance': importance,
        'completed': 0
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    completed = data.get('completed', 0)
    
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('UPDATE tasks SET completed = ? WHERE id = ?', (completed, task_id))
        conn.commit()
        
    return jsonify({'success': True})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        conn.commit()
        
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=8080)
