<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

// Validation des données reçues
if (
    !$data || !isset($data['budget']) || !is_array($data['expenses']) ||
    !isset($data['month']) || !isset($data['year'])
) {
    error_log("DEBUG - Invalid input data: " . json_encode($data));
    echo json_encode(['success' => false, 'message' => 'Invalid input data.']);
    exit;
}

$budget = (int) $data['budget'];
$expenses = $data['expenses'];
$fixedCount = isset($data['fixedCount']) ? (int)$data['fixedCount'] : 0;
$month = (int) $data['month'];
$year = (int) $data['year'];

// Debug: log all received values
error_log("DEBUG - Saving budget for user_id=$userId | budget=$budget | month=$month | year=$year | fixedCount=$fixedCount | expenses=" . json_encode($expenses));

if ($month < 1 || $month > 12 || $year < 1900 || $year > 2100) {
    error_log("DEBUG - Invalid month or year: month=$month, year=$year");
    echo json_encode(['success' => false, 'message' => 'Invalid month or year.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Insère ou met à jour le budget principal
    $stmt = $pdo->prepare("
        INSERT INTO budgets (user_id, budget, fixed_count, month, year)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE budget = VALUES(budget), fixed_count = VALUES(fixed_count)
    ");
    $stmt->execute([$userId, $budget, $fixedCount, $month, $year]);
    error_log("DEBUG - Budget row inserted/updated for user_id=$userId, month=$month, year=$year, budget=$budget");

    // Supprime les anciennes dépenses pour ce mois/année
    $delete = $pdo->prepare("DELETE FROM budget_expenses WHERE user_id = ? AND month = ? AND year = ?");
    $delete->execute([$userId, $month, $year]);
    error_log("DEBUG - Old expenses deleted for user_id=$userId, month=$month, year=$year");

    // Insère les nouvelles dépenses
    $insert = $pdo->prepare("
        INSERT INTO budget_expenses (user_id, label, amount, is_fixed, month, year)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($expenses as $exp) {
        $label = trim($exp['label'] ?? '');
        $amount = (int) ($exp['amount'] ?? 0);
        $fixed = isset($exp['fixed']) && $exp['fixed'] ? 1 : 0;

        if ($label !== '' && $amount >= 0) {
            $insert->execute([$userId, $label, $amount, $fixed, $month, $year]);
            error_log("DEBUG - Inserted expense: label=$label, amount=$amount, fixed=$fixed, month=$month, year=$year");
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("DB Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}