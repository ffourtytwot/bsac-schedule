// script.js

// == 1. НАЛАДЫ ==
const REPO_OWNER = "ffourtytwot";
const REPO_NAME = "bsac-schedule";
const FILE_PATH = "www/schedule.json";
const SALT = "bsac_super_salt_2025"; 
const TARGET_HASH = "38bff4d29d08888d2f3c8e0250551c3d7662bcc2cd1490048dc22a89502afc41"; 

// Спасылка на API (каб атрымаць SHA файла - гэта хутчэй за спампоўку ўсяго файла)
// Калі файл ляжыць у папку www, дадайце гэта ў шлях тут таксама
const API_URL_INFO = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
const RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;

const TIME_SLOTS = [
    "08:00-09:40", "09:55-11:35", "12:15-13:55",
    "14:10-15:50", "16:20-18:00", "18:15-19:55"
];

// == 2. ЛАКАЛІЗАЦЫЯ ==
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
        lblTeach: "Преподаватель",
        lblRoom: "Аудитория",
        days: { 
            "Понедельник": "Понедельник", "Вторник": "Вторник", "Среда": "Среда", 
            "Четверг": "Четверг", "Пятница": "Пятница", "Суббота": "Суббота" 
        },
        lblSubgroup: "Подгруппа:",
        subgroupAll: "Все",
        offlineMode: "⚠️ ОФФЛАЙН РЕЖИМ",
        lblSgShort: "П/г ",
        notificationTitle: "Расписание обновлено!", 
        notificationBody: "Нажмите, чтобы посмотреть изменения."
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
        notificationTitle: "Расклад абноўлены!", 
        notificationBody: "Націсніце, каб паглядзець змены."
    }
};

let state = {
    lang: 'ru',
    theme: 'light',
    group: '',
    subgroup: '0', 
    isAdmin: false,
    token: ''
};

let scheduleData = {};
const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// == 3. ІНІЦЫЯЛІЗАЦЫЯ ==
async function initApp() {
    loadSettings();
    checkAdminAuth();
    applyTheme();
    applyLang();

    // 1. Асноўная загрузка (з кэша або сеткі)
    await loadScheduleData();

    // 2. Фонавая праверка абнаўленняў (Працуе без Google Services!)
    // Запускаем праз невялікую затрымку, каб не тармазіць UI
    setTimeout(() => {
        checkForUpdatesBackground();
    }, 3000);
}

// == 4. ЗАГРУЗКА ДАДЗЕНЫХ ==
async function loadScheduleData() {
    const offlineBadge = document.getElementById('offlineBadge');
    
    try {
        // Спампоўваем JSON (дадаем timestamp, каб пазбегнуць кэша браўзера)
        const response = await fetch(`${RAW_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const newData = await response.json();
        scheduleData = newData;

        // Захоўваем дадзеныя
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        
        // Калі ўсё добра, хаваем бэйдж афлайн
        if(offlineBadge) offlineBadge.classList.add('hidden');

    } catch (e) {
        console.warn("Offline mode:", e);
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

// == 5. РАЗУМНАЯ ПРАВЕРКА АБНАЎЛЕННЯЎ (БЕЗ FIREBASE) ==
async function checkForUpdatesBackground() {
    // Гэтая функцыя правярае SHA (версію) файла на GitHub API
    try {
        const response = await fetch(API_URL_INFO);
        if (!response.ok) return;
        
        const data = await response.json();
        const remoteSha = data.sha;
        const localSha = localStorage.getItem('bsac_schedule_sha');

        // Калі SHA змяніўся - значыць расклад абноўлены
        if (localSha && remoteSha !== localSha) {
            console.log("Update detected!");
            
            // 1. Захоўваем новы SHA
            localStorage.setItem('bsac_schedule_sha', remoteSha);
            
            // 2. Пасылаем лакальнае апавяшчэнне
            await sendLocalNotification();
            
            // 3. Аўтаматычна перазагружаем дадзеныя (каб юзер адразу ўбачыў)
            await loadScheduleData();
        } else if (!localSha) {
            // Першы запуск, проста запамінаем SHA
            localStorage.setItem('bsac_schedule_sha', remoteSha);
        }
    } catch (e) {
        console.log("Check update failed (probably offline)", e);
    }
}

async function sendLocalNotification() {
    // Працуе толькі ў мабільным дадатку (Capacitor)
    // @ts-ignore
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
        const { LocalNotifications } = Capacitor.Plugins;
        
        try {
            // Запыт правоў (патрэбны адзін раз)
            await LocalNotifications.requestPermissions();

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: t('notificationTitle'),
                        body: t('notificationBody'),
                        id: 1,
                        schedule: { at: new Date(Date.now() + 1000) }, // Праз 1 секунду
                        sound: null,
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
        } catch (e) {
            console.error("Notif error", e);
        }
    }
}

// == 6. НАЛАДЫ І UI ==
function loadSettings() {
    const cachedSettings = localStorage.getItem('bsac_settings');
    if (cachedSettings) {
        try {
            const parsed = JSON.parse(cachedSettings);
            state.lang = parsed.lang || 'ru';
            state.theme = parsed.theme || 'light';
            state.group = parsed.group || '';
            state.subgroup = parsed.subgroup || '0';
        } catch (e) {}
    }
    const grp = document.getElementById('groupSelect');
    if(grp) grp.value = state.group;
    const sub = document.getElementById('subgroupSelect');
    if(sub) sub.value = state.subgroup;
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

// UI Listeners
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
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
    if(state.group) renderSchedule(state.group);
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
}

// == 7. РЭНДЭРЫНГ РАСКЛАДУ ==
function renderSchedule(group) {
    const container = document.getElementById('scheduleContainer');
    const offlineNode = document.getElementById('offlineBadge');
    container.innerHTML = '';
    
    // Калі мы афлайн, вяртаем бэйдж
    if(offlineNode && !offlineNode.classList.contains('hidden')) {
        container.appendChild(offlineNode);
    }

    const data = scheduleData[group] || {}; 

    // Кнопка захавання для адміна
    if (state.isAdmin) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'global-save-btn';
        saveBtn.textContent = t('btnSaveGlobal');
        saveBtn.onclick = saveToGithub;
        container.appendChild(saveBtn);
    }

    daysOrder.forEach(dayKey => {
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
            
            const slotLessons = dayLessons.map((l, index) => ({...l, realIndex: index}))
                                          .filter(l => l.time === timeSlot);

            const currentSg = parseInt(state.subgroup) || 0;
            const commonLesson = slotLessons.find(l => (parseInt(l.num_subgroup) || 0) === 0);
            
            let hasContent = false;
            let countSg1 = 0;
            let countSg2 = 0;

            // -- Адлюстраванне --
            if (commonLesson) {
                renderSingleLessonBlock(infoCol, commonLesson, group, dayKey, commonLesson.realIndex);
                hasContent = true;
            } else {
                const sg1Lessons = slotLessons.filter(l => parseInt(l.num_subgroup) === 1);
                const sg2Lessons = slotLessons.filter(l => parseInt(l.num_subgroup) === 2);
                
                countSg1 = sg1Lessons.length;
                countSg2 = sg2Lessons.length;

                const showSg1 = (currentSg === 0 || currentSg === 1);
                const showSg2 = (currentSg === 0 || currentSg === 2);

                if (showSg1 && countSg1 > 0) {
                    sg1Lessons.forEach(l => {
                        renderLessonAsSplit(infoCol, l, group, dayKey, l.realIndex);
                        hasContent = true;
                    });
                }

                if (showSg2 && countSg2 > 0) {
                    sg2Lessons.forEach(l => {
                        renderLessonAsSplit(infoCol, l, group, dayKey, l.realIndex);
                        hasContent = true;
                    });
                }
            }

            // -- Кнопка Дадаць (Толькі Адмін) --
            if (state.isAdmin) {
                let needAddButton = false;
                
                if (!commonLesson) {
                    // Калі хоць адна з падгруп пустая -> даем кнопку
                    if (currentSg === 0) {
                        if (countSg1 === 0 || countSg2 === 0) needAddButton = true;
                    } 
                    else if (currentSg === 1 && countSg1 === 0) needAddButton = true;
                    else if (currentSg === 2 && countSg2 === 0) needAddButton = true;
                }

                if (needAddButton) {
                    renderGenericAddButton(infoCol, group, dayKey, timeSlot);
                    hasContent = true; 
                }
            }

            // Паказваем радок толькі калі ёсць кантэнт
            if (hasContent) {
                row.appendChild(infoCol);
                table.appendChild(row);
                visibleRowsCount++;
            }
        });

        // Калі ўвесь дзень пусты
        if (visibleRowsCount === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 2;
            emptyCell.style.textAlign = "center";
            emptyCell.style.padding = "20px";
            emptyCell.style.color = "var(--text-secondary)";
            emptyCell.style.fontStyle = "italic";
            emptyCell.textContent = "🏖️ " + (state.lang === 'be' ? "Выхадны" : "Выходной");
            emptyRow.appendChild(emptyCell);
            table.appendChild(emptyRow);
        }

        dayBlock.appendChild(table);
        container.appendChild(dayBlock);
    });
}

// == 8. ДАПАМОЖНЫЯ ФУНКЦЫІ (КНОПКІ І БЛОКІ) ==

function renderGenericAddButton(container, group, dayKey, timeSlot) {
    const div = document.createElement('div');
    div.className = 'week-split empty-slot';
    div.style.padding = "5px";
    
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

    const existing = scheduleData[group][dayKey].filter(l => l.time === timeSlot);
    let targetSg = 0; 

    // Аўта-выбар падгрупы
    if (existing.some(l => parseInt(l.num_subgroup) === 1)) {
        targetSg = 2;
    } 
    else if (existing.some(l => parseInt(l.num_subgroup) === 2)) {
        targetSg = 1;
    }
    else if (parseInt(state.subgroup) !== 0) {
        targetSg = parseInt(state.subgroup);
    }

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

function renderSingleLessonBlock(container, lesson, group, dayKey, index) {
    if (lesson.multi) {
        lesson.content.forEach((sub, subIdx) => {
             const div = document.createElement('div');
             div.className = 'week-split';
             div.innerHTML = generateLessonHTML(sub);
             if (state.isAdmin) div.appendChild(createAdminControls(group, dayKey, index, subIdx));
             container.appendChild(div);
        });
    } else {
        container.innerHTML = generateLessonHTML(lesson);
        if (state.isAdmin) container.appendChild(createAdminControls(group, dayKey, index, null));
    }
}

function renderLessonAsSplit(container, lesson, group, dayKey, index) {
    const borderStyle = lesson.num_subgroup == 1 ? "4px solid #e67e22" : "4px solid #9b59b6";
    if (lesson.multi) {
        lesson.content.forEach((sub, subIdx) => {
             const div = document.createElement('div');
             div.className = 'week-split'; 
             div.style.borderLeft = borderStyle;
             div.style.paddingLeft = "8px";
             div.innerHTML = generateLessonHTML({...sub, num_subgroup: lesson.num_subgroup}); 
             if (state.isAdmin) div.appendChild(createAdminControls(group, dayKey, index, subIdx));
             container.appendChild(div);
        });
    } else {
        const div = document.createElement('div');
        div.className = 'week-split';
        div.style.borderLeft = borderStyle;
        div.style.paddingLeft = "8px";
        div.innerHTML = generateLessonHTML(lesson);
        if (state.isAdmin) div.appendChild(createAdminControls(group, dayKey, index, null));
        container.appendChild(div);
    }
}

function generateLessonHTML(item) {
    let weekText = '';
    if (item.weeks) {
        const w = item.weeks;
        const weekClass = w.includes('1') ? 'week-odd' : 'week-even';
        weekText = `<span class="week-badge ${weekClass}">${t('lblWeeks')} ${w}</span>`;
    }
    let sgText = '';
    const sg = parseInt(item.num_subgroup) || 0;
    if (sg > 0) {
        sgText = `<span class="subgroup-badge sg-${sg}">${t('lblSgShort')}${sg}</span>`;
    }
    return `
        <div>${sgText}${weekText}</div>
        <span class="subject">${item.subject}</span>
        <div class="details">${t('lblTeach')}: ${item.teacher || '-'}</div>
        <div class="location">${t('lblRoom')}: ${item.room || '-'}</div>
    `;
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
    let targetLesson;
    if (subIndex !== null) {
        targetLesson = scheduleData[group][dayKey][index].content[subIndex];
    } else {
        targetLesson = scheduleData[group][dayKey][index];
    }

    const btn = window.event.target;
    const container = btn.closest('.week-split') || btn.closest('td');
    const currentSg = targetLesson.num_subgroup || 0;

    container.innerHTML = `
        <div style="background:var(--bg-card); border:1px solid var(--accent-primary); padding:8px; border-radius:6px; z-index:100; position:relative;">
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <div style="flex:1;">
                    <label style="font-size:0.7em;">${t('lblWeeks')}</label>
                    <input class="edit-input inp-weeks" value="${targetLesson.weeks || ''}" placeholder="1,3">
                </div>
                <div style="width:60px;">
                    <label style="font-size:0.7em;">${t('lblSubj')}</label>
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

// == 9. GITHUB SAVE ==
async function saveToGithub() {
    if (!state.token) return alert(t('errorAccess'));
    const btn = document.querySelector('.global-save-btn');
    if(btn) btn.textContent = t('saving');

    try {
        const getRes = await fetch(API_URL_INFO, { headers: { "Authorization": `token ${state.token}` }});
        if (!getRes.ok) throw new Error("API Error: Cannot get file SHA");
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
        
        if (!putRes.ok) throw new Error("Put Error: Cannot save file");
        
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        alert(t('successSave'));
    } catch (e) {
        alert(t('errorSave') + e.message);
    } finally {
        if(btn) btn.textContent = t('btnSaveGlobal');
    }
}

// == 10. AUTH & SECURITY ==
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
        const badge = document.getElementById('adminBadge');
        if(badge) badge.classList.remove('hidden');
        if(loginModal) loginModal.classList.add('hidden');
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
    const badge = document.getElementById('adminBadge');
    if(badge) badge.classList.add('hidden');
    if(logoutModal) logoutModal.classList.add('hidden');
    renderSchedule(state.group);
});

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function() { 
        const modal = this.closest('.modal');
        if(modal) modal.classList.add('hidden'); 
    }
});

// Запуск
initApp();