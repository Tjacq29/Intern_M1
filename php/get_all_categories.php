<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Récupère toutes les catégories des budgets ET des dépenses
    $stmt = $pdo->prepare("
        SELECT label AS category FROM budget_expenses WHERE user_id = ?
        UNION
        SELECT category FROM expenses WHERE user_id = ?
    ");
    $stmt->execute([$userId, $userId]);
    $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode(['success' => true, 'categories' => $categories]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>