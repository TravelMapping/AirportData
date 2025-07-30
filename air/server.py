from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='web')

@app.route('/')
def serve_index():
    return send_from_directory('web', 'airports.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
