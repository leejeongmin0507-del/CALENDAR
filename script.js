let currentYear, currentMonth;
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

const SCHEDULE_COLORS = [
    '#3F7EA6', // 파랑 (기본)
    '#D93030', // 빨강
    '#5BA666', // 초록
    '#F2C230', // 노랑
    '#BF69B1', // 보라
    '#F2AE30', // 주황
    '#54A1BF', // 하늘
    '#BFBFB0', // 회색
];

const HOLIDAYS = {
    '2025-01-01': '신정',
    '2025-01-28': '설날 연휴',
    '2025-01-29': '설날',
    '2025-01-30': '설날 연휴',
    '2025-03-01': '삼일절',
    '2025-05-05': '어린이날',
    '2025-05-06': '대체공휴일',
    '2025-05-26': '석가탄신일',
    '2025-06-06': '현충일',
    '2025-08-15': '광복절',
    '2025-09-29': '추석 연휴',
    '2025-09-30': '추석',
    '2025-10-01': '추석 연휴',
    '2025-10-03': '개천절',
    '2025-10-09': '한글날',
    '2025-12-25': '성탄절',
};

const datesContainer = document.getElementById('dates-container');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const addButton = document.getElementById('add-button');
const goToTodayBtn = document.getElementById('go-to-today');
const clearAllBtn = document.getElementById('clear-all-schedules');
const scheduleDateInput = document.getElementById('schedule-date');
const scheduleEndDateInput = document.getElementById('schedule-end-date');
const scheduleTextInput = document.getElementById('schedule-text');
const scheduleRepeatInput = document.getElementById('schedule-repeat');
const scheduleColorInput = document.getElementById('schedule-color'); 

const editModalOverlay = document.getElementById('edit-modal-overlay');
const closeEditModalBtn = document.getElementById('close-edit-modal');
const saveEditButton = document.getElementById('save-edit-button');

const editDateInput = document.getElementById('edit-date');
const editEndDateInput = document.getElementById('edit-end-date');
const editTextInput = document.getElementById('edit-text');
const editRepeatInput = document.getElementById('edit-repeat');
const editColorInput = document.getElementById('edit-color'); 
const editIdInput = document.getElementById('edit-id');

const detailModalOverlay = document.getElementById('detail-modal-overlay');
const closeDetailModalBtn = document.getElementById('close-detail-modal');
const editFromDetailBtn = document.getElementById('edit-from-detail');
const deleteFromDetailBtn = document.getElementById('delete-from-detail');

const settingsModalOverlay = document.getElementById('settings-modal-overlay');
const openSettingsModalBtn = document.getElementById('open-settings-modal');
const closeSettingsModalBtn = document.getElementById('close-settings-modal');
const themeSelector = document.getElementById('theme-selector');
const body = document.body;
const bgImageInput = document.getElementById('background-image-input');
const resetBackgroundBtn = document.getElementById('reset-background');

const dailyListModalOverlay = document.getElementById('daily-list-modal-overlay');
const closeDailyListModalBtn = document.getElementById('close-daily-list-modal');
const dailyListDateSpan = document.getElementById('daily-list-date');
const dailyListContainer = document.getElementById('daily-list-container');

// ----------------------------------------------------
function getTextColor(hex) {
    return '#FFFFFF'; 
}

function renderCalendar() {
    const today = new Date();
    currentMonthYear.textContent = `${currentYear}년 ${currentMonth + 1}월`;
    datesContainer.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const date = prevMonthLastDate - firstDay + i + 1;
        createDateCell(date, true, new Date(currentYear, currentMonth - 1, date)); 
    }

    for (let date = 1; date <= lastDate; date++) {
        const dateObj = new Date(currentYear, currentMonth, date);
        const cell = createDateCell(date, false, dateObj);
        
        if (dateObj.toDateString() === today.toDateString()) {
            cell.classList.add('current-day');
        }
        
        renderSchedulesForDay(cell, dateObj);
    }
    
    const totalCells = firstDay + lastDate;
    const nextMonthDays = 42 - totalCells; 
    for (let i = 1; i <= nextMonthDays; i++) {
        createDateCell(i, true, new Date(currentYear, currentMonth + 1, i));
    }
}


function createDateCell(date, isFiller, dateObj) { 
    const cell = document.createElement('div');
    cell.className = 'date-cell';
    
    const dateNumber = document.createElement('span');
    dateNumber.className = 'date-number';
    
    if (!isFiller) { 
        dateNumber.textContent = date;
    } 
    
    cell.appendChild(dateNumber);

    if (!isFiller) {
        const dateKey = formatDate(dateObj); // YYYY-MM-DD
        const holidayName = HOLIDAYS[dateKey];
        
        if (holidayName) {
            cell.classList.add('sunday');
            
            const holidaySpan = document.createElement('span');
            holidaySpan.className = 'holiday-text';
            holidaySpan.textContent = holidayName;
            cell.appendChild(holidaySpan);
        }
    }
    
    if (isFiller) {
        cell.classList.add('empty-cell');
        cell.style.pointerEvents = 'none'; 
    } else {
        cell.addEventListener('click', () => {
            const daySchedules = getSchedulesForDay(dateObj);
            if (daySchedules.length > 2) { 
                 openDailyListModal(dateObj);
            } else {
                scheduleDateInput.value = formatDate(dateObj);
                scheduleDateInput.focus();
                document.getElementById('calendar-app').scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });
    }

    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) cell.classList.add('sunday');
    if (dayOfWeek === 6) cell.classList.add('saturday');

    datesContainer.appendChild(cell);
    return cell;
}

function getSchedulesForDay(dateObj) {
    const dayOfWeek = dateObj.getDay(); 
    
    return schedules.filter(s => {
        const start = new Date(s.date);
        const end = s.endDate ? new Date(s.endDate) : start;
        const current = dateObj;
        
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        current.setHours(0, 0, 0, 0);
        
        const isWithinRange = current >= start && current <= end;

        const isRepeating = s.repeat !== 'none';
        
        if (isRepeating) {
            if (s.repeat === 'weekly' && start.toDateString() === end.toDateString()) {
                return start.getDay() === dayOfWeek;
            } else if (s.repeat === 'monthly' && start.toDateString() === end.toDateString()) {
                return start.getDate() === current.getDate();
            }
        }
        
        return isWithinRange;
    });
}

function renderSchedulesForDay(cell, dateObj) {
    const daySchedules = getSchedulesForDay(dateObj);
    const daySchedulesCount = daySchedules.length;
    const maxSchedulesToShow = 2; // 최대 2개
    let visibleCount = 0;

    if (daySchedulesCount > maxSchedulesToShow) { 
        const summary = document.createElement('span');
        summary.className = 'schedule-summary';
        summary.textContent = `...`; 
        summary.addEventListener('click', (e) => {
            e.stopPropagation(); 
            openDailyListModal(dateObj);
        });
        cell.appendChild(summary);
    }

    daySchedules.forEach((schedule, index) => {
        if (index < maxSchedulesToShow) {
            const item = createScheduleItem(schedule, dateObj);
            cell.appendChild(item);
            visibleCount++;
        }
    });
    
    for (let i = visibleCount; i < maxSchedulesToShow; i++) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'schedule-item empty-space';
        cell.appendChild(emptyItem);
    }
}

function createScheduleItem(schedule, dateObj) {
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.textContent = schedule.text;
    item.dataset.id = schedule.id;
    
    const bgColor = schedule.color || SCHEDULE_COLORS[0];
    item.style.setProperty('--schedule-bg-color', bgColor);
    item.style.color = getTextColor(bgColor); 

    const startDate = new Date(schedule.date);
    const endDate = schedule.endDate && schedule.endDate !== schedule.date ? new Date(schedule.endDate) : startDate;
    
    if (schedule.repeat !== 'none' && startDate.toDateString() === endDate.toDateString()) {
        item.classList.add('repeated-schedule');
    }

    if (startDate.toDateString() !== endDate.toDateString()) {
        item.classList.add('multi-day');
        
        if (dateObj.toDateString() === startDate.toDateString()) {
            item.classList.add('start-date');
            item.textContent = schedule.text; 
        } else if (dateObj.toDateString() === endDate.toDateString()) {
            item.classList.add('end-date');
            item.textContent = ''; 
        } else {
            item.classList.add('mid-date');
            item.textContent = ''; 
        }
    }
    
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(schedule.id);
    });

    return item;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initCalendar() {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    
    scheduleDateInput.value = formatDate(today);
    if (scheduleColorInput) { 
        scheduleColorInput.value = SCHEDULE_COLORS[0];
    }
    
    renderCalendar();    
}

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

scheduleDateInput.addEventListener('change', () => {
    scheduleEndDateInput.min = scheduleDateInput.value;
    if (scheduleEndDateInput.value < scheduleDateInput.value) {
        scheduleEndDateInput.value = scheduleDateInput.value;
    }
});
scheduleEndDateInput.addEventListener('focus', () => {
    scheduleEndDateInput.min = scheduleDateInput.value;
});

addButton.addEventListener('click', () => {
    const date = scheduleDateInput.value;
    let endDate = scheduleEndDateInput.value;
    const text = scheduleTextInput.value.trim();
    const repeat = scheduleRepeatInput.value;
    const color = scheduleColorInput.value; // <select>

    if (!date || !text) {
        alert('시작 날짜와 내용을 입력해주세요.');
        return;
    }
    
    if (endDate === date || !endDate) {
        endDate = null;
    } else if (endDate < date) {
         alert('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
         return;
    }

    if (endDate && repeat !== 'none') {
        alert('연속 일정은 반복 설정을 지원하지 않습니다.');
        return;
    }
    
    const newSchedule = {
        id: Date.now(),
        date: date,
        endDate: endDate,
        text: text,
        repeat: endDate ? 'none' : repeat, 
        color: color,
    };

    schedules.push(newSchedule);
    saveSchedules();
    
    if (new Date(date).getFullYear() === currentYear && new Date(date).getMonth() === currentMonth) {
        renderCalendar();
    }
    
    scheduleTextInput.value = '';
    scheduleEndDateInput.value = '';
    scheduleRepeatInput.value = 'none';
    if (scheduleColorInput) {
        scheduleColorInput.value = SCHEDULE_COLORS[0];
    }
});


function openEditModal(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    editIdInput.value = schedule.id;
    editDateInput.value = schedule.date;
    editEndDateInput.value = schedule.endDate || '';
    editTextInput.value = schedule.text;
    editRepeatInput.value = schedule.repeat;
    editColorInput.value = schedule.color || SCHEDULE_COLORS[0]; 
    
    editEndDateInput.min = editDateInput.value; 

    editModalOverlay.classList.remove('hidden');
}

closeEditModalBtn.addEventListener('click', () => {
    editModalOverlay.classList.add('hidden');
});

saveEditButton.addEventListener('click', () => {
    const id = parseInt(editIdInput.value);
    const index = schedules.findIndex(s => s.id === id);

    if (index !== -1) {
        let endDate = editEndDateInput.value;
        const date = editDateInput.value;
        const repeat = editRepeatInput.value;

        if (endDate === date || !endDate) {
            endDate = null;
        } else if (endDate < date) {
             alert('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
             return;
        }

        if (endDate && repeat !== 'none') {
             alert('연속 일정은 반복 설정을 지원하지 않습니다.');
             return;
        }

        schedules[index].date = date;
        schedules[index].endDate = endDate;
        schedules[index].text = editTextInput.value.trim();
        schedules[index].repeat = endDate ? 'none' : repeat; 
        schedules[index].color = editColorInput.value; // <select>에서 선택된 값
        
        saveSchedules();
        renderCalendar();
        editModalOverlay.classList.add('hidden');
    }
});


function openDetailModal(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    detailModalOverlay.dataset.currentId = schedule.id;
    
    const endDateDisplay = schedule.endDate && schedule.endDate !== schedule.date 
                            ? ` ~ ${schedule.endDate}` : '';
                            
    document.getElementById('detail-date').textContent = `${schedule.date}${endDateDisplay}`;
    document.getElementById('detail-text').textContent = schedule.text;
    document.getElementById('detail-repeat').textContent = schedule.repeat === 'none' 
                                                            ? '반복 없음' 
                                                            : (schedule.repeat === 'weekly' ? '매주 반복' : '매월 반복');

    detailModalOverlay.classList.remove('hidden');
}

closeDetailModalBtn.addEventListener('click', () => {
    detailModalOverlay.classList.add('hidden');
});

editFromDetailBtn.addEventListener('click', () => {
    const id = parseInt(detailModalOverlay.dataset.currentId);
    detailModalOverlay.classList.add('hidden');
    openEditModal(id);
});

deleteFromDetailBtn.addEventListener('click', () => {
    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
        const id = parseInt(detailModalOverlay.dataset.currentId);
        schedules = schedules.filter(s => s.id !== id);
        saveSchedules();
        renderCalendar();
        detailModalOverlay.classList.add('hidden');
    }
});

function openDailyListModal(dateObj) {
    const dateStr = formatDate(dateObj);
    dailyListDateSpan.textContent = dateStr;
    
    const daySchedules = getSchedulesForDay(dateObj); 
    
    dailyListContainer.innerHTML = '';

    if (daySchedules.length === 0) {
        dailyListContainer.textContent = '해당 날짜에 일정이 없습니다.';
    } else {
        daySchedules.forEach(schedule => {
            const item = document.createElement('div');
            item.className = 'daily-list-item';
            
            const colorDot = document.createElement('span');
            colorDot.style.width = '10px';
            colorDot.style.height = '10px';
            colorDot.style.borderRadius = '50%';
            colorDot.style.backgroundColor = schedule.color || SCHEDULE_COLORS[0];
            colorDot.style.marginRight = '10px';
            colorDot.style.display = 'inline-block';
            item.appendChild(colorDot);
            
            const textSpan = document.createElement('span');
            textSpan.className = 'daily-list-text';
            textSpan.textContent = schedule.text;
            item.appendChild(textSpan);

            const editBtn = document.createElement('button');
            editBtn.className = 'daily-list-edit-btn';
            editBtn.textContent = '수정';
            editBtn.addEventListener('click', () => {
                dailyListModalOverlay.classList.add('hidden');
                openEditModal(schedule.id);
            });
            item.appendChild(editBtn);

            dailyListContainer.appendChild(item);
        });
    }

    dailyListModalOverlay.classList.remove('hidden');
}

closeDailyListModalBtn.addEventListener('click', () => {
    dailyListModalOverlay.classList.add('hidden');
});

function saveSchedules() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
}

goToTodayBtn.addEventListener('click', () => {
    initCalendar(); 
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('모든 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        schedules = [];
        saveSchedules();
        renderCalendar();
    }
});


function applyTheme(themeName) {
    const themeSettings = {
        1: { '--primary-color': '#34479e', '--secondary-color': '#e74c3c', '--app-bg': 'white', '--text-color': '#4b4b4b', '--border-color': '#d1d8dc', '--main-bg': '#f8f6f2', '--date-num-color': '#34479e' },
        2: { '--primary-color': '#009688', '--secondary-color': '#ff5722', '--app-bg': '#f9f9f9', '--text-color': '#333333', '--border-color': '#b2dfdb', '--main-bg': '#e0f2f1', '--date-num-color': '#009688' },
        3: { 
            '--primary-color': '#595958',
            '--secondary-color': '#8C0B0B', 
            '--app-bg': '#FFFFFF', 
            '--text-color': '#88898C', 
            '--border-color': '#888A8F', 
            '--main-bg': '#D2D5D9' 
        },
        4: { 
            '--primary-color': '#112250', 
            '--secondary-color': '#3c5070', 
            '--app-bg': '#f5f0e9', 
            '--text-color': '#8C7770', 
            '--border-color': '#d9cbc2', 
            '--main-bg': '#e0c58f' 
        }
    }; 
    
    const currentTheme = themeSettings[themeName] || themeSettings['1']; 
    for (const [key, value] of Object.entries(currentTheme)) {
        document.documentElement.style.setProperty(key, value);
    }
    localStorage.setItem('theme', themeName);
}

function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || '1';
    applyTheme(savedTheme);
    
    // 배경 이미지 로드
    const savedBg = localStorage.getItem('backgroundImage');
    if (savedBg) {
        body.style.backgroundImage = `url(${savedBg})`;
        body.style.backgroundColor = 'transparent'; 
    }
    
    document.querySelectorAll('#theme-selector button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
}

openSettingsModalBtn.addEventListener('click', () => settingsModalOverlay.classList.remove('hidden'));
closeSettingsModalBtn.addEventListener('click', () => settingsModalOverlay.classList.add('hidden'));

document.querySelectorAll('#theme-selector button').forEach(button => {
    button.addEventListener('click', (e) => {
        const theme = e.target.dataset.theme;
        applyTheme(theme);
    });
});

bgImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Image = event.target.result;
            body.style.backgroundImage = `url(${base64Image})`;
            body.style.backgroundColor = 'transparent'; 
            localStorage.setItem('backgroundImage', base64Image);
        };
        reader.readAsDataURL(file);
    }
});

resetBackgroundBtn.addEventListener('click', () => {
    body.style.backgroundImage = 'none';
    localStorage.removeItem('backgroundImage');
    const savedTheme = localStorage.getItem('theme') || 'default';
    const mainBgColor = document.documentElement.style.getPropertyValue('--main-bg'); 
    body.style.backgroundColor = mainBgColor || '#f8f6f2'; 
});


loadSettings(); 
initCalendar();
