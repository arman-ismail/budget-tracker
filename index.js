document.addEventListener('DOMContentLoaded', () => {
    const budgetForm = document.getElementById('budget-form');
    const typeSelect = document.getElementById('type');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const entriesList = document.getElementById('entries');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');

    // Fetch initial entries from external API
    const fetchEntries = async () => {
        try {
            const response = await fetch('http://localhost:3000/entries');
            const data = await response.json();
            return data; // The response is already an array of entries
        } catch (error) {
            console.error('Failed to fetch entries:', error);
            return [];
        }
    };

    // Provide the update summary
    const updateSummary = (entries) => {
        const totalIncome = entries
            .filter(entry => entry.type === 'income')
            .reduce((sum, entry) => sum + entry.amount, 0);
        const totalExpense = entries
            .filter(entry => entry.type === 'expense')
            .reduce((sum, entry) => sum + entry.amount, 0);
        const balance = totalIncome - totalExpense;

        totalIncomeEl.textContent = totalIncome.toFixed(2);
        totalExpenseEl.textContent = totalExpense.toFixed(2);
        balanceEl.textContent = balance.toFixed(2);
    };

    // Create render entries
    const renderEntries = (entries) => {
        entriesList.innerHTML = '';
        entries.forEach(entry => {
            const entryEl = document.createElement('li');
            entryEl.classList.add(entry.type);
            entryEl.innerHTML = `
                ${entry.description}: $${entry.amount.toFixed(2)}
                <div class="entry-actions">
                    <button data-id="${entry.id}" class="edit-btn">Edit</button>
                    <button data-id="${entry.id}" class="delete-btn">Delete</button>
                </div>
            `;
            entriesList.appendChild(entryEl);
        });

        // Attach event listeners to the new buttons
        document.querySelectorAll('.edit-btn').forEach(button =>
            button.addEventListener('click', (e) => editEntry(e.target.dataset.id))
        );
        document.querySelectorAll('.delete-btn').forEach(button =>
            button.addEventListener('click', (e) => deleteEntry(e.target.dataset.id))
        );
    };

    // Create form submission event listener
    budgetForm.addEventListener('submit', async event => {
        event.preventDefault();
        const type = typeSelect.value;
        const description = descriptionInput.value;
        const amount = parseFloat(amountInput.value);

        if (description && !isNaN(amount)) {
            const newEntry = { type, description, amount };

            try {
                const response = await fetch('http://localhost:3000/entries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newEntry),
                });
                const savedEntry = await response.json();
                const entries = await fetchEntries();
                renderEntries(entries);
                updateSummary(entries);
                budgetForm.reset();
            } catch (error) {
                console.error('Failed to save entry:', error);
            }
        }
    });

    // Edit the entry function
    window.editEntry = async id => {
        try {
            const response = await fetch(`http://localhost:3000/entries/${id}`);
            const entry = await response.json();
            typeSelect.value = entry.type;
            descriptionInput.value = entry.description;
            amountInput.value = entry.amount;

            // Update the entry on the server when the form is resubmitted
            budgetForm.onsubmit = async event => {
                event.preventDefault();
                const updatedEntry = {
                    type: typeSelect.value,
                    description: descriptionInput.value,
                    amount: parseFloat(amountInput.value),
                };

                try {
                    await fetch(`http://localhost:3000/entries/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedEntry),
                    });
                    const entries = await fetchEntries();
                    renderEntries(entries);
                    updateSummary(entries);
                    budgetForm.reset();
                    budgetForm.onsubmit = null; // Reset to default onsubmit behavior
                } catch (error) {
                    console.error('Failed to update entry:', error);
                }
            };
        } catch (error) {
            console.error('Failed to fetch entry:', error);
        }
    };

    // Delete the entry function
    window.deleteEntry = async id => {
        try {
            await fetch(`http://localhost:3000/entries/${id}`, {
                method: 'DELETE',
            });
            const entries = await fetchEntries();
            renderEntries(entries);
            updateSummary(entries);
        } catch (error) {
            console.error('Failed to delete entry:', error);
        }
    };

    // Fetch initial entries and initialize
    const initialize = async () => {
        const entries = await fetchEntries();
        renderEntries(entries);
        updateSummary(entries);
    };

    initialize();
});
