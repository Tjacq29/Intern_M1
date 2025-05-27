<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "User not logged in."]);
    exit;
}

$userId = $_SESSION['user_id'];

// Sanitize and collect form data
$monthlyBudget = $_POST['monthlyBudget'] ?? null;
$university = $_POST['university'] ?? null;
$housing = $_POST['housing'] ?? null;
$housingCost = $_POST['housingCost'] ?? null;
$transport = $_POST['transport'] ?? null;
$transportCost = $_POST['transportCost'] ?? null;
$activity = $_POST['activity'] ?? null;
$activityCost = $_POST['activityCost'] ?? null;
$savings = $_POST['savings'] ?? null;
$customLabels = $_POST['customLabel'] ?? [];
$customValues = $_POST['customValue'] ?? [];

// Calculate total of custom expenses
$customExpenseTotal = 0;
if (is_array($customValues)) {
    foreach ($customValues as $value) {
        $customExpenseTotal += (int)$value;
    }
}

try {
    // Insert or update main budget info
    $stmt = $pdo->prepare("REPLACE INTO budget (
        user_id, monthly_budget, university, housing, housing_cost, transport, transport_cost, activity, activity_cost, savings, custom_expense_total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $userId,
        $monthlyBudget,
        $university,
        $housing,
        $housingCost,
        $transport,
        $transportCost,
        $activity,
        $activityCost,
        $savings,
        $customExpenseTotal
    ]);

    // Clear previous
    $pdo->prepare("DELETE FROM custom_expenses WHERE user_id = ?")->execute([$userId]);

    // Insert new
    if (is_array($customLabels) && is_array($customValues)) {
        $stmt = $pdo->prepare("INSERT INTO custom_expenses (user_id, label, cost) VALUES (?, ?, ?)");
        for ($i = 0; $i < count($customLabels); $i++) {
            $label = trim($customLabels[$i]);
            $cost = (int)$customValues[$i];
            if ($label && $cost > 0) {
                $stmt->execute([$userId, $label, $cost]);
            }
        }
    }



    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
