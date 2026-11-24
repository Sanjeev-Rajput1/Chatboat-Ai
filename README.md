# Pro Chatbot Widget (PHP + OpenAI)

A professional, responsive floating website chatbot built with HTML, CSS, vanilla JavaScript, PHP, and the OpenAI Responses API. The widget can be embedded on multiple pages or websites.

## Requirements
- PHP 8.0+ with cURL enabled
- An OpenAI API key with API billing/access configured
- HTTPS for production

## 1. Configure the server

Set these environment variables on the server that hosts `api/chat.php`:

```bash
OPENAI_API_KEY=your_real_api_key
OPENAI_MODEL=gpt-4.1-mini
CHATBOT_ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

`CHATBOT_ALLOWED_ORIGINS` is optional but recommended. Use comma-separated exact origins, including scheme. If omitted, the endpoint permits cross-origin requests from any origin; that is convenient for testing but not recommended for a public production endpoint.

**Never put the OpenAI API key in HTML, CSS, JavaScript, a public config file, or a browser request.** Keep it on the server as an environment variable. If your host does not support environment variables, configure the key in a PHP file outside the public web root and load it securely.

## 2. Run the demo

Upload the project to a PHP-enabled server, set the environment variable, then open `demo.html` through that server. Do not open the HTML as a `file://` URL: the PHP endpoint needs to run on a web server.

Example local server (from the project directory):

```bash
php -S 127.0.0.1:8080
```

Then visit `http://127.0.0.1:8080/demo.html`. Environment variables must be available to the PHP process.

## 3. Embed on your website

Upload `assets/widget.js`, `assets/widget.css`, and `api/chat.php` to your server. Add this in the page `<head>`:

```html
<link rel="stylesheet" href="https://YOUR-DOMAIN/assets/widget.css">
```

Add this before `</body>` (update the endpoint URL):

```html
<script>
  window.ProChatbotConfig = {
    endpoint: "https://YOUR-DOMAIN/api/chat.php",
    title: "Website assistant",
    subtitle: "Online · Here to help",
    accent: "#635bff",
    accentDark: "#5148e5",
    greeting: "Hi! What can I help you with?",
    instructions: "You are the support assistant for ACME. Be helpful and concise. Do not invent company policies or prices.",
    suggestions: [
      "What services do you offer?",
      "How does it work?",
      "How can I contact you?"
    ]
  };
</script>
<script src="https://YOUR-DOMAIN/assets/widget.js" defer></script>
```

Use absolute URLs when the widget is embedded on a different domain. The `endpoint` must point to your PHP API. The API's origin allowlist must include the website's exact origin.

## Configuration options
- `endpoint` — PHP API endpoint URL
- `title` — header title
- `subtitle` — small status line
- `accent` — main brand color
- `accentDark` — hover color
- `greeting` — welcome message
- `instructions` — system-level guidance for the assistant (do not put secrets here)
- `suggestions` — array of up to four quick prompts

## Production checklist
- Add server-side rate limiting and abuse monitoring; CORS is not authentication and does not stop scripts/curl clients.
- Consider CAPTCHA or authenticated access if abuse is a concern.
- Set usage limits and alerts in your OpenAI account.
- Keep PHP and dependencies updated; serve over HTTPS.
- Avoid sending passwords, payment data, or other sensitive customer information to the model.
- Add your privacy notice and retention policy. This sample does not store conversations, but requests pass through your server to OpenAI.
- For multi-tenant/public deployments, do not let visitors control assistant instructions or model names. This sample accepts instructions from the frontend for easy setup; in production, hard-code trusted instructions server-side or map approved site IDs to server-side configurations.
- Add stronger rate limits before exposing the endpoint publicly.

## How it works
Browser widget → your PHP endpoint → OpenAI Responses API → PHP returns the assistant's text → widget displays it.

The API key never needs to be sent to the browser.
