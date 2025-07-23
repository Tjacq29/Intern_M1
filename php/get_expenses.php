<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$month = isset($_GET['month']) ? intval($_GET['month']) : null;
$year = isset($_GET['year']) ? intval($_GET['year']) : null;

if (!$month || !$year) {
    echo json_encode(['success' => false, 'message' => 'Invalid month or year.']);
    exit;
}

try {
    // Récupère les dépenses
    $stmt = $pdo->prepare("SELECT date, amount, category FROM expenses WHERE user_id = ? AND month = ? AND year = ? ORDER BY date ASC");
    $stmt->execute([$userId, $month, $year]);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupère les transferts vers goals pour ce mois
    $stmt2 = $pdo->prepare("SELECT amount FROM goal_transfers WHERE user_id = ? AND month = ? AND year = ? AND type = '(Remaining)'");
    $stmt2->execute([$userId, $month, $year]);
    $transfers = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Calcule le total transféré depuis Remaining
    $totalTransferred = 0;
    foreach ($transfers as $tr) {
        $totalTransferred += floatval($tr['amount']);
    }

    // Ajoute une pseudo-dépense "Goal Transfer Remaining" pour soustraire du Remaining
    if ($totalTransferred > 0) {
        $expenses[] = [
            'date' => date('Y-m-d'),
            'amount' => $totalTransferred,
            'category' => 'Goal Transfer Remaining'
        ];
    }

    echo json_encode(['success' => true, 'expenses' => $expenses]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>