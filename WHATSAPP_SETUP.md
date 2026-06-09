# WhatsApp Integration Setup Guide

## Overview
Your Goofy bot now has a WhatsApp webhook endpoint that receives messages from Twilio and responds automatically. All conversations are logged to the same `logs.json` file.

## How It Works
1. User clicks WhatsApp link from the web chat
2. User sends a message on WhatsApp
3. Twilio receives the message and sends a webhook POST request to your `/whatsapp` endpoint
4. Bot processes the message through the same logic as the web chat
5. Response is sent back to user via WhatsApp
6. Interaction is logged to `logs.json`

## Setup Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get Twilio Credentials
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Copy your **Account SID** and **Auth Token**
3. You already have the WhatsApp Sandbox number: `+27792728279`

### 3. Set Environment Variables

**Option A: Using .env file (Local Development)**
```bash
cp .env.example .env
```
Then edit `.env` with your Twilio credentials:
```
TWILIO_ACCOUNT_SID=your_actual_sid_here
TWILIO_AUTH_TOKEN=your_actual_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+27792728279
```

**Option B: Set directly (Production - Render/Heroku)**
In your deployment platform, add environment variables:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER` (optional, defaults to sandbox)

### 4. Configure Twilio Webhook in Sandbox

1. Go to [Twilio Sandbox](https://www.twilio.com/console/sms/whatsapp/learn)
2. Under "When a message comes in", set the webhook URL to:
   ```
   https://your-domain.com/whatsapp
   ```
   (Replace with your actual deployed URL)
3. Method: **POST**
4. Save

### 5. Test Locally
```bash
python app/bot.py
```
Then use Twilio's testing tools or actual WhatsApp to send test messages.

## WhatsApp Sandbox
Your sandbox number is: `+27792728279`

**To test:**
1. Send `join <code>` to the sandbox number (Twilio provides the code)
2. Then send: `pap`, `bobotie`, `stew`, or `kota`
3. Bot should respond with wine pairing

## File Changes
- **bot.py**: Added Twilio client, WhatsApp webhook endpoint (`/whatsapp`), message sending function
- **requirements.txt**: Created with dependencies (Flask, twilio, python-dotenv)
- **.env.example**: Template for environment variables

## Endpoints Summary
- `POST /` → Web chat interface (index.html)
- `POST /chat` → Web chat API
- `POST /whatsapp` → WhatsApp webhook (receives Twilio messages)

## Logs
All conversations (web + WhatsApp) are logged to `app/logs.json` with:
- User input
- Bot reply
- Status (matched/unknown)
- Timestamp

## Troubleshooting

**"Twilio not configured" message?**
- Check environment variables are set correctly
- Restart the Flask app after setting env vars
- Use: `echo $TWILIO_ACCOUNT_SID` to verify

**No response on WhatsApp?**
- Verify webhook URL in Twilio console matches your deployed app
- Check Twilio logs for webhook failures
- Ensure bot responds to test messages on web chat first

**Emojis not showing in WhatsApp?**
- WhatsApp supports emojis, but encoding matters
- Current code uses Unicode: `\ud83d\udf77` = 🍷
- Should display correctly; test with actual number

## Next Steps (Optional)
- Add user tracking (store WhatsApp number → web chat user mapping)
- Create dashboard to view both channels' conversations
- Add command support (e.g., "show all dishes", "help")
- Implement WhatsApp message templates for better formatting
