// script.js

// ==========================================
// 1. КАНФІГУРАЦЫЯ
// ==========================================

// FIREBASE CONSOLE -> PROJECT SETTINGS
const firebaseConfig = {
    apiKey: "AIzaSyD-JSK9q44X3He8-kmoszTX6VwlGpg5_N8",
    authDomain: "bsac-schedule-ft.firebaseapp.com",
    projectId: "bsac-schedule-ft",
    storageBucket: "bsac-schedule-ft.appspot.com",
    messagingSenderId: "937992829672",
    appId: "1:937992829672:android:087feba164f0e5bb22675d"
};

const REPO_OWNER = "ffourtytwot";
const REPO_NAME = "bsac-schedule";
const FILE_PATH = "www/schedule.json";
// Соль і хэш для адмінкі (можаш змяніць на свае)
const SALT = "bsac_super_salt_2025"; 
const TARGET_HASH = "38bff4d29d08888d2f3c8e0250551c3d7662bcc2cd1490048dc22a89502afc41"; 

const API_URL_INFO = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
const RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;

// Спіс груп
const GROUPS_BY_COURSE = {
    "1": ["ИП591", "СИ591", "АП591", "МЦ591", "ЦС591", "ИТ541", "СИ541", "ТЦ541", "ПС541", "ИТ542"],
    "2": ["АП491", "СИ491", "ИП491", "МЦ491", "СИ441", "ТЦ441", "ОП441", "ПС441"],
    "3": ["СИ391", "АП391", "ИП391", "МЦ391", "СИ341", "ТЦ341", "ОП341", "ПС341"],
    "4": ["СП291", "ИТ291", "ИП291", "МС291", "ИТ292"]
};

const TIME_SLOTS = [
    "08:00-09:40", "09:55-11:35", "12:15-13:55",
    "14:10-15:50", "16:20-18:00", "18:15-19:55"
];

const DAYS_ORDER = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// ==========================================
// 2. ЛАКАЛІЗАЦЫЯ
// ==========================================
const translations = {
    ru: {
        title: "Расписание БГАС",
        lblCourse: "Курс:",
        selectLabel: "Группа:",
        selectDefault: "-- Выберите --",
        placeholder: "Выберите курс и группу.",
        loading: "Загрузка...",
        errorLoad: "Ошибка загрузки",
        modalTitle: "Вход модератора",
        modalDesc: "Token GitHub",
        btnLogin: "Войти",
        logoutTitle: "Админка",
        logoutDesc: "Выйти?",
        btnLogout: "Выйти",
        themeLight: "☀️ Светлая",
        themeDark: "🌙 Тёмная",
        successAccess: "Доступ разрешен!",
        errorAccess: "Неверный токен.",
        successSave: "✅ Сохранено на GitHub!",
        errorSave: "❌ Ошибка: ",
        confirmDelete: "Удалить?",
        btnSaveGlobal: "☁️ Сохранить на GitHub",
        saving: "⏳ Сохранение...",
        btnAdd: "➕ Добавить",
        btnEdit: "✎",
        btnDelete: "✖",
        btnOk: "OK",
        btnCancel: "Отмена",
        lblWeeks: "Недели",
        lblSubj: "Предмет",
        lblTeach: "Препод.",
        lblRoom: "Ауд.",
        subgroupAll: "Все",
        days: { "Понедельник": "Понедельник", "Вторник": "Вторник", "Среда": "Среда", "Четверг": "Четверг", "Пятница": "Пятница", "Суббота": "Суббота" },
        offlineMode: "⚠️ ОФФЛАЙН",
        lblSgShort: "П/г ",
        weekInfo: "Неделя: "
    },
    be: {
        title: "Расклад БДАС",
        lblCourse: "Курс:",
        selectLabel: "Група:",
        selectDefault: "-- Абярыце --",
        placeholder: "Абярыце курс і групу.",
        loading: "Загрузка...",
        errorLoad: "Памылка загрузкі",
        modalTitle: "Уваход мадэратара",
        modalDesc: "Token GitHub",
        btnLogin: "Увайсці",
        logoutTitle: "Адмінка",
        logoutDesc: "Выйсці?",
        btnLogout: "Выйсці",
        themeLight: "☀️ Светлая",
        themeDark: "🌙 Цёмная",
        successAccess: "Доступ дазволены!",
        errorAccess: "Няправільны токен.",
        successSave: "✅ Захавана на GitHub!",
        errorSave: "❌ Памылка: ",
        confirmDelete: "Выдаліць?",
        btnSaveGlobal: "☁️ Захаваць на GitHub",
        saving: "⏳ Захаванне...",
        btnAdd: "➕ Дадаць",
        btnEdit: "✎",
        btnDelete: "✖",
        btnOk: "OK",
        btnCancel: "Скасаваць",
        lblWeeks: "Тыдні",
        lblSubj: "Прадмет",
        lblTeach: "Выкладчык",
        lblRoom: "Аўд.",
        subgroupAll: "Усе",
        days: { "Понедельник": "Панядзелак", "Вторник": "Аўторак", "Среда": "Серада", "Четверг": "Чацвер", "Пятница": "Пятніца", "Суббота": "Субота" },
        offlineMode: "⚠️ АФЛАЙН",
        lblSgShort: "П/г ",
        weekInfo: "Тыдзень: "
    }
};

// ==========================================
// 3. СТАН (STATE)
// ==========================================
let state = {
    lang: 'ru',
    theme: 'light',
    course: '1',
    group: '',
    subgroup: '0', 
    isAdmin: false,
    token: ''
};

let scheduleData = {};
let currentAcademicWeek = 1;

// ==========================================
// 4. ІНІЦЫЯЛІЗАЦЫЯ
// ==========================================
async function initApp() {
    calculateCurrentWeek();
    loadSettings();
    updateGroupList(); 
    checkAdminAuth();
    
    applyTheme();
    applyLang();

    checkNotificationStatus();

    await loadScheduleData();
    
    // Фонавая праверка абнаўленняў JSON
    setTimeout(checkForUpdatesBackground, 5000);
}

window.addEventListener('DOMContentLoaded', initApp);

// ==========================================
// 5. FIREBASE INTEGRATION
// ==========================================
function initFirebase() {
    // Калі бібліятэка не загрузілася
    if (typeof firebase === 'undefined') return;

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        const messaging = firebase.messaging();

        // Спрабуем атрымаць токен (гэта момант ісціны для GApps)
        messaging.getToken()
            .then((currentToken) => {
                if (currentToken) {
                    console.log('🔥 Firebase Token:', currentToken);
                    // Калі мы тут - значыць GApps ёсць і працуюць!
                } else {
                    console.warn('No registration token available.');
                }
            })
            .catch((err) => {
                // Вось сюды трапіць LineageOS без GApps
                console.warn('⚠️ Push notifications failed (No GApps?):', err);
                console.log('✅ Пераход на лакальны рэжым праверкі (polling).');
            });

        // Апрацоўка паведамленняў (калі сайт адкрыты)
        messaging.onMessage((payload) => {
            console.log('Message received: ', payload);
            const title = payload.notification.title;
            const options = {
                body: payload.notification.body,
                icon: 'logo.png'
            };
            new Notification(title, options);
        });

    } catch (e) {
        console.error("Firebase init error (Critical):", e);
    }
}

// ==========================================
// 6. ЛОГІКА ТЫДНЯЎ І КОЛЕРАЎ
// ==========================================
function calculateCurrentWeek() {
    const now = new Date();
    let startYear = now.getFullYear();
    if (now.getMonth() < 8) startYear -= 1; 
    
    const startDate = new Date(startYear, 8, 1);
    const diff = now - startDate;
    
    if (diff < 0) {
        currentAcademicWeek = 1;
    } else {
        const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
        const weekIndex = Math.floor(diff / oneWeekMs);
        currentAcademicWeek = (weekIndex % 4) + 1;
    }
    updateWeekDisplay();
}

function updateWeekDisplay() {
    // Калі няма элемента ў HTML, ствараем яго
    let displayEl = document.getElementById('currentWeekDisplay');
    if (!displayEl) {
        const header = document.querySelector('header');
        if(header) {
            const div = document.createElement('div');
            div.id = 'currentWeekDisplay';
            div.className = 'week-info'; // стыль ёсць у index.html
            header.appendChild(div);
            displayEl = div;
        }
    }
    
    if(displayEl) {
        const text = translations[state.lang].weekInfo;
        displayEl.innerHTML = `${text} <b>${currentAcademicWeek}</b>`;
    }
}

function checkWeekMatch(weeksStr) {
    if (!weeksStr) return true; 
    const weeks = String(weeksStr).split(',').map(s => s.trim());
    return weeks.includes(String(currentAcademicWeek));
}

function getLessonType(subject) {
    if (!subject) return "";
    const s = subject.toLowerCase();
    if (s.includes("(лк)") || s.includes("лекция")) return "type-lk"; // Жоўты
    if (s.includes("(пз)") || s.includes("практи")) return "type-pz"; // Зялёны
    if (s.includes("(лр)") || s.includes("лабора")) return "type-lr"; // Сіні
    if (s.includes("экзамен") || s.includes("зачет")) return "type-ex"; // Чырвоны
    return "";
}

// ==========================================
// 7. UI & SETTINGS
// ==========================================
function loadSettings() {
    const cached = localStorage.getItem('bsac_settings');
    if (cached) {
        try {
            const p = JSON.parse(cached);
            state.lang = p.lang || 'ru';
            state.theme = p.theme || 'light';
            state.course = p.course || '1';
            state.group = p.group || '';
            state.subgroup = p.subgroup || '0';
        } catch (e) {}
    }
    const cSel = document.getElementById('courseSelect');
    const sSel = document.getElementById('subgroupSelect');
    if(cSel) cSel.value = state.course;
    if(sSel) sSel.value = state.subgroup;
}

function saveSettings() {
    localStorage.setItem('bsac_settings', JSON.stringify({
        lang: state.lang, theme: state.theme, course: state.course,
        group: state.group, subgroup: state.subgroup
    }));
}

function t(key) { return translations[state.lang][key] || key; }

// Listeners
document.getElementById('themeBtn')?.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(); saveSettings();
});

document.getElementById('langBtn')?.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'be' : 'ru';
    applyLang(); updateGroupList(); updateWeekDisplay();
    if(state.group) renderSchedule(state.group);
    saveSettings();
});

document.getElementById('courseSelect')?.addEventListener('change', (e) => {
    state.course = e.target.value;
    updateGroupList();
    state.group = ""; 
    document.getElementById('groupSelect').value = "";
    renderSchedule(""); 
    saveSettings();
});

document.getElementById('groupSelect')?.addEventListener('change', (e) => {
    state.group = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

document.getElementById('subgroupSelect')?.addEventListener('change', (e) => {
    state.subgroup = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

function updateGroupList() {
    const groupSelect = document.getElementById('groupSelect');
    if(!groupSelect) return;
    groupSelect.innerHTML = `<option value="" disabled selected>${t('selectDefault')}</option>`;
    
    const groups = GROUPS_BY_COURSE[state.course] || [];
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.textContent = g;
        groupSelect.appendChild(opt);
    });

    if (groups.includes(state.group)) {
        groupSelect.value = state.group;
    }
}

function applyTheme() {
    document.body.className = state.theme === 'dark' ? 'dark-theme' : '';
    const btn = document.getElementById('themeBtn');
    if(btn) btn.textContent = t(state.theme === 'light' ? 'themeLight' : 'themeDark');
}

function applyLang() {
    const btn = document.getElementById('langBtn');
    if(btn) btn.textContent = state.lang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.title = t('title');
}

// ==========================================
// 8. DATA LOADING
// ==========================================
async function loadScheduleData() {
    const badge = document.getElementById('offlineBadge');
    try {
        const res = await fetch(`${RAW_URL}?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error("Net err");
        scheduleData = await res.json();
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        if(badge) badge.classList.add('hidden');
    } catch (e) {
        console.warn("Offline:", e);
        const cached = localStorage.getItem('bsac_cached_schedule');
        if (cached) {
            scheduleData = JSON.parse(cached);
            if(badge) {
                badge.classList.remove('hidden');
                badge.textContent = t('offlineMode'); 
            }
        } else {
            document.getElementById('uiPlaceholder').textContent = t('errorLoad');
        }
    }
    if (state.group) renderSchedule(state.group);
}

async function checkForUpdatesBackground() {
    try {
        const res = await fetch(API_URL_INFO);
        if(!res.ok) return;
        const data = await res.json();
        const remoteSha = data.sha;
        const localSha = localStorage.getItem('bsac_schedule_sha');

        if (localSha && remoteSha !== localSha) {
            localStorage.setItem('bsac_schedule_sha', remoteSha);
            // Аўтаматычнае абнаўленне
            await loadScheduleData();
        } else if (!localSha) {
            localStorage.setItem('bsac_schedule_sha', remoteSha);
        }
    } catch(e){}
}

// ==========================================
// 9. РЭНДЭРЫНГ РАСКЛАДУ
// ==========================================
function renderSchedule(group) {
    const container = document.getElementById('scheduleContainer');
    const offlineNode = document.getElementById('offlineBadge');
    
    container.innerHTML = '';
    
    if(offlineNode && !offlineNode.classList.contains('hidden')) {
        container.appendChild(offlineNode);
    }
    
    if (!group) {
        const ph = document.createElement('div');
        ph.className = 'placeholder';
        ph.textContent = t('placeholder');
        container.appendChild(ph);
        return;
    }

    const data = scheduleData[group] || {}; 

    if (state.isAdmin) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'global-save-btn';
        saveBtn.textContent = t('btnSaveGlobal');
        saveBtn.onclick = saveToGithub;
        container.appendChild(saveBtn);
    }

    DAYS_ORDER.forEach(dayKey => {
        const dayLessons = data[dayKey] || [];
        const dayBlock = document.createElement('div');
        dayBlock.className = 'schedule-day';

        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.textContent = t('days')[dayKey] || dayKey;
        dayBlock.appendChild(dayTitle);

        const table = document.createElement('table');
        let visibleRowsCount = 0;

        TIME_SLOTS.forEach((timeSlot) => {
            const row = document.createElement('tr');
            
            const timeCol = document.createElement('td');
            timeCol.className = 'time-col';
            timeCol.textContent = timeSlot;
            row.appendChild(timeCol);

            const infoCol = document.createElement('td');
            
            // Фільтрацыя пар на гэты час
            const slotLessons = dayLessons.map((l, index) => ({...l, realIndex: index}))
                                          .filter(l => l.time === timeSlot);

            const userSg = parseInt(state.subgroup) || 0;
            let hasContent = false;

            // Размяркоўваем пары па падгрупах [0, 1, 2]
            const subgroupsMap = { 0: [], 1: [], 2: [] };
            slotLessons.forEach(l => {
                const sg = parseInt(l.num_subgroup) || 0;
                if (subgroupsMap[sg]) subgroupsMap[sg].push(l);
            });

            const showSg1 = (userSg === 0 || userSg === 1);
            const showSg2 = (userSg === 0 || userSg === 2);

            // ФУНКЦЫЯ АДЛЮСТРАВАННЯ КАЛОНКІ
            const renderSubgroupColumn = (sgId) => {
                const lessons = subgroupsMap[sgId];
                const usedWeeks = new Set();
                
                lessons.forEach(lesson => {
                    const div = document.createElement('div');
                    div.className = 'week-split';
                    
                    const typeClass = getLessonType(lesson.subject);
                    if (typeClass) div.classList.add(typeClass);

                    // Калі тып не вызначаны, фарбуем па падгрупе
                    if (!typeClass) {
                        if (lesson.num_subgroup === 1) div.style.borderLeft = "5px solid #e67e22";
                        else if (lesson.num_subgroup === 2) div.style.borderLeft = "5px solid #9b59b6";
                        else div.style.borderLeft = "5px solid transparent";
                    }

                    const isCurrentWeek = checkWeekMatch(lesson.weeks);
                    if (!isCurrentWeek) {
                        div.style.opacity = "0.5";
                        div.style.filter = "grayscale(0.8)";
                    } else {
                        // Калі тып ёсць, колер даецца CSS класам. Калі не - даем дэфолтны.
                        if (!typeClass) div.style.backgroundColor = (state.theme === 'dark') ? 'rgba(39, 174, 96, 0.15)' : 'rgba(39, 174, 96, 0.08)';
                    }
                    div.style.paddingLeft = "8px";

                    // Генерацыя кантэнту
                    if (lesson.multi) {
                         lesson.content.forEach((sub, subIdx) => {
                             const subDiv = document.createElement('div');
                             subDiv.innerHTML = generateLessonHTML({...sub, num_subgroup: lesson.num_subgroup});
                             if(state.isAdmin) subDiv.appendChild(createAdminControls(group, dayKey, lesson.realIndex, subIdx));
                             div.appendChild(subDiv);
                        });
                    } else {
                        div.innerHTML = generateLessonHTML(lesson);
                        if(state.isAdmin) div.appendChild(createAdminControls(group, dayKey, lesson.realIndex, null));
                    }
                    
                    infoCol.appendChild(div);
                    hasContent = true;

                    // Адзначаем занятыя тыдні
                    if (!lesson.weeks) {
                        [1,2,3,4].forEach(w => usedWeeks.add(w));
                    } else {
                        String(lesson.weeks).split(',').forEach(w => usedWeeks.add(parseInt(w.trim())));
                    }
                });

                // "РАЗУМНАЯ" КНОПКА ДАДАННЯ (ADMIN)
                // Калі ёсць пары, але засталіся свабодныя тыдні (напрыклад, ёсць 1,3, а няма 2,4)
                if (state.isAdmin && lessons.length > 0) {
                    if (usedWeeks.size < 4) {
                        const missingWeeks = [1, 2, 3, 4].filter(x => !usedWeeks.has(x));
                        const weeksStr = missingWeeks.join(',');
                        renderSpecificAddButton(infoCol, group, dayKey, timeSlot, sgId, weeksStr);
                        hasContent = true;
                    }
                }
            };

            // Логіка паказу
            renderSubgroupColumn(0); // Агульныя
            
            // Калі няма агульных, правяраем падгрупы
            if (subgroupsMap[0].length === 0) {
                if (showSg1) renderSubgroupColumn(1);
                if (showSg2) renderSubgroupColumn(2);
            }

            // Калі зусім пуста (паказваем кнопку для Адміна)
            if (state.isAdmin) {
                // Выпадак 1: Зусім пуста
                if (!hasContent) {
                    renderSpecificAddButton(infoCol, group, dayKey, timeSlot, 0, "");
                    hasContent = true;
                } 
                // Выпадак 2: Ёсць 1-я, няма 2-й (і наадварот) - даем магчымасць дадаць другую
                else if (subgroupsMap[0].length === 0) {
                    if (subgroupsMap[1].length > 0 && subgroupsMap[2].length === 0 && showSg2) {
                        renderSpecificAddButton(infoCol, group, dayKey, timeSlot, 2, "");
                    }
                    if (subgroupsMap[2].length > 0 && subgroupsMap[1].length === 0 && showSg1) {
                        renderSpecificAddButton(infoCol, group, dayKey, timeSlot, 1, "");
                    }
                }
            }

            if (hasContent) {
                row.appendChild(infoCol);
                table.appendChild(row);
                visibleRowsCount++;
            }
        });

        if (visibleRowsCount === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 2;
            emptyCell.className = 'empty-day-cell'; // Стыль у CSS
            emptyCell.style.textAlign = "center";
            emptyCell.style.padding = "20px";
            emptyCell.style.color = "var(--text-secondary)";
            emptyCell.textContent = state.lang === 'be' ? "🏖️ Выхадны" : "🏖️ Выходной";
            emptyRow.appendChild(emptyCell);
            table.appendChild(emptyRow);
        }

        dayBlock.appendChild(table);
        container.appendChild(dayBlock);
    });
}

function generateLessonHTML(item) {
    let weekText = '';
    if (item.weeks) {
        const w = item.weeks;
        const isActive = checkWeekMatch(w);
        const style = isActive ? 'background-color:var(--accent-warn);color:#000;' : 'background-color:var(--border-color);color:var(--text-secondary);';
        weekText = `<span class="week-badge" style="${style}">${t('lblWeeks')} ${w}</span>`;
    }
    
    let sgText = '';
    const sg = parseInt(item.num_subgroup) || 0;
    if (sg > 0) {
        sgText = `<span class="subgroup-badge sg-${sg}">${t('lblSgShort')}${sg}</span>`;
    }

    return `
        <div style="margin-bottom:4px;">${sgText}${weekText}</div>
        <span class="subject">${item.subject}</span>
        <div class="details">👤 ${item.teacher || '-'}</div>
        <div class="location">🚪 ${item.room || '-'}</div>
    `;
}

// ==========================================
// 10. АДМІНСКІЯ ФУНКЦЫІ
// ==========================================
function renderSpecificAddButton(container, group, dayKey, timeSlot, subgroup, defaultWeeks) {
    const div = document.createElement('div');
    div.className = 'week-split empty-slot';
    div.style.padding = "4px";
    div.style.marginTop = "4px";
    div.style.border = "1px dashed var(--border-color)";
    div.style.fontSize = "0.8rem";
    
    let sgLabel = subgroup === 0 ? "" : (subgroup === 1 ? "(1 п/г)" : "(2 п/г)");
    let weekLabel = defaultWeeks ? `[${defaultWeeks}]` : "";

    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.innerHTML = `${t('btnAdd')} <span style="opacity:0.8;font-size:0.8em">${sgLabel} ${weekLabel}</span>`;
    
    btn.onclick = () => {
        const newLesson = {
            time: timeSlot,
            subject: "Новый предмет",
            teacher: "",
            room: "",
            weeks: defaultWeeks,
            num_subgroup: subgroup
        };
        
        if (!scheduleData[group]) scheduleData[group] = {};
        if (!scheduleData[group][dayKey]) scheduleData[group][dayKey] = [];
        
        scheduleData[group][dayKey].push(newLesson);
        renderSchedule(group);
    };
    
    div.appendChild(btn);
    container.appendChild(div);
}

function createAdminControls(group, dayKey, index, subIndex) {
    const div = document.createElement('div');
    div.className = 'admin-controls';
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = t('btnEdit');
    btnEdit.onclick = (e) => { e.stopPropagation(); editLesson(group, dayKey, index, subIndex); };
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn-delete';
    btnDel.textContent = t('btnDelete');
    btnDel.onclick = (e) => { e.stopPropagation(); deleteLesson(group, dayKey, index, subIndex); };
    
    div.appendChild(btnEdit);
    div.appendChild(btnDel);
    return div;
}

function deleteLesson(group, dayKey, index, subIndex) {
    if (!confirm(t('confirmDelete'))) return;
    if (subIndex !== null) {
        const parent = scheduleData[group][dayKey][index];
        parent.content.splice(subIndex, 1);
        if (parent.content.length === 0) scheduleData[group][dayKey].splice(index, 1);
    } else {
        scheduleData[group][dayKey].splice(index, 1);
    }
    renderSchedule(group);
}

function editLesson(group, dayKey, index, subIndex) {
    const btn = window.event.target; 
    const container = btn.closest('.week-split');
    
    let targetLesson;
    if (subIndex !== null) {
        targetLesson = scheduleData[group][dayKey][index].content[subIndex];
    } else {
        targetLesson = scheduleData[group][dayKey][index];
    }
    
    const currentSg = targetLesson.num_subgroup || 0;

    container.innerHTML = `
        <div style="background:var(--bg-card); border:2px solid var(--accent-primary); padding:10px; border-radius:8px; z-index:100; position:relative;">
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <div style="flex:1;">
                    <label style="font-size:0.7em;">${t('lblWeeks')}</label>
                    <input class="edit-input inp-weeks" value="${targetLesson.weeks || ''}" placeholder="1,3">
                </div>
                <div style="width:70px;">
                    <label style="font-size:0.7em;">${t('lblSubgroup')}</label>
                    <select class="edit-input inp-sg">
                        <option value="0" ${currentSg==0?'selected':''}>All</option>
                        <option value="1" ${currentSg==1?'selected':''}>1</option>
                        <option value="2" ${currentSg==2?'selected':''}>2</option>
                    </select>
                </div>
            </div>
            
            <label style="font-size:0.7em;">${t('lblSubj')}</label>
            <input class="edit-input inp-subj" value="${targetLesson.subject || ''}">
            
            <div style="display:flex; gap:5px;">
                <div style="flex:1;">
                    <label style="font-size:0.7em;">${t('lblTeach')}</label>
                    <input class="edit-input inp-teach" value="${targetLesson.teacher || ''}">
                </div>
                <div style="width:80px;">
                    <label style="font-size:0.7em;">${t('lblRoom')}</label>
                    <input class="edit-input inp-room" value="${targetLesson.room || ''}">
                </div>
            </div>

            <div class="admin-controls" style="margin-top:10px; justify-content: space-between;">
                <button class="btn-cancel" style="font-size:0.8rem;">${t('btnCancel')}</button>
                <button class="btn-save" style="font-size:0.8rem;">${t('btnOk')}</button>
            </div>
        </div>
    `;
    
    const btnSave = container.querySelector('.btn-save');
    const btnCancel = container.querySelector('.btn-cancel');
    
    btnSave.onclick = (e) => {
        e.stopPropagation();
        targetLesson.weeks = container.querySelector('.inp-weeks').value;
        targetLesson.subject = container.querySelector('.inp-subj').value;
        targetLesson.teacher = container.querySelector('.inp-teach').value;
        targetLesson.room = container.querySelector('.inp-room').value;
        targetLesson.num_subgroup = parseInt(container.querySelector('.inp-sg').value) || 0;
        renderSchedule(state.group); 
    };
    
    btnCancel.onclick = (e) => {
        e.stopPropagation();
        renderSchedule(state.group); 
    };
}

async function saveToGithub() {
    if (!state.token) return alert(t('errorAccess'));
    const btn = document.querySelector('.global-save-btn');
    if(btn) btn.textContent = t('saving');

    try {
        const getRes = await fetch(API_URL_INFO, { headers: { "Authorization": `token ${state.token}` }});
        if (!getRes.ok) throw new Error("API Error");
        const fileData = await getRes.json();
        const fileSha = fileData.sha;

        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(scheduleData, null, 2))));

        const putRes = await fetch(API_URL_INFO, {
            method: "PUT",
            headers: { "Authorization": `token ${state.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Update schedule from Admin UI",
                content: contentBase64,
                sha: fileSha
            })
        });
        
        if (!putRes.ok) throw new Error("Put Error");
        
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        alert(t('successSave'));
    } catch (e) {
        alert(t('errorSave') + e.message);
    } finally {
        if(btn) btn.textContent = t('btnSaveGlobal');
    }
}

// ==========================================
// 11. АЎТАРЫЗАЦЫЯ
// ==========================================
async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function checkAdminAuth() {
    const savedToken = localStorage.getItem('bsac_gh_token');
    if (savedToken) {
        sha256(SALT + savedToken).then(hash => {
            if (hash === TARGET_HASH) {
                state.isAdmin = true;
                state.token = savedToken;
                document.getElementById('adminBadge')?.classList.remove('hidden');
            }
        });
    }
}

// Modal Logic
const loginModal = document.getElementById('adminModal');
const logoutModal = document.getElementById('logoutModal');
const logo = document.getElementById('secretLogo');
let clicks = 0, timer;

if (logo) logo.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => clicks=0, 700);
    if (clicks >= 10) {
        clicks = 0;
        if (state.isAdmin) logoutModal?.classList.remove('hidden');
        else loginModal?.classList.remove('hidden');
    }
});

const loginForm = document.getElementById('loginForm');
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('apiTokenInput').value.trim();
    const hash = await sha256(SALT + token);
    
    if (hash === TARGET_HASH) {
        state.isAdmin = true;
        state.token = token;
        localStorage.setItem('bsac_gh_token', token);
        document.getElementById('adminBadge')?.classList.remove('hidden');
        loginModal.classList.add('hidden');
        alert(t('successAccess'));
        renderSchedule(state.group);
    } else {
        alert(t('errorAccess'));
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('bsac_gh_token');
    state.isAdmin = false;
    state.token = '';
    document.getElementById('adminBadge')?.classList.add('hidden');
    logoutModal.classList.add('hidden');
    renderSchedule(state.group);
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function() { this.closest('.modal').classList.add('hidden'); }
});

// ==========================================
// ЛОГІКА КНОПКІ АПАВЯШЧЭННЯЎ
// ==========================================
const notifyBtn = document.getElementById('notifyBtn');

// Праверка пры запуску: ці ўключаны ўжо апавяшчэнні?
function checkNotificationStatus() {
    if (!('Notification' in window)) {
        notifyBtn.style.display = 'none'; // Хаваем кнопку, калі браўзер стары
        return;
    }
    if (Notification.permission === 'granted') {
        notifyBtn.textContent = '🔔';
        notifyBtn.classList.add('active');
        notifyBtn.title = "Апавяшчэнні ўключаны";
        // Спрабуем падключыць Firebase ціха
        initFirebase(); 
    }
}

// Націск на кнопку
if (notifyBtn) {
    notifyBtn.addEventListener('click', () => {
        if (Notification.permission === 'granted') {
            alert(state.lang === 'be' ? "Апавяшчэнні ўжо працуюць!" : "Уведомления уже включены!");
            return;
        }

        // Запытваем дазвол
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                notifyBtn.textContent = '🔔';
                notifyBtn.classList.add('active');
                initFirebase(); // Спрабуем ініцыялізаваць Push
            } else {
                alert(state.lang === 'be' ? "Вы забаранілі апавяшчэнні :(" : "Вы запретили уведомления :(");
            }
        });
    });
}