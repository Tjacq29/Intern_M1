<?php
// filepath: c:\wamp64\www\Intern_M1\php\expense_history.php
header('Content-Type: application/json');
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) { echo json_encode([]); exit; }
$user_id = $_SESSION['user_id'];
$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$type = $_GET['type'] ?? 'highest';

$order = $type === 'lowest' ? 'ASC' : 'DESC';

$stmt = $pdo->prepare("SELECT amount, category, date FROM expenses WHERE user_id = ? AND YEAR(date) = ? ORDER BY amount $order LIMIT 10");
$stmt->execute([$user_id, $year]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));