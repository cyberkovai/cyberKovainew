<?php
$root = dirname(__DIR__, 2);
chdir($root);
require $root . '/services-data.php';

$payload = [
    'services' => $allServicesData,
    'categories' => $serviceCategories,
];

file_put_contents(
    $root . '/data/services_static.json',
    json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
);

echo "Generated data/services_static.json\n";
echo 'Services: ' . count($allServicesData) . "\n";
echo 'Categories: ' . count($serviceCategories) . "\n";
