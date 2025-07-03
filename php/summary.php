<?php
// filepath: c:\wamp64\www\Intern_M1\php\summary.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';
session_start();

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// --- Correction ici : vérifie le nom de la colonne date dans budgets (remplace "month" par "date" si besoin) ---
// Si ta colonne s'appelle "date" dans la table budgets :
$stmt = $pdo->prepare("SELECT MONTH(date) as month_num, amount FROM budgets WHERE user_id = ? AND YEAR(date) = ?");
$stmt->execute([$user_id, $year]);
$budgets = [];
$total_expenses = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $budgets[$row['month_num']] = floatval($row['amount']);
    $total_expenses += floatval($row['amount']);
}

// 2. Get all expenses for the year (group by month, and by category for savings)
$stmt = $pdo->prepare("
    SELECT 
        MONTH(date) as month_num,
        SUM(CASE WHEN category = 'savings' THEN amount ELSE 0 END) as savings,
        SUM(CASE WHEN category != 'savings' THEN amount ELSE 0 END) as expenses,
        MAX(amount) as max_exp,
        MIN(amount) as min_exp
    FROM expenses
    WHERE user_id = ? AND YEAR(date) = ?
    GROUP BY MONTH(date)
");
$stmt->execute([$user_id, $year]);
$monthly_expenses = [];
$total_spent = 0;
$total_remaining = 0;
$highest_expense = ['amount' => 0, 'month' => null];
$lowest_expense = ['amount' => null, 'month' => null];
$most_spent_month = ['month' => null, 'amount' => 0];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $month_num = $row['month_num'];
    $month_name = $months[$month_num-1];
    $budget = $budgets[$month_num] ?? 0;
    $expenses = floatval($row['expenses']);
    $savings = floatval($row['savings']);
    $spent = $expenses + $savings;
    $remaining = $budget - $expenses + $savings;

    $monthly_expenses[] = [
        'month' => $month_name,
        'amount' => $spent
    ];

    $total_spent += $spent;
    $total_remaining += $remaining;

    if ($row['max_exp'] > ($highest_expense['amount'] ?? 0)) {
        $highest_expense = ['amount' => floatval($row['max_exp']), 'month' => $month_name];
    }
    if ($lowest_expense['amount'] === null || $row['min_exp'] < $lowest_expense['amount']) {
        $lowest_expense = ['amount' => floatval($row['min_exp']), 'month' => $month_name];
    }
    if ($spent > $most_spent_month['amount']) {
        $most_spent_month = ['month' => $month_name, 'amount' => $spent];
    }
}

// 3. Get expenses by category (for pie chart)
$stmt = $pdo->prepare("
    SELECT category, SUM(amount) as amount
    FROM expenses
    WHERE user_id = ? AND YEAR(date) = ?
    GROUP BY category
");
$stmt->execute([$user_id, $year]);
$category_expenses = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $category_expenses[] = [
        'category' => $row['category'],
        'amount' => floatval($row['amount'])
    ];
}

echo json_encode([
    'total_spent' => round($total_spent, 2),
    'total_expenses' => round($total_expenses, 2),
    'total_remaining' => round($total_remaining, 2),
    'highest_expense' => $highest_expense,
    'lowest_expense' => $lowest_expense,
    'most_spent_month' => $most_spent_month,
    'monthly_expenses' => $monthly_expenses,
    'category_expenses' => $category_expenses
]);