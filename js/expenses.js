const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("expenseTableBody");
const chartCtx = document.getElementById("expenseChart").getContext("2d");
const categorySelect = document.getElementById("expenseCategory");
const monthInput = document.getElementById("trackingMonth");

let expenses = [];
let chartInstance = null;
window.lastRemaining = [];

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

async function fetchExpenses(month, year) {
  try {
    const res = await fetch(`../php/get_expenses.php?month=${month}&year=${year}`);
    const data = await res.json();
    expenses = data.success && Array.isArray(data.expenses) ? data.expenses : [];
    window.expenses = expenses; // Always update global for modal
    renderTable();
    await renderChart();
  } catch (err) {
    console.error("Failed to load expenses:", err);
  }
}

function renderTable() {
  tableBody.innerHTML = "";
  expenses
    .filter(exp => !exp.category.startsWith("Goal Transfer")) // <-- Ajoute ce filtre
    .forEach((exp, idx) => {
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

  document.querySelectorAll(".edit-expense").forEach(btn => {
    btn.addEventListener("click", handleEditExpense);
  });
  document.querySelectorAll(".delete-expense").forEach(btn => {
    btn.addEventListener("click", handleDeleteExpense);
  });
}

async function renderChart() {
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);

  const budgets = await fetchBudgetForMonth(month, yearInt);

  const allLabels = Array.from(categorySelect.options)
    .filter(opt => opt.value)
    .map(opt => opt.value);

  const spentPerCategory = {};
  expenses
    .filter(e => !e.category.startsWith("Goal Transfer")) 
    .forEach(e => {
      spentPerCategory[e.category] = (spentPerCategory[e.category] || 0) + Number(e.amount);
    });

  const spent = allLabels.map(cat => spentPerCategory[cat] || 0);
  const remaining = allLabels.map(cat => {
    const budget = budgets[cat] || 0;
    const spentVal = spentPerCategory[cat] || 0;
    return Math.max(budget - spentVal, 0);
  });

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

  window.lastRemaining = remainingFiltered || [];
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("expenseDate").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;

  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);

  const newExpense = { date, amount, category, month, year: yearInt };

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

monthInput.addEventListener("change", async () => {
  await fetchAllCategories();
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);
  await fetchExpenses(month, yearInt);
});

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
    const res = await fetch("../php/delete_expense.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: exp.date, amount: exp.amount, category: exp.category })
    });
    const data = await res.json();
    if (data.success) {
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
  document.getElementById("expenseDate").value = exp.date;
  document.getElementById("expenseAmount").value = exp.amount;
  document.getElementById("expenseCategory").value = exp.category;

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.textContent = "Update Expense";
  submitBtn.classList.add("btn-warning");

  form.onsubmit = null;

  form.onsubmit = async function(ev) {
    ev.preventDefault();
    const date = document.getElementById("expenseDate").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const [year, monthStr] = monthInput.value.split("-");
    const month = parseInt(monthStr, 10);
    const yearInt = parseInt(year, 10);

    const res = await fetch("../php/update_expense.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old: exp,
        date, amount, category, month, year: yearInt
      })
    });
    const data = await res.json();
    if (data.success) {
      await fetchExpenses(month, yearInt);
      form.reset();
      submitBtn.textContent = "Add Expense";
      submitBtn.classList.remove("btn-warning");
      form.onsubmit = defaultAddExpenseHandler;
    } else {
      alert(data.message || "Error updating expense.");
    }
  };
}

const defaultAddExpenseHandler = async function(e) {
  e.preventDefault();
  const date = document.getElementById("expenseDate").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;
  const [year, monthStr] = monthInput.value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);

  const newExpense = { date, amount, category, month, year: yearInt };

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
};
form.onsubmit = defaultAddExpenseHandler;

// --- MODAL LOGIC ---

document.getElementById("transferToGoalBtn").addEventListener("click", async () => {
  // Always refresh expenses before opening modal!
  const [year, monthStr] = document.getElementById("trackingMonth").value.split("-");
  const month = parseInt(monthStr, 10);
  const yearInt = parseInt(year, 10);
  await fetchExpenses(month, yearInt);

  // 1. Fetch goals
  const res = await fetch("../php/get_goals.php");
  const data = await res.json();
  const goals = (data.success && Array.isArray(data.goals)) ? data.goals : [];

  // 2. Calcule les montants disponibles
  const remainingAvailable = window.lastRemaining ? window.lastRemaining.reduce((a, b) => a + b, 0) : 0;
  document.getElementById("remainingAvailable").textContent = remainingAvailable.toFixed(2);

  // 3. Génère les champs de split pour chaque goal (remaining)
  const remainingSplitFields = document.getElementById("remainingSplitFields");
  remainingSplitFields.innerHTML = "";
  goals.forEach(goal => {
    const divR = document.createElement("div");
    divR.className = "input-group mb-1";
    divR.innerHTML = `
      <span class="input-group-text">${goal.goal_name}</span>
      <input type="number" min="0" step="0.01" class="form-control remaining-split" data-goal="${goal.id}" value="0">
      <span class="input-group-text">€</span>
    `;
    remainingSplitFields.appendChild(divR);
  });

  // 4. Affiche la liste des catégories à cocher (spent)
  // Use the up-to-date window.expenses
  const spentCandidates = (window.expenses || []).filter(e =>
    e.goal_id == null &&
    new Date(e.date).getMonth() + 1 === month &&
    new Date(e.date).getFullYear() === yearInt
  );

  const categories = {};
  spentCandidates.forEach(e => {
    if (!categories[e.category]) categories[e.category] = [];
    categories[e.category].push(e);
  });

  const savingsListDiv = document.getElementById("savingsList");
  savingsListDiv.innerHTML = "";
  Object.entries(categories).forEach(([cat, ops], idx) => {
    const id = `spentCatCheck${idx}`;
    const total = ops.reduce((a, e) => a + Number(e.amount), 0);
    savingsListDiv.innerHTML += `
      <div class="form-check">
        <input class="form-check-input spent-cat-check" type="checkbox" data-cat="${cat}" data-idx="${idx}" id="${id}">
        <label class="form-check-label" for="${id}">
          ${cat} (Total: ${total} €)
        </label>
      </div>
    `;
  });

  // Reset split fields and selected savings
  document.getElementById("splitSavingsFields").innerHTML = "";
  document.getElementById("selectedSavingsTotal").textContent = "0.00";

  // Quand on coche/décoche, affiche les champs de split
  let selectedCategories = [];
  function updateSplitFields() {
    const splitSavingsFields = document.getElementById("splitSavingsFields");
    splitSavingsFields.innerHTML = "";
    selectedCategories = [];
    let total = 0;
    document.querySelectorAll(".spent-cat-check:checked").forEach(input => {
      const cat = input.dataset.cat;
      const ops = categories[cat];
      selectedCategories.push({ cat, ops });
      total += ops.reduce((a, e) => a + Number(e.amount), 0);
    });
    document.getElementById("selectedSavingsTotal").textContent = total.toFixed(2);

    selectedCategories.forEach((catObj, cIdx) => {
      const cat = catObj.cat;
      const catTotal = catObj.ops.reduce((a, e) => a + Number(e.amount), 0);
      splitSavingsFields.innerHTML += `<div class="fw-bold mt-2">${cat} - ${catTotal} €</div>`;
      goals.forEach(goal => {
        splitSavingsFields.innerHTML += `
          <div class="input-group mb-1">
            <span class="input-group-text">${goal.goal_name}</span>
            <input type="number" min="0" max="${catTotal}" step="0.01" class="form-control split-saving-input" data-goal="${goal.id}" data-catidx="${cIdx}" value="0">
            <span class="input-group-text">€</span>
          </div>
        `;
      });
    });
  }
  savingsListDiv.removeEventListener("change", updateSplitFields); // Prevent double binding
  savingsListDiv.addEventListener("change", updateSplitFields);

  // 5. Gestion du submit du formulaire de transfert
  document.getElementById("transferForm").onsubmit = async function(ev) {
    ev.preventDefault();

    // Récupère la répartition du remaining
    const remainingSplits = {};
    document.querySelectorAll(".remaining-split").forEach(input => {
      const val = parseFloat(input.value) || 0;
      if (val > 0) remainingSplits[input.dataset.goal] = val;
    });

    // Récupère la répartition des catégories sélectionnées
    const spentSplits = {};
    let valid = true;
    selectedCategories.forEach((catObj, cIdx) => {
      let sum = 0;
      goals.forEach(goal => {
        const input = document.querySelector(`.split-saving-input[data-goal="${goal.id}"][data-catidx="${cIdx}"]`);
        const val = parseFloat(input.value) || 0;
        if (val > 0) {
          if (!spentSplits[goal.id]) spentSplits[goal.id] = 0;
          spentSplits[goal.id] += val;
        }
        sum += val;
      });
      const catTotal = catObj.ops.reduce((a, e) => a + Number(e.amount), 0);
      if (sum > catTotal) valid = false;
    });
    if (!valid) {
      alert("You cannot split more than the selected category total.");
      return;
    }

    // Vérifie que la somme ne dépasse pas le remaining
    const totalR = Object.values(remainingSplits).reduce((a, b) => a + b, 0);
    if (totalR > remainingAvailable) {
      alert("You cannot transfer more than the available remaining.");
      return;
    }

    // Envoie au backend
    const res = await fetch("../php/transfer_to_goal.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        remainingSplits,
        spentSplits,
        month: document.getElementById("trackingMonth").value
      })
    });
    const data = await res.json();
    if (data.success) {
      alert("Transfer completed!");
      bootstrap.Modal.getInstance(document.getElementById("transferModal")).hide();
      const [year, monthStr] = document.getElementById("trackingMonth").value.split("-");
      await fetchExpenses(parseInt(monthStr, 10), parseInt(year, 10));
      if (typeof refreshGoalsProgress === "function") refreshGoalsProgress();
    } else {
      alert(data.message || "Error during transfer.");
    }
  };
});
async function fetchAndDisplayGoalTransfers() {
  const month = document.getElementById("trackingMonth").value;
  const res = await fetch(`../php/get_goal_transfers.php?month=${month}`);
  const data = await res.json();
  const tbody = document.querySelector("#goalTransfersTable tbody");
  tbody.innerHTML = "";
  if (data.transfers && data.transfers.length) {
    data.transfers.forEach((tr, idx) => {
      tbody.innerHTML += `
        <tr>
          <td>${tr.date}</td>
          <td>€${Number(tr.amount).toFixed(2)}</td>
          <td>${tr.goal_name || "-"}</td>
          <td>${tr.category.replace("Goal Transfer ", "")}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-transfer" 
              data-date="${tr.date}" 
              data-amount="${tr.amount}" 
              data-category="${tr.category}" 
              data-goal="${tr.goal_id || ''}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transfers this month</td></tr>`;
  }

  // Add delete logic
  tbody.querySelectorAll(".delete-transfer").forEach(btn => {
    btn.addEventListener("click", async function() {
      if (!confirm("Delete this transfer?")) return;
      const date = btn.getAttribute("data-date");
      const amount = btn.getAttribute("data-amount");
      const category = btn.getAttribute("data-category");
      // goal_id is optional, not used in PHP delete, but can be sent if you update your PHP
      const res = await fetch("../php/delete_expense.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, amount, category })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAndDisplayGoalTransfers();
        // Refresh other views if needed
        const [year, monthStr] = document.getElementById("trackingMonth").value.split("-");
        await fetchExpenses(parseInt(monthStr, 10), parseInt(year, 10));
        if (typeof refreshGoalsProgress === "function") refreshGoalsProgress();
      } else {
        alert(data.message || "Error deleting transfer.");
      }
    });
  });
}
// Appelle cette fonction au chargement et quand le mois change ou après un transfert
document.addEventListener("DOMContentLoaded", fetchAndDisplayGoalTransfers);
document.getElementById("trackingMonth").addEventListener("change", fetchAndDisplayGoalTransfers);
