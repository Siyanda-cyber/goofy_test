from email import message
from flask import Flask, request, render_template, jsonify
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
import os
import json
import random
import datetime
import re

# =====================
# PATH SETUP
# =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # app/
TEMPLATE_DIR = os.path.join(BASE_DIR, "..", "templates")  # templates/ at project root
RULES_FILE = os.path.join(BASE_DIR, "rules.json")        # wine pairing rules
SYN_FILE = os.path.join(BASE_DIR, "synonyms.json")      # synonyms file
LOG_FILE = os.path.join(BASE_DIR, "logs.json")

app = Flask(__name__, template_folder=TEMPLATE_DIR)

# =====================
# TWILIO SETUP
# =====================
ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
WHATSAPP_NUMBER = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

if ACCOUNT_SID and AUTH_TOKEN:
    twilio_client = Client(ACCOUNT_SID, AUTH_TOKEN)
else:
    twilio_client = None

# =====================
# LOAD JSON FILES
# =====================
def load_json(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {}

rules = load_json(RULES_FILE)
synonyms = load_json(SYN_FILE)

# =====================
# LOGGING FUNCTION
# =====================
def log_interaction(user_input, bot_reply, status="matched"):
    try:
        if not os.path.exists(LOG_FILE):
            with open(LOG_FILE, "w") as f:
                json.dump([], f)

        with open(LOG_FILE, "r+", encoding="utf-8") as f:
            data = json.load(f)
            data.append({
                "input": user_input,
                "reply": bot_reply,
                "status": status,
                "time": str(datetime.datetime.now())
            })
            f.seek(0)
            json.dump(data, f, indent=2)
    except Exception as e:
        print("Logging error:", e)

# =====================
# FIND DISH FUNCTION WITH SYNONYMS
# =====================
def find_dish(message, rules, synonyms):
    """
    Find the dish by matching message to either the dish name
    or any of its synonyms.
    """
    message = message.lower()
    # Remove punctuation
    message = re.sub(r'[^\w\s]', '', message)
    # Check direct dish match
    for dish in rules:
        if dish.lower() in message:
            return dish
    # Check synonyms
    for dish, syn_list in synonyms.items():
        for syn in syn_list:
            syn_clean = syn.lower()
            if syn_clean in message:
                return dish
    return None

# =====================
# GOOFY PERSONALITY
# =====================
def get_intro():
    return random.choice([
        "Goofy here! 🍷 Let’s talk South African food!",
        "Ahh my friend! Goofy knows these flavors well 🍷",
        "Now that is a proper South African meal! 🇿🇦",
    ])

# =====================
# HOME ROUTE
# =====================
@app.route("/")
def home():
    return render_template("index.html")

# =====================
# CHAT ENDPOINT
# =====================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "").strip().lower()
    goofy_init = data.get("event")

    if goofy_init == "goofy_init":
        reply = (
            "👋 ***Ekse, Awe, Goofy here!***🍷 Let’s talk South African food!\n\n"
            "You know local is lekker so let Goofy wine and dine you 🍷\n\n"
            "**📱 Prefer WhatsApp?!** \n\n"
            "*Well with **Goofy**, you can continue there anytime.*"
            "\n\n"
        )

        whatsapp_link = (
            "https://wa.me/+14155238886"
            "?text=START_GOOFY_BOT"
        )

        return jsonify({
            "reply": reply,
            "show_qr": True,
            "whatsapp_link": whatsapp_link
        })
    dish = find_dish(message, rules, synonyms)

    if dish:
        wine = random.choice(rules[dish])
        reply = (
        f"{get_intro()}\n\n"
        f"Excellent choice! 🍽️\n\n"
        f"Today you're looking at **{dish.title()}**.\n\n"
        f"🍷 Goofy's recommendation:\n"
        f"👉 {wine}\n\n"
        f"Why this works:\n"
        f"This wine complements the flavour profile of the dish and helps bring out the best of the food experience.\n\n"
        f"🇿🇦 Local is lekker.\n\n"
        f"🛎️ Ready to order?\n"
        f"Raise your hand and call the waiter.\n\n"
        f"Tell them:\n"
        f"'I'd like the {dish.title()} with a glass of {wine} please.'"
    )
        log_interaction(message, reply, "matched")
        return jsonify({"reply": reply})
        
fallback = (
    "🍷 Welcome to Goofy Food & Wine Advisor.\n\n"
    "Please choose a plate:\n\n"
    "🍖 Braai Plate\n"
    "🥘 Comfort Plate\n"
    "🍛 Curry Plate\n"
    "🌽 Heritage Plate\n"
    "🐟 Seafood Plate\n"
    "🍮 Dessert Plate\n\n"
    "Or tell me a dish such as:\n"
    "• Bobotie\n"
    "• Shisa Nyama\n"
    "• Oxtail Potjie\n"
    "• Umngqusho\n"
    "• Bunny Chow\n"
    "• Malva Pudding\n\n"
    "I'll recommend the perfect South African wine pairing."
)
    )
    log_interaction(message, fallback, "unknown")
    return jsonify({"reply": fallback})



# =====================
# SEND MESSAGE VIA WHATSAPP
# =====================
def send_whatsapp_message(to_number, message_body):
    """Send message to user via WhatsApp through Twilio"""
    if not twilio_client:
        print("Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.")
        return False
    try:
        message = twilio_client.messages.create(
            from_=WHATSAPP_NUMBER,
            to=to_number,
            body=message_body
        )
        print(f"Message sent: {message.sid}")
        return True
    except Exception as e:
        print(f"Error sending WhatsApp message: {e}")
        return False

# =====================
# CHAT ENDPOINT : Whatsapp Webhook
# =====================
@app.route("/whatsapp", methods=["POST"])
def whatsapp_webhook():
    """
    Receive messages from Twilio WhatsApp webhook.
    Process through bot logic and send response back.
    """
    # Get incoming message data from Twilio
    in_message = request.form.get("Body", "").strip()
    sender = request.form.get("From", "")
    
    print(f"WhatsApp message from {sender}: {in_message}")
    
    # Process message through bot logic
    message = in_message.lower()
    dish = find_dish(message, rules, synonyms)
    
    if dish:
        wine = random.choice(rules[dish])
        reply = (
            f"{get_intro()}\n\n"
            f"You're enjoying {dish.title()}!\n\n"
            f"That pairs beautifully with:\n"
            f"👉 {wine} 🍷\n\n"
            f"South African food + wine = magic 🇿🇦"
        )
        
        log_interaction(in_message, reply, "matched")
    else:
        reply = (
            "Goofy says: I'm still learning that dish 🍷\n\n"
            "Try: pap, bobotie, stew or kota!"
        )
        log_interaction(in_message, reply, "unknown")
    
    # Send response back via Twilio
    send_whatsapp_message(sender, reply)
    
    # Return TwiML response (required by Twilio)
    response = MessagingResponse()
    response.message(reply)
    return str(response)


# =====================
# RUN LOCAL OR RENDER
# =====================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
