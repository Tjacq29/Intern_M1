<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

require_once 'config.php'; // Make sure this includes $pdo connection

$userId = $_SESSION['user_id'];

// Collect POST data safely
$monthlyBudget = $_POST['monthlyBudget'] ?? null;
$university     = $_POST['university'] ?? null;
$housing        = $_POST['housing'] ?? null;
$transport      = $_POST['transport'] ?? null;
$activity       = $_POST['activity'] ?? null;
$activityCost   = $_POST['activityCost'] ?? 0;

// Basic validation
if (!$monthlyBudget || !$university || !$housing || !$transport || !$activity) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    // Check if the user already has a budget entry
    $check = $pdo->prepare("SELECT id FROM user_budget WHERE user_id = ?");
    $check->execute([$userId]);

    if ($check->rowCount() > 0) {
        // Update existing
        $update = $pdo->prepare("UPDATE user_budget SET 
            monthly_budget = ?, university = ?, housing = ?, transport = ?, activity = ?, activity_cost = ?
            WHERE user_id = ?");
        $update->execute([$monthlyBudget, $university, $housing, $transport, $activity, $activityCost, $userId]);
    } else {
        // Insert new
        $insert = $pdo->prepare("INSERT INTO user_budget 
            (user_id, monthly_budget, university, housing, transport, activity, activity_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insert->execute([$userId, $monthlyBudget, $university, $housing, $transport, $activity, $activityCost]);
    }

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
