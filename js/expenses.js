const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("expenseTableBody");
const chartCtx = document.getElementById("expenseChart").getContext("2d");
const categorySelect = document.getElementById("expenseCategory");
const monthInput = document.getElementById("trackingMonth");

let expenses = [];
let chartInstance = null;

// Fetch all categories ever used by the user
async function fetchAllCategories() {
  try {
    const res = await fetch("../php/get_all_categories.php");
    const data = await res.json();

    categorySelect.innerHTML = '<option value="">-- Select Category --</option>';

    if (data.success && Array.isArray(data.categories)) {
      data.categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

// Fetch budget for the selected month
async function fetchBudgetForMonth(month, year) {
  try {
    const res = await fetch(`../php/get_budget.php?month=${month}&year=${year}`);
    const data = await res.json();
    let budgets = {};
    if (data.success && Array.isArray(data.expenses)) {
      data.expenses.forEach(item => {
        budgets[item.label] = Number(item.amount);
      });
    }
    return budgets;
  } catch (err) {
    console.error("Failed to load budget for month:", err);
    return {};
  }
}

// Load expenses from DB for selected month
async function fetchExpenses(month, year) {
  try {
    const res = await fetch(`../php/get_expenses.php?month=${month}&year=${year}`);
    const data = await res.json();
    expenses = data.success && Array.isArray(data.expenses) ? data.expenses : [];
    renderTable();
    await renderChart();
  } catch (err) {
    console.error("Failed to load expenses:", err);
  }
}

// Display expenses in table
function renderTable() {
  tableBody.innerHTML = "";
  expenses.forEach((exp, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.amount}</td>
      <td>${exp.category}</td>
      <td>
        <div class="dropdown">
          <button class="btn btn-link p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item edit-expense" href="#" data-idx="${idx}">Edit</a></li>
            <li><a class="dropdown-item delete-expense" href="#" data-idx="${idx}">Delete</a></li>
          </ul>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Attach event listeners for edit/delete
  document.querySelectorAll(".edit-expense").forEach(btn => {
    btn.addEventListener("click", handleEditExpense);
  });
  document.querySelectorAll(".delete-expense").forEach(btn => {
    btn.addEventListener("click", handleDeleteExpense);
  });
}

// Draw the budget usage chart
async function renderChart() {
  // Get selected month/year
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);

  // Fetch budget for this month
  const budgets = await fetchBudgetForMonth(month, yearInt);

  // Gather all categories (from dropdown)
  const allLabels = Array.from(categorySelect.options)
    .filter(opt => opt.value)
    .map(opt => opt.value);

  // Calculate spent per category
  const spentPerCategory = {};
  expenses.forEach(e => {
    spentPerCategory[e.category] = (spentPerCategory[e.category] || 0) + Number(e.amount);
  });

  // Prepare data for chart
  const spent = allLabels.map(cat => spentPerCategory[cat] || 0);
  const remaining = allLabels.map(cat => {
    const budget = budgets[cat] || 0;
    const spentVal = spentPerCategory[cat] || 0;
    return Math.max(budget - spentVal, 0);
  });

  // Filter out categories where both spent and remaining are 0
  const filtered = allLabels
    .map((cat, i) => ({
      cat,
      spent: spent[i],
      remaining: remaining[i]
    }))
    .filter(item => item.spent > 0 || item.remaining > 0);

  const labels = filtered.map(item => item.cat);
  const spentFiltered = filtered.map(item => item.spent);
  const remainingFiltered = filtered.map(item => item.remaining);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Remaining",
        data: remainingFiltered,
        backgroundColor: "#198754",
        grouped: false
      },
      {
        label: "Spent",
        data: spentFiltered,
        backgroundColor: "#dc3545",
        grouped: false
      }
    ]
  };

  if (chartInstance instanceof Chart) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartCtx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Expenses by Category",
          font: { size: 18 }
        },
        legend: {
          labels: {
            font: { size: 14 }
          }
        },
        datalabels: {
          color: "#444",
          font: {
            size: 12,
            weight: "bold"
          },
          anchor: "end",
          align: "start",
          offset: -2,
          formatter: (value) => value > 0 ? `€${value}` : "",
          clamp: true
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 20,
            font: { size: 12 }
          },
          stacked: true
        },
        y: {
          beginAtZero: true,
          stacked: true,
          ticks: {
            stepSize: 50,
            font: { size: 12 }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // Make remainingFiltered available globally for transfer calculation
  window.lastRemaining = remainingFiltered || [];
}

// When user adds an expense
form.addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("expenseDate").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;

  // Get selected month/year
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);

  const newExpense = { date, amount, category, month, year: yearInt };

  // Save to DB
  try {
    const res = await fetch("../php/save_expense.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense)
    });
    const result = await res.json();
    if (result.success) {
      await fetchExpenses(month, yearInt);
      form.reset();
    } else {
      alert("Error saving expense: " + result.message);
    }
  } catch (err) {
    alert("Error saving expense.");
    console.error(err);
  }
});

// Month selector logic
monthInput.addEventListener("change", async () => {
  await fetchAllCategories();
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);
  await fetchExpenses(month, yearInt);
});

// Init: add month selector if not present
document.addEventListener("DOMContentLoaded", async () => {
  if (!monthInput) {
    const main = document.querySelector("main");
    const div = document.createElement("div");
    div.className = "mb-3";
    div.innerHTML = `
      <label for="trackingMonth" class="form-label">Select Month</label>
      <input type="month" class="form-control" id="trackingMonth" value="${new Date().toISOString().slice(0,7)}">
    `;
    main.prepend(div);
  }
  // Set default month
  if (monthInput && !monthInput.value) {
    monthInput.value = new Date().toISOString().slice(0, 7);
  }
  await fetchAllCategories();
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);
  await fetchExpenses(month, yearInt);
});

async function handleDeleteExpense(e) {
  e.preventDefault();
  const idx = e.target.getAttribute("data-idx");
  const exp = expenses[idx];
  if (confirm(`Delete expense: ${exp.amount}€ for ${exp.category} on ${exp.date}?`)) {
    // Call your delete PHP endpoint
    const res = await fetch("../php/delete_expense.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: exp.date, amount: exp.amount, category: exp.category })
    });
    const data = await res.json();
    if (data.success) {
      // Refresh
      const [year, monthStr] = monthInput.value.split("-");
      const month = parseInt(monthStr, 10);
      const yearInt = parseInt(year, 10);
      await fetchExpenses(month, yearInt);
    } else {
      alert(data.message || "Error deleting expense.");
    }
  }
}

function handleEditExpense(e) {
  e.preventDefault();
  const idx = e.target.getAttribute("data-idx");
  const exp = expenses[idx];
  // Fill the form with the expense data for editing
  document.getElementById("expenseDate").value = exp.date;
  document.getElementById("expenseAmount").value = exp.amount;
  document.getElementById("expenseCategory").value = exp.category;

  // Change form button to "Update"
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.textContent = "Update Expense";
  submitBtn.classList.add("btn-warning");

  // On submit, update instead of add
  form.onsubmit = async function(ev) {
    ev.preventDefault();
    const date = document.getElementById("expenseDate").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const [year, monthStr] = monthInput.value.split("-");
    const month = parseInt(monthStr, 10);
    const yearInt = parseInt(year, 10);

    // Call your update PHP endpoint
    const res = await fetch("../php/update_expense.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old: exp, // old values to identify the row
        date, amount, category, month, year: yearInt
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchExpenses(month, yearInt);
      form.reset();
      submitBtn.textContent = "Add Expense";
      submitBtn.classList.remove("btn-warning");
      form.onsubmit = null; // restore default
    } else {
      alert(data.message || "Error updating expense.");
    }
  };
}

// Open the modal when clicking the transfer button
document.getElementById("transferToGoalBtn").addEventListener("click", async () => {
  // 1. Fetch goals
  const res = await fetch("../php/get_goals.php");
  const data = await res.json();
  const goalSelect = document.getElementById("goalSelect");
  goalSelect.innerHTML = '<option value="">-- Select a Goal --</option>';
  if (data.success && Array.isArray(data.goals)) {
    data.goals.forEach(goal => {
      const opt = document.createElement("option");
      opt.value = goal.id;
      opt.textContent = `${goal.goal_name} (target: €${goal.target_amount})`;
      goalSelect.appendChild(opt);
    });
  }

  // 2. Show categories with checkboxes to select which "Spent" to include
  const categoryCheckboxes = document.getElementById("categoryCheckboxes");
  categoryCheckboxes.innerHTML = "";
  const categories = Array.from(new Set(expenses.map(e => e.category)));
  categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "form-check";
    div.innerHTML = `
    <input class="form-check-input" type="checkbox" value="${cat}" id="cat-${cat}">
    <label class="form-check-label" for="cat-${cat}">${cat}</label>
  `;
    categoryCheckboxes.appendChild(div);
  });

  // 3. Calculate the total amount to transfer (sum of "Remaining" + selected "Spent")
  function updateTotalTransfer() {
    // Get checked categories
    const checkedCats = Array.from(categoryCheckboxes.querySelectorAll("input:checked")).map(cb => cb.value);
    // Sum of "Spent" for these categories
    let spentSum = 0;
    expenses.forEach(e => {
      if (checkedCats.includes(e.category)) spentSum += Number(e.amount);
    });
    // Sum of "Remaining" (all categories)
    let remainingSum = 0;
    if (window.lastRemaining) {
      remainingSum = window.lastRemaining.reduce((a, b) => a + b, 0);
    }
    document.getElementById("totalTransfer").value = (spentSum + remainingSum).toFixed(2) + " €";
  }
  categoryCheckboxes.addEventListener("change", updateTotalTransfer);
  updateTotalTransfer();

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById("transferModal"));
  modal.show();

  // Handle transfer form submission
  document.getElementById("transferForm").onsubmit = async function(ev) {
    ev.preventDefault();
    const goalId = goalSelect.value;
    const checkedCats = Array.from(categoryCheckboxes.querySelectorAll("input:checked")).map(cb => cb.value);

    // Calculate spent sum
    let spentSum = 0;
    expenses.forEach(e => {
      if (checkedCats.includes(e.category)) spentSum += Number(e.amount);
    });

    // Calculate remaining sum (all categories)
    let remainingSum = 0;
    if (window.lastRemaining) {
      remainingSum = window.lastRemaining.reduce((a, b) => a + b, 0);
    }

    // Send both to backend
    const res = await fetch("../php/transfer_to_goal.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId,
        month: monthInput.value,
        categories: checkedCats,
        spent: spentSum,
        remaining: remainingSum
      })
    });
    const data = await res.json();
    if (data.success) {
      alert("Transfer completed!");
      modal.hide();
    } else {
      alert(data.message || "Error during transfer.");
    }
  };
});

// Make lastRemaining available for transfer calculation
window.lastRemaining = [];