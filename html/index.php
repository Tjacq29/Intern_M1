<?php
session_start();
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Student Finance Assistant</title>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
</head>

<body class="d-flex flex-column min-vh-100">
<div class="d-flex flex-column flex-grow-1">

<!-- HEADER -->
<header class="py-2 shadow-sm">
<div class="container-fluid d-flex align-items-center justify-content-between">
<h1 class="h3 mb-0 fw-bold" id="appTitle">Student Finance Assistant</h1>
<div class="d-flex align-items-center">
  <div class="dropdown">
    <a href="#" class="d-block link-dark text-decoration-none dropdown-toggle" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
      <i class="bi bi-person-circle fs-1 text-dark"></i>
    </a>
    <ul class="dropdown-menu text-small dropdown-menu-end" aria-labelledby="userMenu">
      <li><a class="dropdown-item" href="profile.php" id="navProfile">Profile</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="../php/logout.php">Logout</a></li>
      <li><hr class="dropdown-divider"></li>
      <li class="dropdown-header">Language</li>
      <li><a class="dropdown-item lang-option" href="#" data-lang="en">English</a></li>
      <li><a class="dropdown-item lang-option" href="#" data-lang="fr">Français</a></li>
      <li><a class="dropdown-item lang-option" href="#" data-lang="id">Bahasa</a></li>
    </ul>
  </div>
</div>
</div>
</header>

<!-- MAIN LAYOUT -->
<div class="d-flex flex-grow-1" style="min-height: 0;">
<!-- SIDEBAR -->
<nav class="sidebar position-relative">
<ul class="nav nav-pills flex-column mb-auto text-start">
  <li class="mb-2">
    <a href="index.php" class="nav-link active d-flex align-items-center">
      <i class="bi bi-house fs-2 me-2"></i> <span id="navHome">Home</span>
    </a>
  </li>
  <li class="mb-2">
    <a href="dashboard.html" class="nav-link d-flex align-items-center">
      <i class="bi bi-speedometer2 fs-2 me-2"></i> <span id="navDashboard">Dashboard</span>
    </a>
  </li>
  <li class="mb-2">
    <a href="budget.html" class="nav-link d-flex align-items-center">
      <i class="bi bi-table fs-2 me-2"></i> <span id="navBudget">Budget</span>
    </a>
  </li>
  <li class="mb-2">
    <a href="expenses.html" class="nav-link d-flex align-items-center">
      <i class="bi bi-grid-3x3-gap fs-2 me-2"></i> <span id="navExpenses">Expenses</span>
    </a>
  </li>
  <li class="mb-2">
    <a href="summary.html" class="nav-link d-flex align-items-center">
      <i class="bi bi-bar-chart-line fs-2 me-2"></i> <span id="navSummary">Summary</span>
    </a>
  </li>
  <li class="mb-2">
    <a href="financial_goals.html" class="nav-link d-flex align-items-center">
      <i class="bi bi-flag fs-2 me-2"></i> <span id="navGoal">Goal</span>
    </a>
  </li>
</ul>
</nav>

<!-- MAIN CONTENT -->
<main class="flex-grow-1 p-4">
<section class="container mb-5">
<div class="text-center mb-4">
  <h2 class="fw-bold" id="welcomeTitle">Welcome to Student Finance Assistant</h2>
  <p class="text-muted" id="welcomeDesc">Manage your finances, track expenses, and achieve your financial goals with ease.</p>
</div>

<div class="row mb-4">
  <div class="col-md-3">
    <div class="card text-center shadow-sm">
      <div class="card-body">
        <h5 class="card-title" id="cardBudgetTitle">Budget Overview</h5>
        <p class="card-text" id="cardBudgetText">Track and follow your expenses.</p>
        <a href="budget.html" class="btn btn-primary" id="cardBudgetBtn">View Budget</a>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card text-center shadow-sm">
      <div class="card-body">
        <h5 class="card-title" id="cardExpenseTitle">Expense Tracker</h5>
        <p class="card-text" id="cardExpenseText">Track and follow your expenses.</p>
        <a href="track_expenses.html" class="btn btn-primary" id="cardExpenseBtn">Track Expenses</a>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card text-center shadow-sm">
      <div class="card-body">
        <h5 class="card-title" id="cardGoalTitle">Financial Goals</h5>
        <p class="card-text" id="cardGoalText">Set and achieve your financial goals.</p>
        <a href="../html/financial_goals.html" class="btn btn-primary" id="cardGoalBtn">Set Goals</a>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card text-center shadow-sm">
      <div class="card-body">
        <h5 class="card-title" id="cardSummaryTitle">Summary</h5>
        <p class="card-text" id="cardSummaryText">View your annual spending summary.</p>
        <a href="summary.html" class="btn btn-primary" id="cardSummaryBtn">View Summary</a>
      </div>
    </div>
  </div>
</div>

<div class="row">
  <div class="col-md-12">
    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="card-title" id="insightsTitle">Insights</h5>
        <p class="card-text" id="insightsText">Visualize your spending patterns with charts and graphs.</p>
        <a href="dashboard.html" class="btn btn-success" id="insightsBtn">View Insights</a>
      </div>
    </div>
  </div>
</div>
</section>
</main>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/lang.js"></script>
</body>
</html>
