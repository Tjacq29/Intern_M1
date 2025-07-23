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

    // Récupère les dépenses associées (on récupère aussi la durée initiale)
    $stmt2 = $pdo->prepare("
        SELECT label, amount, is_fixed, month, year, duration
        FROM budget_expenses 
        WHERE user_id = ? AND month = ? AND year = ?
    ");
    $stmt2->execute([$userId, $month, $year]);
    $expenses = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Pour chaque dépense, on retrouve la première occurrence pour calculer la durée restante
    foreach ($expenses as &$exp) {
        $first = $pdo->prepare("
            SELECT duration, month, year 
            FROM budget_expenses 
            WHERE user_id = ? AND label = ? AND amount = ? AND is_fixed = ? 
            ORDER BY year ASC, month ASC LIMIT 1
        ");
        $first->execute([$userId, $exp['label'], $exp['amount'], $exp['is_fixed']]);
        $firstRow = $first->fetch(PDO::FETCH_ASSOC);

        // Si la durée existe, on calcule la durée restante
        if ($firstRow && isset($firstRow['duration'])) {
            $startMonth = (int)$firstRow['month'];
            $startYear = (int)$firstRow['year'];
            $initialDuration = (int)$firstRow['duration'];
            $currentMonth = (int)$exp['month'];
            $currentYear = (int)$exp['year'];
            $monthsPassed = ($currentYear - $startYear) * 12 + ($currentMonth - $startMonth);
            $exp['duration'] = max(1, $initialDuration - $monthsPassed);
        } else {
            $exp['duration'] = 1;
        }
    }

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