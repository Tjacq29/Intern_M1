<?php 
session_start();
header('Content-Type: application/json');
require_once 'config.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];

// Parse JSON body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['budget']) || !is_array($data['expenses'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input data.']);
    exit;
}

$budget = (int) $data['budget'];
$expenses = $data['expenses'];
$fixedCount = isset($data['fixedCount']) ? (int)$data['fixedCount'] : 0;

try {
    // Start transaction
    $pdo->beginTransaction();

    // Save or update main budget
    $stmt = $pdo->prepare("
        INSERT INTO budgets (user_id, budget, fixed_count) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            budget = VALUES(budget),
            fixed_count = VALUES(fixed_count)
    ");
    $stmt->execute([$userId, $budget, $fixedCount]);

    // Delete previous expenses
    $delete = $pdo->prepare("DELETE FROM budget_expenses WHERE user_id = ?");
    $delete->execute([$userId]);

    // Insert each expense
    $insert = $pdo->prepare("
        INSERT INTO budget_expenses (user_id, label, amount, is_fixed)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($expenses as $exp) {
        $label = trim($exp['label']);
        $amount = (int) $exp['amount'];
        $fixed = isset($exp['fixed']) && $exp['fixed'] ? 1 : 0;

        if ($label !== '' && $amount >= 0) {
            $insert->execute([$userId, $label, $amount, $fixed]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
