document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();
    let selectedDate = new Date();
    let tasks = [];

    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYear = document.getElementById('current-month-year');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const tasksListElement = document.getElementById('tasks-list');
    
    const modal = document.getElementById('task-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const taskForm = document.getElementById('task-form');

    fetchTasks();

    function initCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthYear.textContent = `${year}年 ${month + 1}月`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        calendarGrid.innerHTML = '';
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDiv);
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.dataset.date = dateStr;
            
            if (isSameDate(selectedDate, new Date(year, month, i))) {
                dayDiv.classList.add('active');
            }
            
            let indicatorsHtml = '<div class="day-indicators">';
            const dayTasks = tasks.filter(t => t.date === dateStr);
            
            dayTasks.forEach(task => {
                const impClass = task.importance.toLowerCase();
                indicatorsHtml += `<div class="indicator ${impClass}"></div>`;
            });
            indicatorsHtml += '</div>';

            dayDiv.innerHTML = `
                <div>${i}</div>
                ${indicatorsHtml}
            `;
            
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                dayDiv.classList.add('active');
                selectedDate = new Date(year, month, i);
                renderTasks();
            });
            
            calendarGrid.appendChild(dayDiv);
        }
        
        renderTasks();
    }

    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks');
            tasks = await res.json();
            initCalendar();
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function renderTasks() {
        const selectedDateStr = formatDate(selectedDate);
        selectedDateDisplay.textContent = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日のタスク`;
        
        const dayTasks = tasks.filter(t => t.date === selectedDateStr);
        
        if (dayTasks.length === 0) {
            tasksListElement.innerHTML = '<p>タスクはありません</p>';
            return;
        }
        
        tasksListElement.innerHTML = '';
        dayTasks.forEach(task => {
            const impClass = task.importance.toLowerCase();
            const impLabel = task.importance === 'High' ? '高' : (task.importance === 'Medium' ? '中' : '低');
            
            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskEl.innerHTML = `
                <div>
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <strong>${task.title}</strong>
                </div>
                <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${task.description || ''}</div>
                <div>
                    <span class="importance-badge ${impClass}">重要度: ${impLabel}</span>
                    <button class="delete-btn" data-id="${task.id}">削除</button>
                </div>
            `;
            tasksListElement.appendChild(taskEl);
        });

        document.querySelectorAll('.task-item input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const completed = e.target.checked ? 1 : 0;
                await updateTask(id, completed);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await deleteTask(id);
            });
        });
    }

    async function updateTask(id, completed) {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        const task = tasks.find(t => t.id == id);
        if (task) task.completed = completed;
        renderTasks();
    }

    async function deleteTask(id) {
        if (!confirm('削除しますか？')) return;
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        tasks = tasks.filter(t => t.id != id);
        initCalendar();
    }

    openModalBtn.addEventListener('click', () => {
        document.getElementById('task-date').value = formatDate(selectedDate);
        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-desc').value;
        const date = document.getElementById('task-date').value;
        
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, date })
        });
        
        taskForm.reset();
        modal.style.display = 'none';
        
        const taskDate = new Date(date);
        currentDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
        selectedDate = taskDate;
        
        await fetchTasks();
    });

    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        initCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        initCalendar();
    });
});
