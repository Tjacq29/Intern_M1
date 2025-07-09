document.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('yearSelect');
  const currencySelect = document.getElementById('currencySelect');
  const currentYear = new Date().getFullYear();
  let currentCurrency = currencySelect ? currencySelect.value : 'EUR';

  // Populate year select (last 5 years + current)
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  function formatCurrency(amount, currency) {
    if (currency === 'IDR') {
      return 'Rp ' + amount.toLocaleString('id-ID', {minimumFractionDigits: 0});
    } else {
      return '€' + amount.toLocaleString('fr-FR', {minimumFractionDigits: 2});
    }
  }

function fetchSummary(year) {
  fetch(`../php/summary.php?year=${year}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('totalSpent').textContent = formatCurrency(data.total_spent, currentCurrency);
      document.getElementById('totalExpenses').textContent = formatCurrency(data.total_budget || 0, currentCurrency);
      document.getElementById('totalRemaining').textContent = formatCurrency(data.total_remaining, currentCurrency);

      document.getElementById('highestExpense').textContent = data.highest_expense.amount ? formatCurrency(data.highest_expense.amount, currentCurrency) : "-";
      document.getElementById('lowestExpense').textContent = data.lowest_expense.amount ? formatCurrency(data.lowest_expense.amount, currentCurrency) : "-";

      // Ajoute ce log pour déboguer la donnée du mois le plus dépensier
      console.log("most_spent_month:", data.most_spent_month);

      // Affiche le nom du mois le plus dépensier
      if (data.most_spent_month && data.most_spent_month.month) {
        document.getElementById('mostSpentMonth').textContent = data.most_spent_month.month;
      } else {
        document.getElementById('mostSpentMonth').textContent = "-";
      }

      document.getElementById('mostSpentValue').textContent = data.most_spent_month && data.most_spent_month.amount
        ? formatCurrency(data.most_spent_month.amount, currentCurrency)
        : "";

      renderMonthlyChart(data.monthly_expenses);
      renderCategoryChart(data.category_expenses);
    });
  }
  function renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (window.monthlyChart && typeof window.monthlyChart.destroy === "function") {
      window.monthlyChart.destroy();
    }
    window.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyData.map(m => m.month),
        datasets: [{
          label: 'Expenses',
          data: monthlyData.map(m => m.amount),
          backgroundColor: '#0d6efd'
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => formatCurrency(context.parsed.y, currentCurrency)
            }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderCategoryChart(categoryData) {
    const filtered = categoryData.filter(
      c => !c.category.toLowerCase().startsWith('goal transfer')
    );
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (window.categoryChart && typeof window.categoryChart.destroy === "function") {
      window.categoryChart.destroy();
    }
    window.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: filtered.map(c => c.category),
        datasets: [{
          label: 'Expenses',
          data: filtered.map(c => c.amount),
          backgroundColor: [
            '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997'
          ]
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => formatCurrency(context.parsed.x || context.parsed.y, currentCurrency)
            }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  fetchSummary(currentYear);

  yearSelect.addEventListener('change', () => {
    fetchSummary(yearSelect.value);
  });

  if (currencySelect) {
    currencySelect.addEventListener('change', () => {
      currentCurrency = currencySelect.value;
      fetchSummary(yearSelect.value);
    });
  }
});

document.getElementById('highestExpenseCard').addEventListener('click', function() {
  showExpenseHistory('highest');
});
document.getElementById('lowestExpenseCard').addEventListener('click', function() {
  showExpenseHistory('lowest');
});

function showExpenseHistory(type) {
  const year = document.getElementById('yearSelect').value;
  const currency = document.getElementById('currencySelect').value;
  fetch(`../php/expense_history.php?year=${year}&type=${type}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('expenseHistoryList');
      list.innerHTML = '';
      if (!data.length) {
        list.innerHTML = '<li class="list-group-item text-muted">No data</li>';
      } else {
        data.forEach(exp => {
          list.innerHTML += `<li class="list-group-item">
            <strong>${formatCurrency(exp.amount, currency)}</strong> - ${exp.category} <span class="text-muted">(${exp.date})</span>
          </li>`;
        });
      }
      document.getElementById('expenseHistoryModalLabel').textContent =
        type === 'highest' ? 'Highest Expenses' : 'Lowest Expenses';
      const modal = new bootstrap.Modal(document.getElementById('expenseHistoryModal'));
      modal.show();
    });
}

function formatCurrency(amount, currency) {
  if (currency === 'IDR') {
    return 'Rp ' + amount.toLocaleString('id-ID', {minimumFractionDigits: 0});
  } else {
    return '€' + amount.toLocaleString('fr-FR', {minimumFractionDigits: 2});
  }
}