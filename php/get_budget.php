<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "User not logged in."]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Fetch main budget data
    $stmt = $pdo->prepare("SELECT * FROM budget WHERE user_id = ?");
    $stmt->execute([$userId]);
    $budget = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$budget) {
        echo json_encode(["success" => false, "message" => "No budget found."]);
        exit;
    }

    // Fetch custom expenses
    $stmt2 = $pdo->prepare("SELECT label, cost FROM custom_expenses WHERE user_id = ?");
    $stmt2->execute([$userId]);
    $customExpenses = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "budget" => [
            "monthlyBudget"  => (int)$budget['monthly_budget'],
            "university"     => $budget['university'],
            "housing"        => $budget['housing'],
            "housingCost"    => (int)$budget['housing_cost'],
            "transport"      => $budget['transport'],
            "transportCost"  => (int)$budget['transport_cost'],
            "activity"       => $budget['activity'],
            "activityCost"   => $budget['activity'] === 'Yes' ? (int)$budget['activity_cost'] : 0,
            "savings"        => isset($budget['savings']) ? (int)$budget['savings'] : 0
        ],
        "customExpenses" => array_map(function($item) {
            return [
                "label" => $item['label'],
                "cost" => (int)$item['cost']
            ];
        }, $customExpenses)
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "DB Error: " . $e->getMessage()]);
}
