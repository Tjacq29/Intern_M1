<?php
// filepath: c:\wamp64\www\Intern_M1\php\summary.php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'NO SESSION']);
    exit;
}

if (!isset($pdo)) {
    echo json_encode(['error' => 'NO PDO']);
    exit;
}

$user_id = $_SESSION['user_id'];
$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// 1. Get all budgets for the year (sum)
$stmt = $pdo->prepare("SELECT SUM(budget) as total_budget FROM budgets WHERE user_id = ? AND year = ?");
$stmt->execute([$user_id, $year]);
$total_budget = floatval($stmt->fetchColumn());

// 2. Get all expenses for the year (sum)
$stmt = $pdo->prepare("SELECT SUM(amount) as total_spent FROM expenses WHERE user_id = ? AND YEAR(date) = ?");
$stmt->execute([$user_id, $year]);
$total_spent = floatval($stmt->fetchColumn());

// 3. Remaining = total_budget - total_spent
$total_remaining = $total_budget - $total_spent;

// 4. Highest/Lowest expense
$stmt = $pdo->prepare("SELECT MAX(amount) as max_exp, MIN(amount) as min_exp FROM expenses WHERE user_id = ? AND YEAR(date) = ?");
$stmt->execute([$user_id, $year]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$highest_expense = ['amount' => $row['max_exp'] ? floatval($row['max_exp']) : 0, 'month' => null];
$lowest_expense = ['amount' => $row['min_exp'] ? floatval($row['min_exp']) : 0, 'month' => null];

// 5. Month with most spent
$stmt = $pdo->prepare("SELECT MONTH(date) as month_num, SUM(amount) as total FROM expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date) ORDER BY total DESC LIMIT 1");
$stmt->execute([$user_id, $year]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$most_spent_month = $row ? ['month' => $months[$row['month_num']-1], 'amount' => floatval($row['total'])] : ['month' => null, 'amount' => 0];

// 6. Monthly expenses for chart
$stmt = $pdo->prepare("SELECT MONTH(date) as month_num, SUM(amount) as amount FROM expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY MONTH(date)");
$stmt->execute([$user_id, $year]);
$monthly_expenses = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $monthly_expenses[] = [
        'month' => $months[$row['month_num']-1],
        'amount' => floatval($row['amount'])
    ];
}

// 7. Expenses by category for chart
$stmt = $pdo->prepare("SELECT category, SUM(amount) as amount FROM expenses WHERE user_id = ? AND YEAR(date) = ? GROUP BY category");
$stmt->execute([$user_id, $year]);
$category_expenses = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $category_expenses[] = [
        'category' => $row['category'],
        'amount' => floatval($row['amount'])
    ];
}

echo json_encode([
    'total_budget' => round($total_budget, 2),
    'total_spent' => round($total_spent, 2),
    'total_remaining' => round($total_remaining, 2),
    'highest_expense' => $highest_expense,
    'lowest_expense' => $lowest_expense,
    'most_spent_month' => $most_spent_month,
    'monthly_expenses' => $monthly_expenses,
    'category_expenses' => $category_expenses
]);