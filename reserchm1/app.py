import os
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from moviepy.editor import VideoFileClip
import speech_recognition as sr
import tempfile

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def extract_audio_from_video(video_path):
    try:
        video_clip = VideoFileClip(video_path)
        audio_clip = video_clip.audio
        temp_audio_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio_clip.write_audiofile(temp_audio_file.name)
        return temp_audio_file.name
    except Exception as e:
        print(f"Error extracting audio: {e}")
        return None

def extract_text_from_audio(audio_path, language='en-US'):
 
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)
        text = recognizer.recognize_google(audio_data, language=language)
        return text
    except sr.UnknownValueError:
        return "Google Speech Recognition could not understand the audio."
    except sr.RequestError as e:
        return f"Could not request results from Google Speech Recognition service; {e}"
    except Exception as e:
        return f"An error occurred: {e}"

@app.route('/upload-media', methods=['POST'])
def upload_media():
    if 'file' not in request.files:
        print("File part missing in request")
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        print("No file selected")
        return jsonify({'error': 'No selected file'}), 400

    print(f"Received file: {file.filename}")
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        
        if file.filename.endswith((".mp4", ".webm", ".avi", ".mkv")):
            
            audio_path = extract_audio_from_video(file_path)
            if not audio_path:
                return jsonify({'error': 'Failed to extract audio from video'}), 500
        elif file.filename.endswith((".wav", ".mp3", ".aac", ".ogg")):
            
            audio_path = file_path
        else:
            return jsonify({'error': 'Unsupported file format'}), 400

        
        text = extract_text_from_audio(audio_path)
        if audio_path != file_path:  
            os.remove(audio_path)

        return jsonify({'message': 'File processed successfully', 'text': text}), 200
    except Exception as e:
        return jsonify({'error': f"Error during file processing: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
