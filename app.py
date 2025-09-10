from flask import Flask, render_template, request, jsonify
import google.generativeai as genai

genai.configure(api_key="AIzaSyCjQihAK86WBUqnDzycuTWpE7gMZvOqJik")

# Set up the model
generation_config = {
  "temperature": 0.9,
  "top_p": 1,
  "top_k": 1,
  "max_output_tokens": 2048,
}

# Initialize the model
model = genai.GenerativeModel(
    model_name="gemini-1.0-pro",
    generation_config=generation_config,
)

#we create this list to store conversation messages and this list will be fed into the model in each message to remember the conversation ( this is done in only session)
conversation_history = []

# Function to send message and update conversation history
def send_message_and_update_history(convo, message):
    # Send the message and get the response
    response = convo.send_message(message)
    # Assume response.text or a similar property; adjust based on actual API documentation
    response_text = response.text if hasattr(response, 'text') else 'Response attribute not found.'
    conversation_history.append({"user": message, "bot": response_text})
    return response_text

# Start the chat session
convo = model.start_chat(history=conversation_history)


app = Flask(__name__)

@app.route("/")
def index():
    return render_template('chat.html')


@app.route("/get", methods=["GET", "POST"])
def chat():
    msg = request.form["msg"]
    input = msg
    return send_message_and_update_history(convo,input)


if __name__ == '__main__':
    app.run()
