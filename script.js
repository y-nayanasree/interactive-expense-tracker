
// Get HTML elements
const expenseForm = document.getElementById("expenseForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("expenseDate");

const expenseList = document.getElementById("expenseList");
const totalAmount = document.getElementById("totalAmount");
const totalCount = document.getElementById("totalCount");
const highestAmount = document.getElementById("highestAmount");
const filteredTotal = document.getElementById("filteredTotal");
const categorySummary = document.getElementById("categorySummary");

const categoryFilter = document.getElementById("categoryFilter");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");
const formTitle = document.getElementById("formTitle");

// Load saved expenses
let expenses = JSON.parse(localStorage.getItem("spendwiseExpenses")) || [];
let editingId = null;

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

// Save expenses in LocalStorage
function saveExpenses() {
    localStorage.setItem(
        "spendwiseExpenses",
        JSON.stringify(expenses)
    );
}

// Set today's date
const today = new Date();
const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

dateInput.value = todayString;

document.getElementById("todayDate").textContent =
    today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// Add or update expense
expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description || !Number.isFinite(amount) ||
        amount <= 0 || !date || date > todayString) {
        alert("Please enter valid expense details and date.");
        return;
    }

    if (editingId !== null) {
        const index = expenses.findIndex(
            expense => expense.id === editingId
        );

        if (index !== -1) {
            expenses[index] = {
                ...expenses[index],
                description,
                amount,
                category,
                date
            };
        }

        editingId = null;
        submitBtn.textContent = "Add Expense";
        formTitle.textContent = "Add New Expense";
        cancelEdit.hidden = true;

    } else {
        const newExpense = {
            id: Date.now(),
            description,
            amount,
            category,
            date
        };

        expenses.push(newExpense);
    }

    saveExpenses();
    expenseForm.reset();
    dateInput.value = todayString;

    renderExpenses();
});

// Edit expense
function editExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) return;

    editingId = id;

    descriptionInput.value = expense.description;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;

    submitBtn.textContent = "Update Expense";
    formTitle.textContent = "Edit Expense";
    cancelEdit.hidden = false;

    document.querySelector(".form-panel").scrollIntoView({
        behavior: "smooth"
    });
}

// Cancel editing
cancelEdit.addEventListener("click", function() {
    editingId = null;
    expenseForm.reset();
    dateInput.value = todayString;

    submitBtn.textContent = "Add Expense";
    formTitle.textContent = "Add New Expense";
    cancelEdit.hidden = true;
});

// Delete expense
function deleteExpense(id) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    expenses = expenses.filter(item => item.id !== id);

    if (editingId === id) {
        editingId = null;
        expenseForm.reset();
        dateInput.value = todayString;
        submitBtn.textContent = "Add Expense";
        formTitle.textContent = "Add New Expense";
        cancelEdit.hidden = true;
    }

    saveExpenses();
    renderExpenses();
}

// Get filtered expenses
function getFilteredExpenses() {
    const selectedCategory = categoryFilter.value;
    const from = startDate.value;
    const to = endDate.value;

    if (from && to && from > to) {
        return [];
    }

    return expenses.filter(expense => {
        const categoryMatch =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        const startMatch = !from || expense.date >= from;
        const endMatch = !to || expense.date <= to;

        return categoryMatch && startMatch && endMatch;
    }).sort((a, b) => {
        return b.date.localeCompare(a.date) || b.id - a.id;
    });
}

// Display expense list
function renderExpenses() {
    const filteredExpenses = getFilteredExpenses();

    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <span>₹</span>
                <h3>No expenses found</h3>
                <p>Add an expense or change your filters.</p>
            </div>
        `;
    } else {
        expenseList.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <h3>${escapeHTML(expense.description)}</h3>
                    <p>${escapeHTML(expense.category)} · ${expense.date}</p>
                </div>

                <div class="expense-right">
                    <strong>${formatCurrency(expense.amount)}</strong>

                    <div class="actions">
                        <button class="edit-btn"
                            data-action="edit"
                            data-id="${expense.id}">
                            Edit
                        </button>

                        <button class="delete-btn"
                            data-action="delete"
                            data-id="${expense.id}">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }

    // Calculate filtered total
    const filteredSum = filteredExpenses.reduce(
        (sum, item) => sum + item.amount, 0
    );

    filteredTotal.textContent = formatCurrency(filteredSum);

    // Calculate overall dashboard statistics
    const total = expenses.reduce(
        (sum, item) => sum + item.amount, 0
    );

    totalAmount.textContent = formatCurrency(total);
    totalCount.textContent = expenses.length;

    const highest = expenses.length
        ? Math.max(...expenses.map(item => item.amount))
        : 0;

    highestAmount.textContent = formatCurrency(highest);

    renderCategorySummary();
}

// Prevent HTML injection in descriptions
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Category-wise summary
function renderCategorySummary() {
    const totals = {};

    expenses.forEach(expense => {
        totals[expense.category] =
            (totals[expense.category] || 0) + expense.amount;
    });

    const categories = Object.entries(totals);

    if (categories.length === 0) {
        categorySummary.innerHTML =
            "<p>No category data available.</p>";
        return;
    }

    categorySummary.innerHTML = categories.map(
        ([category, amount]) => `
            <div class="category-item">
                <span>${escapeHTML(category)}</span>
                <strong>${formatCurrency(amount)}</strong>
            </div>
        `
    ).join("");
}

// Filter events
categoryFilter.addEventListener("change", renderExpenses);
startDate.addEventListener("change", renderExpenses);
endDate.addEventListener("change", renderExpenses);

// Clear all filters
document.getElementById("clearFilters").addEventListener("click", function() {
    categoryFilter.value = "All";
    startDate.value = "";
    endDate.value = "";
    renderExpenses();
});

// Handle Edit and Delete buttons
expenseList.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editExpense(id);
    }

    if (button.dataset.action === "delete") {
        deleteExpense(id);
    }
});

// Initial dashboard rendering
renderExpenses();
