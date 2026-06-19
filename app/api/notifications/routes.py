from flask import Blueprint, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import requests
import json

import os

cred_path = os.getenv('FIREBASE_CRED_PATH')
if cred_path:
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        # Firebase already initialized
        pass
else:
    try:
        firebase_admin.initialize_app()
    except ValueError:
        pass
db = firestore.client()
collection_ref = db.collection('Users')
docs = collection_ref.stream()

notify_bp = Blueprint('notification',__name__,)


@notify_bp.route('/send')
def send_notifications():
    try:
        device_tokens = []

        query = collection_ref.where(filter=FieldFilter(field_path='deviceToken', op_string='!=', value="")).stream()

        for doc in query:
            if doc.to_dict()['deviceToken']!=None:
                device_tokens.append(doc.to_dict()['deviceToken'])
                print(f'{doc.to_dict()["name"]}:{doc.to_dict()["role"]}')

        print(device_tokens);
        for token in device_tokens:
            body = {
                "to": token,
                "notification": {
                    "title": "Scan Your Head right away!",
                    "body": "Open ScalpSense app"
                }
            }

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"key={os.getenv('FCM_SERVER_KEY', 'YOUR_FCM_SERVER_KEY')}"
            }

            response = requests.post(
                "https://fcm.googleapis.com/fcm/send",
                headers=headers,
                json=body
            )

            if response.status_code == 200:
                print("Message sent successfully to:", token)
            else:
                print("Failed to send message to:", token, ". Status code:", response.status_code)

        return jsonify({"tokens": device_tokens})
    except Exception as e:
        print("Error:", e)
        return jsonify({"Error": "Failed to send notifications"})


