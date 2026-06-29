document.addEventListener('DOMContentLoaded', () => {
    let state = {
        tasks: [],
        filter: 'all',
        searchQuery: '',
        theme: 'light',
        activeView: 'dashboard',
        userName: 'Productive Guest',
        taskToDelete: null
    };

    const html = document.documentElement;

    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const btnHamburger = document.getElementById('btnHamburger');
    const btnCloseSidebar = document.getElementById('btnCloseSidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');

    const headerUserName = document.getElementById('headerUserName');
    const currentDateLabel = document.getElementById('currentDate');
    const searchInput = document.getElementById('searchInput');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const headerProfileAvatar = document.getElementById('headerProfileAvatar');

    const dashboardViewport = document.getElementById('dashboardViewport');
    const statsGrid = document.getElementById('statsGrid');
    const taskInputSection = document.getElementById('taskInputSection');
    const taskExplorerSection = document.getElementById('taskExplorerSection');
    const settingsView = document.getElementById('settingsView');

    const totalTasksCount = document.getElementById('totalTasksCount');
    const pendingTasksCount = document.getElementById('pendingTasksCount');
    const completedTasksCount = document.getElementById('completedTasksCount');
    const productivityScore = document.getElementById('productivityScore');
    const statPercentTotal = document.getElementById('statPercentTotal');
    const statPercentPending = document.getElementById('statPercentPending');
    const statPercentCompleted = document.getElementById('statPercentCompleted');
    const statPercentProductivity = document.getElementById('statPercentProductivity');

    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const prioritySelect = document.getElementById('prioritySelect');

    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const btnEmptyStateAction = document.getElementById('btnEmptyStateAction');

    const confirmModal = document.getElementById('confirmModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    const settingsNameInput = document.getElementById('settingsNameInput');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnResetDatabase = document.getElementById('btnResetDatabase');

    const toastContainer = document.getElementById('toastContainer');

    function sanitizeHTML(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return str.replace(/[&<>'"]/g, tag => map[tag] || tag);
    }

    function formatDueDate(dateString) {
        if (!dateString) return 'No due date';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = new Date(dateString);
        due.setHours(0, 0, 0, 0);

        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (diff === 0) return 'Due today';
        if (diff === 1) return 'Due tomorrow';
        if (diff === -1) return 'Due yesterday';
        if (diff < -1) return `Overdue by ${Math.abs(diff)}d`;

        return 'Due ' + due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function isOverdue(dateString, isCompleted) {
        if (!dateString || isCompleted) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateString);
        due.setHours(0, 0, 0, 0);
        return due < today;
    }

    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17 || hour < 4) greeting = 'Good evening';
        headerUserName.textContent = `${greeting}, ${state.userName}`;
    }

    function updateHeaderDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateLabel.textContent = new Date().toLocaleDateString(undefined, options);
    }

    function showToast(message, type = 'success') {
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>`
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || ''}</div>
            <div class="toast-msg">${message}</div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3200);
    }

    function saveTasks() {
        localStorage.setItem('taskflow_tasks_pro', JSON.stringify(state.tasks));
    }

    function loadData() {
        const savedTasks = localStorage.getItem('taskflow_tasks_pro');
        state.tasks = savedTasks ? JSON.parse(savedTasks) : [];

        const savedTheme = localStorage.getItem('taskflow_theme_pro');
        state.theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(state.theme);

        const savedName = localStorage.getItem('taskflow_username_pro');
        if (savedName) state.userName = savedName;

        syncUserDisplay();
    }

    function syncUserDisplay() {
        sidebarUserName.textContent = state.userName;
        settingsNameInput.value = state.userName;
        updateGreeting();

        const initials = state.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const avatarText = initials || 'TP';
        sidebarAvatar.textContent = avatarText;
        headerProfileAvatar.textContent = avatarText;
    }

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            sunIcon.classList.add('hide');
            moonIcon.classList.remove('hide');
        } else {
            sunIcon.classList.remove('hide');
            moonIcon.classList.add('hide');
        }
        localStorage.setItem('taskflow_theme_pro', theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(state.theme);
        showToast(`Switched to ${state.theme} mode`, 'info');
    }

    function navigateTo(view) {
        state.activeView = view;

        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-view') === view);
        });

        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');

        if (view === 'settings') {
            dashboardViewport.classList.add('hide');
            settingsView.classList.remove('hide');
            return;
        }

        dashboardViewport.classList.remove('hide');
        settingsView.classList.add('hide');

        if (view === 'dashboard') {
            statsGrid.classList.remove('hide');
            taskInputSection.classList.remove('hide');
            taskExplorerSection.classList.remove('hide');
            state.filter = 'all';
            setActiveFilter('all');
        } else if (view === 'my-tasks') {
            statsGrid.classList.add('hide');
            taskInputSection.classList.remove('hide');
            taskExplorerSection.classList.remove('hide');
            state.filter = 'active';
            setActiveFilter('active');
        } else if (view === 'completed') {
            statsGrid.classList.add('hide');
            taskInputSection.classList.add('hide');
            taskExplorerSection.classList.remove('hide');
            state.filter = 'completed';
            setActiveFilter('completed');
        }

        renderTasks();
        updateStats();
    }

    function setActiveFilter(value) {
        document.querySelectorAll('.filter-tab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === value);
        });
    }

    function updateStats() {
        const total = state.tasks.length;
        const done = state.tasks.filter(t => t.completed).length;
        const pending = total - done;
        const score = total > 0 ? Math.round((done / total) * 100) : 0;

        totalTasksCount.textContent = total;
        pendingTasksCount.textContent = pending;
        completedTasksCount.textContent = done;
        productivityScore.textContent = `${score}%`;

        const bar = document.getElementById('productivityBar');
        if (bar) bar.style.width = `${score}%`;

        statPercentTotal.textContent = total === 1 ? '1 task cataloged' : `${total} tasks cataloged`;
        statPercentPending.textContent = pending === 1 ? '1 active objective' : `${pending} active objectives`;
        statPercentCompleted.textContent = done === 1 ? '1 goal archived' : `${done} goals archived`;
        statPercentProductivity.textContent = score === 100 && total > 0 ? 'All objectives completed!' : `${score}% completion rate`;

        const productivityCard = document.getElementById('cardProductivity');
        productivityCard.classList.toggle('productivity-glow', score === 100 && total > 0);
    }

    function addTask(title, priority, dueDate) {
        const clean = title.trim();
        if (!clean) return;

        state.tasks.unshift({
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title: clean,
            completed: false,
            priority,
            dueDate: dueDate || null,
            createdAt: new Date().toISOString()
        });

        saveTasks();
        updateStats();
        renderTasks();
        showToast('Task created successfully', 'success');

        taskInput.value = '';
        dueDateInput.value = '';
        taskInput.focus();
    }

    function toggleComplete(id) {
        state.tasks = state.tasks.map(task => {
            if (task.id !== id) return task;
            const nowDone = !task.completed;
            showToast(nowDone ? 'Task marked complete' : 'Task moved back to active', 'success');
            return { ...task, completed: nowDone };
        });

        saveTasks();
        updateStats();
        renderTasks();
    }

    function startEditing(id, card) {
        const task = state.tasks.find(t => t.id === id);
        if (!task || task.completed) return;
        if (card.querySelector('.inline-edit-input')) return;

        const titleEl = card.querySelector('.task-title');
        const original = task.title;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = original;
        input.maxLength = 100;

        titleEl.replaceWith(input);
        input.focus();
        input.select();

        function save() {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== original) {
                state.tasks = state.tasks.map(t => t.id === id ? { ...t, title: newTitle } : t);
                saveTasks();
                showToast('Task updated', 'success');
            }
            renderTasks();
        }

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') renderTasks();
        });

        input.addEventListener('blur', save);
    }

    function openDeleteModal(id) {
        state.taskToDelete = id;
        confirmModal.classList.remove('hide');
    }

    function closeDeleteModal() {
        state.taskToDelete = null;
        confirmModal.classList.add('hide');
    }

    function deleteTask() {
        const id = state.taskToDelete;
        if (!id) return;

        const card = document.querySelector(`[data-id="${id}"]`);

        if (card) {
            card.classList.add('slide-out');
            card.addEventListener('animationend', () => {
                state.tasks = state.tasks.filter(t => t.id !== id);
                saveTasks();
                updateStats();
                renderTasks();
                showToast('Task deleted', 'warning');
                closeDeleteModal();
            });
        } else {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveTasks();
            updateStats();
            renderTasks();
            closeDeleteModal();
        }
    }

    function renderTasks() {
        taskList.innerHTML = '';

        let visible = state.tasks.filter(task => {
            if (state.filter === 'active') return !task.completed;
            if (state.filter === 'completed') return task.completed;
            if (state.filter === 'high-priority') return task.priority === 'high';
            return true;
        });

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            visible = visible.filter(t => t.title.toLowerCase().includes(q));
        }

        if (visible.length === 0) {
            emptyState.classList.remove('hide');
            taskList.classList.add('hide');
            updateEmptyMessage();
            return;
        }

        emptyState.classList.add('hide');
        taskList.classList.remove('hide');

        visible.forEach(task => {
            const card = buildTaskCard(task);
            taskList.appendChild(card);
        });
    }

    function updateEmptyMessage() {
        const title = emptyState.querySelector('.empty-title');
        const desc = emptyState.querySelector('.empty-desc');

        if (state.searchQuery) {
            title.textContent = 'No matching tasks';
            desc.textContent = 'No results match your search. Try different keywords.';
            btnEmptyStateAction.classList.add('hide');
        } else if (state.filter === 'completed') {
            title.textContent = 'No completed tasks';
            desc.textContent = 'Check off active tasks to see them here.';
            btnEmptyStateAction.classList.add('hide');
        } else if (state.filter === 'high-priority') {
            title.textContent = 'No high-priority tasks';
            desc.textContent = 'You have no critical tasks right now. Great job!';
            btnEmptyStateAction.classList.add('hide');
        } else {
            title.textContent = 'All tasks completed!';
            desc.textContent = 'Enjoy your day or add a new task to keep going.';
            btnEmptyStateAction.classList.remove('hide');
        }
    }

    function buildTaskCard(task) {
        const overdue = isOverdue(task.dueDate, task.completed);

        const card = document.createElement('div');
        card.className = `task-card${task.completed ? ' completed' : ''}`;
        card.setAttribute('data-id', task.id);

        const editBtn = task.completed ? '' : `
            <button class="btn-icon-action" data-action="edit" title="Edit task">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
        `;

        const dateBadge = task.dueDate ? `
            <span class="date-badge${overdue ? ' overdue' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${formatDueDate(task.dueDate)}
            </span>
        ` : '';

        card.innerHTML = `
            <div class="task-checkbox-col">
                <label class="custom-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle">
                    <span class="checkmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                </label>
            </div>
            <div class="task-content-col">
                <span class="task-title">${sanitizeHTML(task.title)}</span>
                <div class="task-meta-row">
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                    ${dateBadge}
                </div>
            </div>
            <div class="task-actions-col">
                ${editBtn}
                <button class="btn-icon-action btn-delete" data-action="delete" title="Delete task">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        `;

        card.querySelector('[data-action="toggle"]').addEventListener('change', () => toggleComplete(task.id));
        card.querySelector('[data-action="delete"]').addEventListener('click', () => openDeleteModal(task.id));

        if (!task.completed) {
            card.querySelector('[data-action="edit"]').addEventListener('click', () => startEditing(task.id, card));
        }

        return card;
    }

    taskForm.addEventListener('submit', e => {
        e.preventDefault();
        addTask(taskInput.value, prioritySelect.value, dueDateInput.value);
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => navigateTo(item.getAttribute('data-view')));
    });

    btnHamburger.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });

    btnCloseSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.filter = tab.getAttribute('data-filter');
            renderTasks();
        });
    });

    searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        renderTasks();
    });

    themeToggleBtn.addEventListener('click', toggleTheme);

    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', deleteTask);
    confirmModal.addEventListener('click', e => {
        if (e.target === confirmModal) closeDeleteModal();
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !confirmModal.classList.contains('hide')) {
            closeDeleteModal();
        }
    });

    btnSaveProfile.addEventListener('click', () => {
        const name = settingsNameInput.value.trim();
        if (name) {
            state.userName = name;
            localStorage.setItem('taskflow_username_pro', name);
            syncUserDisplay();
            showToast('Profile name updated', 'success');
        }
    });

    btnResetDatabase.addEventListener('click', () => {
        const confirmed = confirm('This will permanently delete all your tasks and settings. Are you sure?');
        if (!confirmed) return;

        localStorage.clear();
        state.tasks = [];
        state.theme = 'light';
        state.userName = 'Productive Guest';
        state.activeView = 'dashboard';

        applyTheme('light');
        syncUserDisplay();
        navigateTo('dashboard');
        showToast('All data cleared', 'warning');
    });

    btnEmptyStateAction.addEventListener('click', () => taskInput.focus());

    loadData();
    updateHeaderDate();
    navigateTo('dashboard');
});
