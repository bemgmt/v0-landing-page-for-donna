<?php
// Shim to allow /donna_logic.php to resolve to API endpoint when frontend calls this path
// Keeps backward compatibility with clients expecting donna_logic.php at the folder root.
// Updated to use the correct API path with email sending functionality
require __DIR__ . '/api/donna_logic.php';

