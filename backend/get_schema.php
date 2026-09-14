<?php
$pdo = new PDO('sqlite:database/database.sqlite');
$tables = $pdo->query("SELECT sql FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
file_put_contents('schema.txt', implode("\n\n", $tables));
echo "Listo\n";
