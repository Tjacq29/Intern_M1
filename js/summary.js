document.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('yearSelect');
  const currentYear = new Date().getFullYear();

  // Populate year select (last 5 years + current)
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  function fetchSummary(year) {
    fetch(`../php/summary.php?year=${year}`)
      .then(res => res.json())
      .then(data => {
        // Totals
        document.getElementById('totalSpent').textContent = "$" + data.total_spent;
        document.getElementById('totalExpenses').textContent = "$" + data.total_expenses;
        document.getElementById('totalRemaining').textContent = "$" + data.total_remaining;

        // Highest/Lowest
        document.getElementById('highestExpense').textContent = data.highest_expense.amount ? "$" + data.highest_expense.amount : "-";
        document.getElementById('highestExpenseMonth').textContent = data.highest_expense.month || "";
        document.getElementById('lowestExpense').textContent = data.lowest_expense.amount ? "$" + data.lowest_expense.amount : "-";
        document.getElementById('lowestExpenseMonth').textContent = data.lowest_expense.month || "";
        document.getElementById('mostSpentMonth').textContent = data.most_spent_month.month || "-";
        document.getElementById('mostSpentValue').textContent = data.most_spent_month.amount ? "$" + data.most_spent_month.amount : "";

        // Charts
        renderMonthlyChart(data.monthly_expenses);
        renderCategoryChart(data.category_expenses);
      });
  }

  function renderMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (window.monthlyChart) window.monthlyChart.destroy();
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
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (window.categoryChart) window.categoryChart.destroy();
    window.categoryChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categoryData.map(c => c.category),
        datasets: [{
          data: categoryData.map(c => c.amount),
          backgroundColor: [
            '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997'
          ]
        }]
      }
    });
  }

  // Initial fetch
  fetchSummary(currentYear);

  yearSelect.addEventListener('change', () => {
    fetchSummary(yearSelect.value);
  });
});