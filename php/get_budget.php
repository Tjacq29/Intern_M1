<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

// Vérifie que l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];

// Récupère et sécurise les paramètres GET
$month = isset($_GET['month']) ? intval($_GET['month']) : null;
$year = isset($_GET['year']) ? intval($_GET['year']) : null;

// Vérification de la validité des paramètres
if (!$month || !$year || $month < 1 || $month > 12 || $year < 1900 || $year > 2100) {
    echo json_encode(['success' => false, 'message' => 'Invalid month or year']);
    exit;
}

try {
    // Récupère le budget principal
    $stmt = $pdo->prepare("
        SELECT budget 
        FROM budgets 
        WHERE user_id = ? AND month = ? AND year = ?
    ");
    $stmt->execute([$userId, $month, $year]);
    $budgetRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $budget = $budgetRow ? (int)$budgetRow['budget'] : 0;

    // Récupère les dépenses associées
    $stmt2 = $pdo->prepare("
        SELECT label, amount, is_fixed 
        FROM budget_expenses 
        WHERE user_id = ? AND month = ? AND year = ?
    ");
    $stmt2->execute([$userId, $month, $year]);
    $expenses = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'budget' => $budget,
        'expenses' => $expenses,
        'month' => $month,
        'year' => $year
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
?>