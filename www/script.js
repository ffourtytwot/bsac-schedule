// script.js

// ==========================================
// 1. КАНФІГУРАЦЫЯ І КАНСТАНТЫ
// ==========================================
const REPO_OWNER = "ffourtytwot";
const REPO_NAME = "bsac-schedule";
const FILE_PATH = "www/schedule.json";
const SALT = "bsac_super_salt_2025"; 
const TARGET_HASH = "38bff4d29d08888d2f3c8e0250551c3d7662bcc2cd1490048dc22a89502afc41"; 

// Спасылкі на GitHub
const API_URL_INFO = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
const RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;

// Спіс груп па курсах (Складзена паводле вашых скрыншотаў)
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
// 2. ЛАКАЛІЗАЦЫЯ (RU / BE)
// ==========================================
const translations = {
    ru: {
        title: "Расписание БГАС",
        lblCourse: "Курс:",
        selectLabel: "Группа:",
        selectDefault: "-- Выберите --",
        placeholder: "Выберите курс и группу для просмотра.",
        loading: "Загрузка данных...",
        errorLoad: "Ошибка загрузки schedule.json",
        modalTitle: "Вход модератора",
        modalDesc: "Введите GitHub Token",
        modalHint: "Токен сохранится локально.",
        btnLogin: "Войти",
        logoutTitle: "Режим модератора",
        logoutDesc: "Вы действительно хотите выйти?",
        btnLogout: "Выйти",
        themeLight: "☀️ Светлая",
        themeDark: "🌙 Тёмная",
        successAccess: "Доступ разрешен!",
        errorAccess: "Неверный токен.",
        successSave: "✅ Изменения успешно сохранены на GitHub!",
        errorSave: "❌ Ошибка сохранения: ",
        confirmDelete: "Удалить эту пару?",
        btnSaveGlobal: "☁️ Сохранить на GitHub",
        saving: "⏳ Сохранение...",
        emptySlot: "Нет занятий",
        btnAdd: "➕ Добавить",
        btnEdit: "✎",
        btnDelete: "✖",
        btnOk: "OK",
        btnCancel: "Отмена",
        lblWeeks: "Недели",
        lblSubj: "Предмет",
        lblTeach: "Препод.",
        lblRoom: "Ауд.",
        days: { 
            "Понедельник": "Понедельник", "Вторник": "Вторник", "Среда": "Среда", 
            "Четверг": "Четверг", "Пятница": "Пятница", "Суббота": "Суббота" 
        },
        lblSubgroup: "Подгруппа:",
        subgroupAll: "Все",
        offlineMode: "⚠️ ОФФЛАЙН РЕЖИМ",
        lblSgShort: "П/г ",
        weekInfo: "Текущая неделя: ",
        notificationTitle: "Расписание обновлено!", 
        notificationBody: "Нажмите, чтобы посмотреть изменения."
    },
    be: {
        title: "Расклад БДАС",
        lblCourse: "Курс:",
        selectLabel: "Група:",
        selectDefault: "-- Абярыце --",
        placeholder: "Абярыце курс і групу каб пабачыць расклад.",
        loading: "Загрузка дадзеных...",
        errorLoad: "Памылка загрузкі schedule.json",
        modalTitle: "Уваход мадэратара",
        modalDesc: "Увядзіце GitHub Token",
        modalHint: "Токен захаваецца лакальна.",
        btnLogin: "Увайсці",
        logoutTitle: "Рэжым мадэратара",
        logoutDesc: "Сапраўды выйсці?",
        btnLogout: "Выйсці",
        themeLight: "☀️ Светлая",
        themeDark: "🌙 Цёмная",
        successAccess: "Доступ дазволены!",
        errorAccess: "Няправільны токен.",
        successSave: "✅ Змены паспяхова захаваны на GitHub!",
        errorSave: "❌ Памылка захавання: ",
        confirmDelete: "Выдаліць гэтую пару?",
        btnSaveGlobal: "☁️ Захаваць на GitHub",
        saving: "⏳ Захаванне...",
        emptySlot: "Няма заняткаў",
        btnAdd: "➕ Дадаць",
        btnEdit: "✎",
        btnDelete: "✖",
        btnOk: "OK",
        btnCancel: "Скасаваць",
        lblWeeks: "Тыдні",
        lblSubj: "Прадмет",
        lblTeach: "Выкладчык",
        lblRoom: "Аўдыторыя",
        days: { 
            "Понедельник": "Панядзелак", "Вторник": "Аўторак", "Среда": "Серада", 
            "Четверг": "Чацвер", "Пятница": "Пятніца", "Суббота": "Субота" 
        },
        lblSubgroup: "Падгрупа:",
        subgroupAll: "Усе",
        offlineMode: "⚠️ АФЛАЙН РЭЖЫМ",
        lblSgShort: "П/г ",
        weekInfo: "Бягучы тыдзень: ",
        notificationTitle: "Расклад абноўлены!", 
        notificationBody: "Націсніце, каб паглядзець змены."
    }
};

// ==========================================
// 3. СТАН ПРАГРАМЫ (STATE)
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
    updateGroupList(); // Сфарміраваць спіс груп для абранага курсу
    checkAdminAuth();
    
    applyTheme();
    applyLang();

    // Загрузка
    await loadScheduleData();

    // Фонавая праверка абнаўленняў
    setTimeout(checkForUpdatesBackground, 3000);
}

// Запуск пры старце
window.addEventListener('DOMContentLoaded', initApp);


// ==========================================
// 5. ЛОГІКА ПАДЛІКУ ТЫДНЯ
// ==========================================
function calculateCurrentWeek() {
    const now = new Date();
    // Пачатак вучобы: 1 верасня. 
    // Калі зараз студзень-жнівень (месяцы 0-7), то навучальны год пачаўся ў мінулым годзе.
    let startYear = now.getFullYear();
    if (now.getMonth() < 8) startYear -= 1; 
    
    // Дата пачатку: 1 верасня startYear
    const startDate = new Date(startYear, 8, 1);
    
    // Калі да 1 верасня яшчэ далёка (напрыклад, канец жніўня)
    const diff = now - startDate;
    if (diff < 0) {
        currentAcademicWeek = 1;
    } else {
        const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
        const weekIndex = Math.floor(diff / oneWeekMs);
        // Цыкл: 1 -> 2 -> 3 -> 4 -> 1 ...
        currentAcademicWeek = (weekIndex % 4) + 1;
    }
    updateWeekDisplay();
}

function updateWeekDisplay() {
    const el = document.getElementById('currentWeekDisplay');
    if (el) {
        const text = translations[state.lang].weekInfo;
        el.innerHTML = `${text} <b>${currentAcademicWeek}</b>`;
    }
}


// ==========================================
// 6. КІРАВАННЕ НАЛАДАМІ І UI
// ==========================================
function loadSettings() {
    const cachedSettings = localStorage.getItem('bsac_settings');
    if (cachedSettings) {
        try {
            const parsed = JSON.parse(cachedSettings);
            state.lang = parsed.lang || 'ru';
            state.theme = parsed.theme || 'light';
            state.course = parsed.course || '1';
            state.group = parsed.group || '';
            state.subgroup = parsed.subgroup || '0';
        } catch (e) { console.error("Error parsing settings", e); }
    }
    
    // Усталёўка значэнняў у UI
    const courseSel = document.getElementById('courseSelect');
    const sgSel = document.getElementById('subgroupSelect');
    if(courseSel) courseSel.value = state.course;
    if(sgSel) sgSel.value = state.subgroup;
}

function saveSettings() {
    localStorage.setItem('bsac_settings', JSON.stringify({
        lang: state.lang,
        theme: state.theme,
        course: state.course,
        group: state.group,
        subgroup: state.subgroup
    }));
}

function t(key) {
    return translations[state.lang][key] || key;
}

// Слухачы падзей (Event Listeners)
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
const courseSelect = document.getElementById('courseSelect');
const groupSelect = document.getElementById('groupSelect');
const subgroupSelect = document.getElementById('subgroupSelect');

if(themeBtn) themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings();
});

if(langBtn) langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'be' : 'ru';
    applyLang();
    updateGroupList(); // Каб перакласці "Select Default"
    updateWeekDisplay();
    if(state.group) renderSchedule(state.group);
    saveSettings();
});

if(courseSelect) courseSelect.addEventListener('change', (e) => {
    state.course = e.target.value;
    updateGroupList();
    // Пры змене курсу скідваем групу або спрабуем пакінуць пустую
    state.group = ""; 
    groupSelect.value = "";
    renderSchedule(""); 
    saveSettings();
});

if(groupSelect) groupSelect.addEventListener('change', (e) => {
    state.group = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

if(subgroupSelect) subgroupSelect.addEventListener('change', (e) => {
    state.subgroup = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

function updateGroupList() {
    if(!groupSelect) return;
    groupSelect.innerHTML = `<option value="" disabled selected>${t('selectDefault')}</option>`;
    
    const groups = GROUPS_BY_COURSE[state.course] || [];
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        groupSelect.appendChild(opt);
    });

    // Калі захаваная група ёсць у гэтым курсе, вяртаем яе
    if (groups.includes(state.group)) {
        groupSelect.value = state.group;
    }
}

function applyTheme() {
    document.body.className = state.theme === 'dark' ? 'dark-theme' : '';
    if(themeBtn) themeBtn.textContent = t(state.theme === 'light' ? 'themeLight' : 'themeDark');
}

function applyLang() {
    if(langBtn) langBtn.textContent = state.lang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    // Асобна загаловак
    document.title = t('title');
}


// ==========================================
// 7. ЗАГРУЗКА ДАДЗЕНЫХ
// ==========================================
async function loadScheduleData() {
    const offlineBadge = document.getElementById('offlineBadge');
    
    try {
        // Спампоўваем JSON (з timestamp для абыходу кэша)
        const response = await fetch(`${RAW_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const newData = await response.json();
        scheduleData = newData;

        // Кэшуем
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        
        if(offlineBadge) offlineBadge.classList.add('hidden');

    } catch (e) {
        console.warn("Offline mode active:", e);
        const cached = localStorage.getItem('bsac_cached_schedule');
        if (cached) {
            scheduleData = JSON.parse(cached);
            if(offlineBadge) {
                offlineBadge.classList.remove('hidden');
                offlineBadge.textContent = t('offlineMode'); 
            }
        } else {
            document.getElementById('uiPlaceholder').textContent = t('errorLoad');
        }
    }

    if (state.group) renderSchedule(state.group);
}

// Праверка версіі файла на GitHub (SHA)
async function checkForUpdatesBackground() {
    try {
        const response = await fetch(API_URL_INFO);
        if (!response.ok) return;
        
        const data = await response.json();
        const remoteSha = data.sha;
        const localSha = localStorage.getItem('bsac_schedule_sha');

        if (localSha && remoteSha !== localSha) {
            console.log("New version detected!");
            localStorage.setItem('bsac_schedule_sha', remoteSha);
            await sendLocalNotification();
            await loadScheduleData();
        } else if (!localSha) {
            localStorage.setItem('bsac_schedule_sha', remoteSha);
        }
    } catch (e) { /* ignore offline errors */ }
}

async function sendLocalNotification() {
    // Для Capacitor (мабільны дадатак)
    // @ts-ignore
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
        try {
            const { LocalNotifications } = Capacitor.Plugins;
            await LocalNotifications.requestPermissions();
            await LocalNotifications.schedule({
                notifications: [{
                    title: t('notificationTitle'),
                    body: t('notificationBody'),
                    id: 1,
                    schedule: { at: new Date(Date.now() + 1000) }
                }]
            });
        } catch (e) {}
    }
}


// ==========================================
// 8. РЭНДЭРЫНГ РАСКЛАДУ (АСНОЎНАЯ ЛОГІКА)
// ==========================================
function renderSchedule(group) {
    const container = document.getElementById('scheduleContainer');
    const offlineNode = document.getElementById('offlineBadge');
    
    container.innerHTML = '';
    
    // Калі афлайн, пакідаем бэйдж
    if(offlineNode && !offlineNode.classList.contains('hidden')) {
        container.appendChild(offlineNode);
    }
    
    if (!group) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = t('placeholder');
        container.appendChild(placeholder);
        return;
    }

    const data = scheduleData[group] || {}; 

    // Кнопка Global Save (толькі для Адміна)
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
            
            // Атрымліваем урокі на гэты час
            const slotLessons = dayLessons.map((l, index) => ({...l, realIndex: index}))
                                          .filter(l => l.time === timeSlot);

            const currentSg = parseInt(state.subgroup) || 0; // 0 = Усе
            
            // Фільтрацыя і адлюстраванне
            let hasContent = false;
            let displayedLessons = [];

            // Калі ёсць агульная пара (num_subgroup == 0)
            const commonLesson = slotLessons.find(l => (parseInt(l.num_subgroup) || 0) === 0);
            
            if (commonLesson) {
                displayedLessons.push(commonLesson);
            } else {
                // Калі пары па падгрупах
                const sg1Lessons = slotLessons.filter(l => parseInt(l.num_subgroup) === 1);
                const sg2Lessons = slotLessons.filter(l => parseInt(l.num_subgroup) === 2);

                const showSg1 = (currentSg === 0 || currentSg === 1);
                const showSg2 = (currentSg === 0 || currentSg === 2);

                if (showSg1) displayedLessons = displayedLessons.concat(sg1Lessons);
                if (showSg2) displayedLessons = displayedLessons.concat(sg2Lessons);
            }

            // РЭНДЭРЫНГ УРОКАЎ У ЯЧЭЙЦЫ
            if (displayedLessons.length > 0) {
                displayedLessons.forEach(lesson => {
                    const div = document.createElement('div');
                    div.className = 'week-split';
                    
                    // Стылізацыя мяжы злева
                    if (lesson.num_subgroup === 1) div.style.borderLeft = "4px solid #e67e22";
                    else if (lesson.num_subgroup === 2) div.style.borderLeft = "4px solid #9b59b6";
                    else div.style.borderLeft = "4px solid transparent"; // Агульная
                    
                    div.style.paddingLeft = "8px";

                    // ЛОГІКА ПАДСВЕТКІ ТЫДНЯ
                    const isCurrentWeek = checkWeekMatch(lesson.weeks);
                    if (isCurrentWeek) {
                        // Актыўная пара
                        div.style.backgroundColor = (state.theme === 'dark') ? 'rgba(39, 174, 96, 0.15)' : 'rgba(39, 174, 96, 0.08)';
                        if (lesson.num_subgroup === 0) div.style.borderLeft = "4px solid var(--accent-success)";
                    } else {
                        // Пара не на гэтым тыдні -> робім напаўпразрыстай
                        div.style.opacity = "0.5";
                        div.style.filter = "grayscale(0.8)";
                    }

                    // Генерацыя HTML
                    if (lesson.multi) {
                        // Складаны выпадак (multi), рэдка выкарыстоўваецца, але падтрымаем
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
                });
            }

            // КНОПКА "ДАДАЦЬ" (ADMIN)
            if (state.isAdmin) {
                // Паказваем кнопку, калі пуста, або калі выбрана падгрупа, а ў ёй няма пар
                let showAdd = false;
                if (!commonLesson) {
                    const countSg1 = slotLessons.filter(l => l.num_subgroup==1).length;
                    const countSg2 = slotLessons.filter(l => l.num_subgroup==2).length;
                    
                    if (currentSg === 0 && (countSg1 === 0 || countSg2 === 0)) showAdd = true;
                    if (currentSg === 1 && countSg1 === 0) showAdd = true;
                    if (currentSg === 2 && countSg2 === 0) showAdd = true;
                }
                
                if (showAdd) {
                    renderGenericAddButton(infoCol, group, dayKey, timeSlot);
                    hasContent = true;
                }
            }

            if (hasContent) {
                row.appendChild(infoCol);
                table.appendChild(row);
                visibleRowsCount++;
            }
        });

        // Калі дзень пусты
        if (visibleRowsCount === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 2;
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

// Праверка тыдня (вяртае true, калі пара ідзе зараз)
function checkWeekMatch(weeksStr) {
    if (!weeksStr) return true; // Калі тыдні не пазначаны, значыць кожны тыдзень
    const weeks = String(weeksStr).split(',').map(s => s.trim());
    return weeks.includes(String(currentAcademicWeek));
}

function generateLessonHTML(item) {
    let weekText = '';
    if (item.weeks) {
        const w = item.weeks;
        // Падсвятляем бэйдж тыдня, калі супадае
        const isActive = checkWeekMatch(w);
        const style = isActive ? 'background-color:var(--accent-warn);color:#000;' : 'background-color:var(--border-color);color:var(--text-secondary);';
        
        weekText = `<span class="week-badge" style="${style}">${t('lblWeeks')} ${w}</span>`;
    }
    
    let sgText = '';
    const sg = parseInt(item.num_subgroup) || 0;
    if (sg > 0) {
        // sg-1 (orange), sg-2 (purple) класы ў style.css
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
// 9. АДМІНІСТРАВАННЕ (ДАДАЦЬ / РЭДАГАВАЦЬ / ВЫДАЛІЦЬ)
// ==========================================
function renderGenericAddButton(container, group, dayKey, timeSlot) {
    const div = document.createElement('div');
    div.className = 'week-split empty-slot';
    div.style.padding = "5px";
    div.style.border = "1px dashed var(--border-color)";
    
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.textContent = t('btnAdd'); 
    btn.onclick = () => addNewLessonSmart(group, dayKey, timeSlot);
    
    div.appendChild(btn);
    container.appendChild(div);
}

function addNewLessonSmart(group, dayKey, timeSlot) {
    if (!scheduleData[group]) scheduleData[group] = {};
    if (!scheduleData[group][dayKey]) scheduleData[group][dayKey] = [];

    // Аўта-выбар падгрупы
    const existing = scheduleData[group][dayKey].filter(l => l.time === timeSlot);
    let targetSg = 0;
    
    if (existing.some(l => parseInt(l.num_subgroup) === 1)) targetSg = 2;
    else if (existing.some(l => parseInt(l.num_subgroup) === 2)) targetSg = 1;
    else if (parseInt(state.subgroup) !== 0) targetSg = parseInt(state.subgroup);

    const newLesson = {
        time: timeSlot,
        subject: "Новый предмет",
        teacher: "",
        room: "",
        weeks: "",
        num_subgroup: targetSg
    };
    
    scheduleData[group][dayKey].push(newLesson);
    renderSchedule(group);
}

function createAdminControls(group, dayKey, index, subIndex) {
    const div = document.createElement('div');
    div.className = 'admin-controls';
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = t('btnEdit');
    btnEdit.onclick = () => editLesson(group, dayKey, index, subIndex);
    
    const btnDel = document.createElement('button');
    btnDel.className = 'btn-delete';
    btnDel.textContent = t('btnDelete');
    btnDel.onclick = () => deleteLesson(group, dayKey, index, subIndex);
    
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

    // Форма рэдагавання прама ў картцы
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

// Захаванне на GitHub
async function saveToGithub() {
    if (!state.token) return alert(t('errorAccess'));
    const btn = document.querySelector('.global-save-btn');
    if(btn) btn.textContent = t('saving');

    try {
        // 1. Атрымаць SHA
        const getRes = await fetch(API_URL_INFO, { headers: { "Authorization": `token ${state.token}` }});
        if (!getRes.ok) throw new Error("API Error: Cannot get file SHA");
        const fileData = await getRes.json();
        const fileSha = fileData.sha;

        // 2. Пераўтварыць JSON у Base64 (для кірыліцы патрэбны unescape(encodeURIComponent))
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(scheduleData, null, 2))));

        // 3. Адправіць PUT
        const putRes = await fetch(API_URL_INFO, {
            method: "PUT",
            headers: { "Authorization": `token ${state.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Update schedule from Admin UI",
                content: contentBase64,
                sha: fileSha
            })
        });
        
        if (!putRes.ok) throw new Error("Put Error: Cannot save file");
        
        // Абнавіць лакальны кэш
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        alert(t('successSave'));
    } catch (e) {
        alert(t('errorSave') + e.message);
    } finally {
        if(btn) btn.textContent = t('btnSaveGlobal');
    }
}


// ==========================================
// 10. АЎТАРЫЗАЦЫЯ (CRYPTO)
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
                const badge = document.getElementById('adminBadge');
                if(badge) badge.classList.remove('hidden');
            }
        });
    }
}

// UI для ўваходу (Modal)
const loginModal = document.getElementById('adminModal');
const logoutModal = document.getElementById('logoutModal');
const logo = document.getElementById('secretLogo');
let clicks = 0, timer;

if (logo) logo.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => clicks=0, 700);
    // 10 хуткіх клікаў па лагатыпе
    if (clicks >= 10) {
        clicks = 0;
        if (state.isAdmin) {
            if(logoutModal) logoutModal.classList.remove('hidden');
        } else {
            if(loginModal) loginModal.classList.remove('hidden');
        }
    }
});

const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('apiTokenInput');
    const token = input ? input.value.trim() : "";
    const hash = await sha256(SALT + token);
    
    if (hash === TARGET_HASH) {
        state.isAdmin = true;
        state.token = token;
        localStorage.setItem('bsac_gh_token', token);
        
        document.getElementById('adminBadge').classList.remove('hidden');
        loginModal.classList.add('hidden');
        alert(t('successAccess'));
        renderSchedule(state.group);
    } else {
        alert(t('errorAccess'));
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('bsac_gh_token');
    state.isAdmin = false;
    state.token = '';
    document.getElementById('adminBadge').classList.add('hidden');
    logoutModal.classList.add('hidden');
    renderSchedule(state.group);
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function() { 
        this.closest('.modal').classList.add('hidden'); 
    }
});