Pro Chatbot Widget (PHP + OpenAI)
A professional, responsive floating website chatbot built with HTML,
CSS, vanilla JavaScript, PHP, and the OpenAI Responses API. The widget
can be embedded on multiple pages or websites.
Requirements
- PHP 8.0+ with cURL enabled
- An OpenAI API key with API billing/access configured
- HTTPS for production
1. Configure the server
Create or update config.php in the project root:
<?php

return [
    'api_key' => '',
    'model'   => '',
];
Add your OpenAI API key and the model you want to use in the empty
values. Do not commit a real API key to GitHub. Keep production
secrets in server-side environment variables or a private configuration
file excluded from version control.
2. Deploy
1. Upload the project files to your PHP-enabled web server.
2. Make sure PHP 8.0 or newer is installed and the cURL extension is
   enabled.
3. Configure the API key and model on the server.
4. Serve the website over HTTPS in production.
3. Embed the chatbot
Use the project's provided widget files and embed code in the website
pages where you want the chatbot to appear. Keep the PHP API endpoint on
the server; never expose the API key in browser-side JavaScript or HTML.
Project structure
The repository currently includes:
- api/ --- API-related PHP files
- assets/ --- frontend assets
- aitest.html --- chatbot test/demo page
- config.php --- server-side configuration
- demo.html --- demo page
- README.md --- project documentation
Security notes
- Never publish your OpenAI API key.
- Do not put API keys in HTML, CSS, or JavaScript.
- Use HTTPS in production.
- If an API key was accidentally committed or exposed, revoke it and
  create a replacement. Removing it from the latest file does not
  invalidate the exposed key.