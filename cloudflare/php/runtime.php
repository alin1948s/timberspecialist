<?php
/** Cloudflare binding bridge used by the PHP container. */

function timberCloudflareMode() {
    return getenv('TIMBER_BACKEND_MODE') === 'cloudflare';
}

function timberCloudflareRequest($method, $path, $payload = null) {
    $allowedPaths = ['/orders', '/email'];
    if (!in_array($path, $allowedPaths, true)) {
        return ['status' => 'error', 'message' => 'Rută internă nepermisă.'];
    }

    $headers = "Accept: application/json\r\n";
    $content = '';
    if ($payload !== null) {
        $headers .= "Content-Type: application/json; charset=UTF-8\r\n";
        $content = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if (!is_string($content)) {
            return ['status' => 'error', 'message' => 'Datele nu au putut fi serializate.'];
        }
    }

    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => $headers,
            'content' => $content,
            'timeout' => 12,
            'ignore_errors' => true
        ]
    ]);

    $response = @file_get_contents('http://timber-bindings.internal' . $path, false, $context);
    if (!is_string($response)) {
        return ['status' => 'error', 'message' => 'Serviciul Cloudflare nu a putut fi accesat.'];
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        return ['status' => 'error', 'message' => 'Serviciul Cloudflare a returnat un răspuns invalid.'];
    }
    return $decoded;
}
