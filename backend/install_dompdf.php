<?php
echo "Installing barryvdh/laravel-dompdf...\n";
$composerPath = 'C:\\ProgramData\\composer\\bin\\composer';
$output = shell_exec("\"$composerPath\" require barryvdh/laravel-dompdf 2>&1");
echo $output;
echo "\nChecking if installed:\n";
echo file_exists(__DIR__ . '/vendor/barryvdh/laravel-dompdf/src/ServiceProvider.php') ? "SUCCESS\n" : "FAILED\n";
