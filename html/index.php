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

<body class="d-flex flex-column vh-100">

  <header class="bg-white shadow-sm py-2">
    <div class="container-fluid d-flex align-items-center justify-content-between">
    <h1 class="h3 mb-0 text-dark fw-bold">Student Finance Assistant</h1>
    <div class="d-flex align-items-center">
        <?php if (!$isLoggedIn): ?>
          <a href="login.html" class="btn btn-outline-primary btn-sm me-2">Login</a>
          <a href="signup.html" class="btn btn-primary btn-sm me-3">Sign Up</a>
        <?php endif; ?>
        <div class="dropdown">
          <a href="#" class="d-block link-dark text-decoration-none dropdown-toggle" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://cdn-icons-png.flaticon.com/512/847/847969.png" alt="Profile" width="48" height="48" class="rounded-circle">
          </a>
          <ul class="dropdown-menu dropdown-menu-end text-small" aria-labelledby="profileDropdown">
          <a class="dropdown-item" href="../html/profile.html">My Profile</a>
            <li><a class="dropdown-item" href="#">Settings</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="../php/logout.php">Logout</a></li>
          </ul>
        </div>     
    </div>
  </header>

  <div class="d-flex flex-grow-1">
    <nav class="d-flex flex-column flex-shrink-0 bg-white border-end p-3" style="width: 200px;">
    <ul class="nav nav-pills flex-column mb-auto text-start">
        <li class="nav-item mb-2">
          <a href="#" class="nav-link active py-3 d-flex align-items-center">
            <i class="bi bi-house fs-2 me-2"></i> Home
          </a>
        </li>
        <li class="mb-2">
          <a href="dashboard.html" class="nav-link text-muted py-3 d-flex align-items-center">
            <i class="bi bi-speedometer2 fs-2 me-2"></i> Dashboard
          </a>
        </li>

        <li class="mb-2">
          <a href="budget.html" class="nav-link text-muted py-3 d-flex align-items-center">
            <i class="bi bi-table fs-2 me-2"></i> Budget
          </a>
        </li>
        <li class="mb-2">
          <a href="#" class="nav-link text-muted py-3 d-flex align-items-center">
            <i class="bi bi-grid-3x3-gap fs-2 me-2"></i> Expenses
          </a>
        </li>
        <li class="mb-2">
          <a href="#" class="nav-link text-muted py-3 d-flex align-items-center">
            <i class="bi bi-person fs-2 me-2"></i> Profile
          </a>
        </li>
      </ul>
    </nav>

    <main class="flex-grow-1">
      <section class="d-flex align-items-center justify-content-center text-center bg-hero" style="min-height: 90vh;">
        <div class="text-white">
          <h1 class="display-4 fw-bold">Master Your Budget</h1>
          <p class="lead mb-4">Take control of your finances and achieve your goals, with a budget plan adapted to your needs.</p>
        </div>
      </section>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
