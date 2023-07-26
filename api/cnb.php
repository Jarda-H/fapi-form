<?php

$url = "https://api.cnb.cz/cnbapi/exrates/daily";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$response_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json');
if ($response_code != 200) {
    echo json_encode([
        "error" => true,
        "code" => $response_code
    ]);
} else {
    echo json_encode([
        "error" => false,
        "data" => json_decode($response)
    ]);
}
