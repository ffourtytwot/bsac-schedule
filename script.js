// == НАЛАДЫ ==
const REPO_OWNER = "ffourtytwot";
const REPO_NAME = "bsac-schedule";     
const FILE_PATH = "schedule.json"; 
const SALT = "bsac_super_salt_2025"; 
const TARGET_HASH = "38bff4d29d08888d2f3c8e0250551c3d7662bcc2cd1490048dc22a89502afc41"; 

const TIME_SLOTS = [
    "08:00-09:40", "09:55-11:35", "12:15-13:55",
    "14:10-15:50", "16:20-18:00", "18:15-19:55"
];

const translations = {
    ru: {
        title: "Расписание БГАС 1 Курс",
        selectLabel: "Группа:",
        selectDefault: "-- Выберите --",
        placeholder: "Выберите группу для просмотра расписания.",
        loading: "Загрузка данных...",
        errorLoad: "Ошибка загрузки schedule.json",
        modalTitle: "Вход модератора",
        modalDesc: "Введите GitHub Token",
        modalHint: "Токен сохранится в вашем браузере.",
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
        confirmDelete: "Очистить этот слот?",
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
        lblTeach: "Преподаватель",
        lblRoom: "Аудитория",
        days: { 
            "Понедельник": "Понедельник", "Вторник": "Вторник", "Среда": "Среда", 
            "Четверг": "Четверг", "Пятница": "Пятница", "Суббота": "Суббота" 
        },
        // НОВАЕ
        lblSubgroup: "Подгруппа:",
        subgroupAll: "Все",
        offlineMode: "⚠️ ОФФЛАЙН РЕЖИМ (Данные из кэша)",
        lblSgShort: "П/г"
    },
    be: {
        title: "Расклад БДАС 1 Курс",
        selectLabel: "Група:",
        selectDefault: "-- Абярыце --",
        placeholder: "Абярыце групу, каб пабачыць расклад.",
        loading: "Загрузка дадзеных...",
        errorLoad: "Памылка загрузкі schedule.json",
        modalTitle: "Уваход мадэратара",
        modalDesc: "Увядзіце GitHub Token",
        modalHint: "Токен захаваецца ў вашым браўзеры.",
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
        confirmDelete: "Ачысціць гэты слот?",
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
        // НОВАЕ
        lblSubgroup: "Падгрупа:",
        subgroupAll: "Усе",
        offlineMode: "⚠️ АФЛАЙН РЭЖЫМ (Дадзеныя з кэшу)",
        lblSgShort: "П/г"
    }
};

let state = {
    lang: 'ru',
    theme: 'light',
    group: '',
    subgroup: '0', // 0 = Усе, 1 = 1-я, 2 = 2-я
    isAdmin: false,
    token: ''
};

let scheduleData = {};
const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// == 1. ІНІЦЫЯЛІЗАЦЫЯ І КЭШ (Абноўлена) ==
async function initApp() {
    // 1. Чытаем налады
    const cachedSettings = localStorage.getItem('bsac_settings');
    if (cachedSettings) {
        const parsed = JSON.parse(cachedSettings);
        state.lang = parsed.lang || 'ru';
        state.theme = parsed.theme || 'light';
        state.group = parsed.group || '';
        state.subgroup = parsed.subgroup || '0';
    }

    // 2. Чытаем токен
    const savedToken = localStorage.getItem('bsac_gh_token');
    if (savedToken) {
        const checkHash = await sha256(SALT + savedToken);
        if (checkHash === TARGET_HASH) {
            state.isAdmin = true;
            state.token = savedToken;
            document.getElementById('adminBadge').classList.toggle('hidden');
        }
    }

    // 3. Прымяняем UI
    applyTheme();
    applyLang();
    document.getElementById('groupSelect').value = state.group;
    document.getElementById('subgroupSelect').value = state.subgroup;

    // 4. ЗАГРУЗКА ДАДЗЕНЫХ + КЭШ
    const offlineBadge = document.getElementById('offlineBadge');
    
    try {
        const response = await fetch(`${FILE_PATH}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("HTTP " + response.status);
        
        scheduleData = await response.json();
        
        // Поспех -> захоўваем у кэш
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        offlineBadge.classList.add('hidden');
        
    } catch (e) {
        console.warn("Offline mode or Error:", e);
        // Памылка -> чытаем з кэша
        const cachedData = localStorage.getItem('bsac_cached_schedule');
        if (cachedData) {
            scheduleData = JSON.parse(cachedData);
            offlineBadge.classList.remove('hidden');
            offlineBadge.textContent = t('offlineMode');
        } else {
            document.getElementById('uiPlaceholder').textContent = t('errorLoad');
            return;
        }
    }
    
    if (state.group) renderSchedule(state.group);
}

function saveSettings() {
    localStorage.setItem('bsac_settings', JSON.stringify({
        lang: state.lang,
        theme: state.theme,
        group: state.group,
        subgroup: state.subgroup
    }));
}

function t(key) {
    return translations[state.lang][key] || key;
}

// == UI EVENT LISTENERS ==
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
const groupSelect = document.getElementById('groupSelect');
const subgroupSelect = document.getElementById('subgroupSelect');

themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings();
});

langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'be' : 'ru';
    applyLang();
    if(state.group) renderSchedule(state.group);
    saveSettings();
});

groupSelect.addEventListener('change', (e) => {
    state.group = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

subgroupSelect.addEventListener('change', (e) => {
    state.subgroup = e.target.value;
    renderSchedule(state.group); // Перарысоўваем пры змене падгрупы
    saveSettings();
});

function applyTheme() {
    document.body.className = state.theme === 'dark' ? 'dark-theme' : '';
    themeBtn.textContent = t(state.theme === 'light' ? 'themeLight' : 'themeDark');
}

function applyLang() {
    langBtn.textContent = state.lang.toUpperCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}

// == РЭНДЭРЫНГ (З падтрымкай падгруп) ==
function renderSchedule(group) {
    const container = document.getElementById('scheduleContainer');
    // Не сціраем offlineBadge, калі ён ёсць
    const offlineNode = document.getElementById('offlineBadge');
    container.innerHTML = '';
    container.appendChild(offlineNode); // Вяртаем яго назад

    const data = scheduleData[group] || {}; 

    if (state.isAdmin) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'global-save-btn';
        saveBtn.textContent = t('btnSaveGlobal');
        saveBtn.onclick = saveToGithub;
        container.appendChild(saveBtn);
    }

    daysOrder.forEach(dayKey => {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'schedule-day';

        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.textContent = t('days')[dayKey] || dayKey;
        dayBlock.appendChild(dayTitle);

        const table = document.createElement('table');
        const dayLessons = data[dayKey] || [];

        TIME_SLOTS.forEach((timeSlot) => {
            const row = document.createElement('tr');
            
            const timeCol = document.createElement('td');
            timeCol.className = 'time-col';
            timeCol.textContent = timeSlot;
            row.appendChild(timeCol);

            // Шукаем пару па часе
            const lessonIndex = dayLessons.findIndex(l => l.time === timeSlot);
            const lesson = dayLessons[lessonIndex];

            const infoCol = document.createElement('td');

            if (lesson) {
                // ПРАВЕРКА ПАДГРУПЫ
                // Логіка: 
                // Калі "Усе" (0) -> паказваем усё.
                // Калі выбрана "1" -> паказваем агульныя (sg=0/null) І sg=1. Хаваем sg=2.
                // Для Multi-урокаў трэба фільтраваць унутры.

                if (lesson.multi) {
                    let hasVisibleSubLessons = false;
                    
                    lesson.content.forEach((subItem, subIdx) => {
                        // Правяраем, ці падыходзіць падгрупа
                        if (isSubgroupVisible(subItem.num_subgroup)) {
                            const div = document.createElement('div');
                            div.className = 'week-split';
                            div.innerHTML = generateLessonHTML(subItem);
                            if (state.isAdmin) {
                                div.appendChild(createAdminControls(group, dayKey, lessonIndex, subIdx));
                            }
                            infoCol.appendChild(div);
                            hasVisibleSubLessons = true;
                        }
                    });

                    // Калі пасля фільтрацыі нічога не засталося
                    if (!hasVisibleSubLessons) {
                        renderEmptySlot(infoCol, group, dayKey, timeSlot);
                    }

                } else {
                    // Звычайная пара (Single)
                    if (isSubgroupVisible(lesson.num_subgroup)) {
                        infoCol.innerHTML = generateLessonHTML(lesson);
                        if (state.isAdmin) {
                            infoCol.appendChild(createAdminControls(group, dayKey, lessonIndex, null));
                        }
                    } else {
                        // Калі пара ёсць, але схавана фільтрам -> паказваем як пустую (але не даем дадаць новую для юзера)
                        // АДНАК, калі адмін - ён павінен бачыць усё? Не, адмін таксама фільтруе.
                        // Давайце паказваць "Пуста"
                        renderEmptySlot(infoCol, group, dayKey, timeSlot);
                    }
                }
            } else {
                // Пары няма наогул
                renderEmptySlot(infoCol, group, dayKey, timeSlot);
            }

            row.appendChild(infoCol);
            table.appendChild(row);
        });

        dayBlock.appendChild(table);
        container.appendChild(dayBlock);
    });
}

// Дапаможная функцыя: ці паказваць гэты элемент
function isSubgroupVisible(itemSg) {
    // Калі элемент не мае пазнакі падгрупы ці 0 -> ён для ўсіх
    const sg = parseInt(itemSg) || 0;
    const currentSg = parseInt(state.subgroup) || 0; // Што выбраў юзер

    if (currentSg === 0) return true; // Юзер хоча бачыць усё
    if (sg === 0) return true; // Пара агульная
    return sg === currentSg; // Пара супадае з падгрупай
}

function renderEmptySlot(container, group, dayKey, timeSlot) {
    container.className = 'empty-slot';
    container.textContent = state.isAdmin ? "" : t('emptySlot');
    if (state.isAdmin) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add';
        addBtn.textContent = t('btnAdd');
        addBtn.onclick = () => addNewLesson(group, dayKey, timeSlot);
        container.appendChild(addBtn);
    }
}

function generateLessonHTML(item) {
    let weekText = '';
    if (item.weeks) {
        const w = item.weeks;
        const weekClass = w.includes('1') ? 'week-odd' : 'week-even';
        weekText = `<span class="week-badge ${weekClass}">${t('lblWeeks')} ${w}</span>`;
    }

    // Бэйдж падгрупы
    let sgText = '';
    const sg = parseInt(item.num_subgroup) || 0;
    if (sg > 0) {
        sgText = `<span class="subgroup-badge sg-${sg}">${t('lblSgShort')}${sg}</span>`;
    }

    return `
        <div>
            ${sgText}
            ${weekText}
        </div>
        <span class="subject">${item.subject}</span>
        <div class="details">${t('lblTeach')}: ${item.teacher || '-'}</div>
        <div class="location">${t('lblRoom')}: ${item.room || '-'}</div>
    `;
}

// == АДМІН: КІРАВАННЕ ==
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

function addNewLesson(group, dayKey, timeSlot) {
    if (!scheduleData[group]) scheduleData[group] = {};
    if (!scheduleData[group][dayKey]) scheduleData[group][dayKey] = [];

    const newLesson = {
        time: timeSlot,
        subject: "Новый",
        teacher: "",
        room: "",
        weeks: "",
        num_subgroup: 0 // 0 = агульная
    };
    
    scheduleData[group][dayKey].push(newLesson);
    renderSchedule(group);
}

function deleteLesson(group, dayKey, index, subIndex) {
    if (!confirm(t('confirmDelete'))) return;

    if (subIndex !== null) {
        const parent = scheduleData[group][dayKey][index];
        parent.content.splice(subIndex, 1);
        if (parent.content.length === 0) {
            scheduleData[group][dayKey].splice(index, 1);
        }
    } else {
        scheduleData[group][dayKey].splice(index, 1);
    }
    renderSchedule(group);
}

// РЭДАГАВАННЕ (Дададзена поле падгрупы)
function editLesson(group, dayKey, index, subIndex) {
    let targetLesson;
    if (subIndex !== null) {
        targetLesson = scheduleData[group][dayKey][index].content[subIndex];
    } else {
        targetLesson = scheduleData[group][dayKey][index];
    }

    const btn = window.event.target;
    // Шукаем бліжэйшы кантэйнер (td або div.week-split)
    const container = btn.closest('.week-split') || btn.closest('td');
    
    const originalHTML = container.innerHTML;
    
    // Бягучая падгрупа
    const currentSg = targetLesson.num_subgroup || 0;

    container.innerHTML = `
        <div style="background:var(--bg-card); border:1px solid var(--accent-primary); padding:8px; border-radius:6px;">
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <div style="flex:1;">
                    <label style="font-size:0.7em;">${t('lblWeeks')}</label>
                    <input class="edit-input inp-weeks" value="${targetLesson.weeks || ''}" placeholder="1,3">
                </div>
                <div style="width:60px;">
                    <label style="font-size:0.7em;">${t('lblSgShort')}</label>
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

            <div class="admin-controls" style="margin-top:10px;">
                <button class="btn-save">${t('btnOk')}</button>
                <button class="btn-cancel">${t('btnCancel')}</button>
            </div>
        </div>
    `;
    
    const btnSave = container.querySelector('.btn-save');
    const btnCancel = container.querySelector('.btn-cancel');
    
    btnSave.onclick = (e) => {
        e.stopPropagation(); // Каб не трыгерыць клікі па табліцы
        targetLesson.weeks = container.querySelector('.inp-weeks').value;
        targetLesson.subject = container.querySelector('.inp-subj').value;
        targetLesson.teacher = container.querySelector('.inp-teach').value;
        targetLesson.room = container.querySelector('.inp-room').value;
        targetLesson.num_subgroup = parseInt(container.querySelector('.inp-sg').value) || 0;
        
        renderSchedule(state.group); 
    };
    
    btnCancel.onclick = (e) => {
        e.stopPropagation();
        renderSchedule(state.group); // Скідваем выгляд
    };
}

// == API GITHUB і АЎТАРЫЗАЦЫЯ (БЕЗ ЗМЕН) ==
async function saveToGithub() {
    if (!state.token) return alert(t('errorAccess'));
    const btn = document.querySelector('.global-save-btn');
    if(btn) btn.textContent = t('saving');

    try {
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const getRes = await fetch(apiUrl, { headers: { "Authorization": `token ${state.token}` }});
        if (!getRes.ok) throw new Error("API Error");
        const fileSha = (await getRes.json()).sha;
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(scheduleData, null, 2))));

        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: { "Authorization": `token ${state.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Update schedule", content: contentBase64, sha: fileSha })
        });
        if (!putRes.ok) throw new Error("Put Error");
        
        // Абнаўляем кэш пасля паспяховага захавання
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        alert(t('successSave'));
    } catch (e) {
        alert(t('errorSave') + e.message);
    } finally {
        if(btn) btn.textContent = t('btnSaveGlobal');
    }
}

async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

const loginModal = document.getElementById('adminModal');
const logoutModal = document.getElementById('logoutModal');
const logo = document.getElementById('secretLogo');
let clicks = 0, timer;

logo.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => clicks=0, 700);
    if (clicks >= 10) {
        clicks = 0;
        if (state.isAdmin) logoutModal.classList.remove('hidden');
        else loginModal.classList.remove('hidden');
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('apiTokenInput').value.trim();
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

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('bsac_gh_token');
    state.isAdmin = false;
    state.token = '';
    document.getElementById('adminBadge').classList.add('hidden');
    logoutModal.classList.add('hidden');
    renderSchedule(state.group);
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function() { this.closest('.modal').classList.add('hidden'); }
});

initApp();
