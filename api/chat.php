<?php
declare(strict_types=1);

/**
 * Reusable ChatGPT-powered website chatbot endpoint.
 * Requirements: PHP 8+, cURL enabled.
 * Configure OPENAI_API_KEY as an environment variable on your server.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CHATBOT_ALLOWED_ORIGINS') ?: '')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if ($allowedOrigins && !in_array($origin, $allowedOrigins, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'This website is not allowed to use the chatbot.']);
        exit;
    }
    header('Access-Control-Allow-Origin: ' . ($allowedOrigins ? $origin : '*'));
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST for chat requests.']);
    exit;
}
$config = require __DIR__ . '/../config.php';

$apiKey = $config['api_key'] ?? '';
$model = $config['model'] ?? 'gpt-4.1-mini';
if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Chatbot is not configured. Set OPENAI_API_KEY on the server.']);
    exit;
}
if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(['error' => 'PHP cURL is required on this server.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON request.']);
    exit;
}

$messages = $data['messages'] ?? [];
if (!is_array($messages) || count($messages) === 0 || count($messages) > 20) {
    http_response_code(400);
    echo json_encode(['error' => 'Send between 1 and 20 messages.']);
    exit;
}

$input = [];
foreach ($messages as $message) {
    if (!is_array($message)) continue;
    $role = $message['role'] ?? '';
    $content = trim((string)($message['content'] ?? ''));
    if (!in_array($role, ['user', 'assistant'], true) || $content === '') continue;
    if (mb_strlen($content) > 4000) {
        http_response_code(400);
        echo json_encode(['error' => 'Each message must be 4,000 characters or fewer.']);
        exit;
    }
    $input[] = ['role' => $role, 'content' => $content];
}
if (!$input || end($input)['role'] !== 'user') {
    http_response_code(400);
    echo json_encode(['error' => 'The latest message must be from the user.']);
    exit;
}

$instructions = trim((string)($data['instructions'] ?? ''));
if ($instructions === '') {
    $instructions = 'You are a helpful, professional website assistant. Be clear, concise, accurate, and friendly. If you do not know something, say so. Do not claim to have taken actions you have not taken.';
}
$instructions = mb_substr($instructions, 0, 3000);

$payload = [
    'model' => $model,
    'instructions' => $instructions,
    'input' => $input,
    'max_output_tokens' => 800
];

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 45
]);
$response = curl_exec($ch);
$curlError = curl_error($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not connect to the AI service. ' . $curlError]);
    exit;
}
$result = json_decode($response, true);
if ($status < 200 || $status >= 300) {
    http_response_code(502);
    $message = $result['error']['message'] ?? 'The AI service returned an error.';
    echo json_encode(['error' => $message]);
    exit;
}

$answer = '';
foreach (($result['output'] ?? []) as $item) {
    if (($item['type'] ?? '') !== 'message') continue;
    foreach (($item['content'] ?? []) as $part) {
        if (($part['type'] ?? '') === 'output_text') $answer .= $part['text'] ?? '';
    }
}
$answer = trim($answer);
if ($answer === '') {
    http_response_code(502);
    echo json_encode(['error' => 'The AI returned an empty response. Please try again.']);
    exit;
}
echo json_encode(['reply' => $answer], JSON_UNESCAPED_UNICODE);
