from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import uuid
import os

app = Flask(__name__)
CORS(app)  # This will allow the frontend to make requests to the backend

# Configure the SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the User model for the database
class User(db.Model):
    userId = db.Column(db.String(80), primary_key=True, unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False) # In a real app, hash this password!
    balance = db.Column(db.Float, nullable=False, default=100.0)

    def __repr__(self):
        return f'<User {self.email}>'

@app.route('/signup', methods=['POST'])
def signup():
    data = request.form
    email = data.get('email')
    name = data.get('fullName')
    password = data.get('password')

    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User with this email already exists'}), 409

    # Generate a unique 7-character alphanumeric user ID
    while True:
        user_id = uuid.uuid4().hex[:7]
        if not User.query.filter_by(userId=user_id).first():
            break

    new_user = User(
        userId=user_id,
        name=name,
        email=email,
        password=password, # In a real app, hash this password!
        balance=0 # Set starting balance to 0
    )
    db.session.add(new_user)
    db.session.commit()
    
    print(f"User signed up: {new_user}")

    return jsonify({'message': 'Signup successful'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.form
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    email = email.strip()
    password = password.strip()

    print(f"--- Login attempt: email='{email}' password='{password}'") # Debug logging

    # Regular user login
    user = User.query.filter_by(email=email).first()

    if user and user.password == password:
        user_data = {
            'userId': user.userId,
            'name': user.name,
            'email': user.email,
            'balance': user.balance,
            'isAdmin': False
        }
        print(f"User logged in: {user_data}")
        return jsonify(user_data), 200

    # If neither admin nor user credentials match
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin/find_user', methods=['GET'])
def find_user():
    user_id = request.args.get('userId')
    print(f"--- Admin: Searching for user_id: {user_id}")  # Logging
    if not user_id:
        print("--- Admin: User ID not provided in request")  # Logging
        return jsonify({'error': 'User ID is required'}), 400

    user = User.query.filter_by(userId=user_id).first()

    if user:
        print(f"--- Admin: Found user: {user.name}")  # Logging
        return jsonify({
            'userId': user.userId,
            'name': user.name,
            'email': user.email,
            'balance': user.balance
        }), 200
    else:
        print("--- Admin: User not found in database")  # Logging
        return jsonify({'error': 'User not found'}), 404

@app.route('/api/admin/fund_account', methods=['POST'])
def fund_account():
    data = request.form
    user_id = data.get('userId')
    try:
        amount = float(data.get('amount'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount'}), 400

    if not user_id or amount <= 0:
        return jsonify({'error': 'User ID and a positive amount are required'}), 400

    user = User.query.filter_by(userId=user_id).first()

    if user:
        user.balance += amount
        db.session.commit()
        return jsonify({
            'message': 'Account funded successfully',
            'new_balance': user.balance
        }), 200
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/withdraw', methods=['POST'])
def withdraw():
    data = request.form
    user_id = data.get('userId')
    amount = float(data.get('amount'))

    user = User.query.filter_by(userId=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.balance < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    user.balance -= amount
    db.session.commit()

    return jsonify({'message': 'Withdrawal successful', 'new_balance': user.balance}), 200

@app.route('/transfer', methods=['POST'])
def transfer():
    data = request.form
    user_id = data.get('userId')
    amount = float(data.get('amount'))

    user = User.query.filter_by(userId=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.balance < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    user.balance -= amount
    db.session.commit()

    return jsonify({'message': 'Transfer successful', 'new_balance': user.balance}), 200

def create_tables():
    print("--- Attempting to create database tables...")
    with app.app_context():
        db.create_all()
    # Check if the file was created
    db_path = os.path.join(basedir, 'users.db')
    if os.path.exists(db_path):
        print(f"--- Database file '{db_path}' created successfully.")
    else:
        print(f"--- ERROR: Database file '{db_path}' was NOT created.")

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, port=5000)
