// script.js

// == 1. НАЛАДЫ ==
const REPO_OWNER = "ffourtytwot";
const REPO_NAME = "bsac-schedule";
const FILE_PATH = "www/schedule.json"; 
const SALT = "bsac_super_salt_2025"; 
const TARGET_HASH = "38bff4d29d08888d2f3c8e0250551c3d7662bcc2cd1490048dc22a89502afc41"; 

// Спасылка для ЧЫТАННЯ (Raw)
const RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;
// Спасылка для ЗАПІСУ (API)
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

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
        offlineMode: "⚠️ ОФФЛАЙН РЕЖИМ (Данные из кэша)",
        lblSgShort: "П/г "
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
        offlineMode: "⚠️ АФЛАЙН РЭЖЫМ (Дадзеныя з кэшу)",
        lblSgShort: "П/г "
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
    // Чытаем налады
    const cachedSettings = localStorage.getItem('bsac_settings');
    if (cachedSettings) {
        try {
            const parsed = JSON.parse(cachedSettings);
            state.lang = parsed.lang || 'ru';
            state.theme = parsed.theme || 'light';
            state.group = parsed.group || '';
            state.subgroup = parsed.subgroup || '0';
        } catch (e) { console.error("Error parsing settings", e); }
    }

    // Чытаем токен
    const savedToken = localStorage.getItem('bsac_gh_token');
    if (savedToken) {
        const checkHash = await sha256(SALT + savedToken);
        if (checkHash === TARGET_HASH) {
            state.isAdmin = true;
            state.token = savedToken;
            const badge = document.getElementById('adminBadge');
            if(badge) badge.classList.remove('hidden');
        }
    }

    // Ужываем UI
    applyTheme();
    applyLang();
    const grpSelect = document.getElementById('groupSelect');
    if(grpSelect) grpSelect.value = state.group;
    
    const subSelect = document.getElementById('subgroupSelect');
    if(subSelect) subSelect.value = state.subgroup;

    // Ініцыялізацыя Push-апавяшчэнняў (калі гэта мабільнае прыкладанне)
    initPushNotifications();

    // Загрузка дадзеных
    const offlineBadge = document.getElementById('offlineBadge');
    const placeholder = document.getElementById('uiPlaceholder');
    
    try {
        const response = await fetch(`${RAW_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("HTTP " + response.status);
        
        scheduleData = await response.json();
        
        // Поспех -> у кэш
        localStorage.setItem('bsac_cached_schedule', JSON.stringify(scheduleData));
        if(offlineBadge) offlineBadge.classList.add('hidden');
        
    } catch (e) {
        console.warn("Offline mode active:", e);
        const cachedData = localStorage.getItem('bsac_cached_schedule');
        if (cachedData) {
            scheduleData = JSON.parse(cachedData);
            if(offlineBadge) {
                offlineBadge.classList.remove('hidden');
                offlineBadge.textContent = t('offlineMode');
            }
        } else {
            if(placeholder) placeholder.textContent = t('errorLoad');
            return;
        }
    }
    
    if (state.group) renderSchedule(state.group);
}

// == 4. PUSH NOTIFICATIONS (Capacitor) ==
async function initPushNotifications() {
    // Працуем толькі калі ёсць Capacitor і Android
    // @ts-ignore
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
        const { PushNotifications } = Capacitor.Plugins;
        // Для падпіскі на тэму патрэбен альбо @capacitor-community/fcm, альбо кастомная логіка
        // Мы мяркуем, што плагін усталяваны
        const FCM = Capacitor.Plugins.FCM; 

        try {
            let perm = await PushNotifications.checkPermissions();
            if (perm.receive === 'prompt') {
                perm = await PushNotifications.requestPermissions();
            }
            if (perm.receive !== 'granted') return;

            await PushNotifications.register();

            // Падпіска на тэму "all" для масавых рассылак
            if (FCM) {
                await FCM.subscribeTo({ topic: "all" })
                    .then(() => console.log("Subscribed to topic 'all'"))
                    .catch((err) => console.log("Error subscribing to topic", err));
            }

            // Пры атрыманні паведамлення ў дадатку
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('Push received:', notification);
                // Аўтаматычна абнаўляем расклад, калі прыйшоў пуш
                initApp(); 
                alert(notification.title + "\n" + notification.body);
            });

        } catch (e) {
            console.error("Push init error:", e);
        }
    }
}

// == 5. UI EVENT HANDLERS ==
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

const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
const groupSelect = document.getElementById('groupSelect');
const subgroupSelect = document.getElementById('subgroupSelect');

if (themeBtn) themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings();
});

if (langBtn) langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'be' : 'ru';
    applyLang();
    if(state.group) renderSchedule(state.group);
    saveSettings();
});

if (groupSelect) groupSelect.addEventListener('change', (e) => {
    state.group = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

if (subgroupSelect) subgroupSelect.addEventListener('change', (e) => {
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

// == 6. РЭНДЭРЫНГ РАСКЛАДУ ==
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
            
            // Фільтрацыя пар
            const slotLessons = dayLessons.map((l, index) => ({...l, realIndex: index}))
                                          .filter(l => l.time === timeSlot);

            const currentSg = parseInt(state.subgroup) || 0;
            const commonLesson = slotLessons.find(l => (parseInt(l.num_subgroup) || 0) === 0);
            
            let hasContent = false;
            let countSg1 = 0;
            let countSg2 = 0;

            // -- Адлюстраванне --
            if (commonLesson) {
                // Агульная пара
                renderSingleLessonBlock(infoCol, commonLesson, group, dayKey, commonLesson.realIndex);
                hasContent = true;
            } else {
                // Падгрупы
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
                
                // Калі ёсць агульная пара - дадаваць няма куды (яна займае ўвесь слот)
                if (!commonLesson) {
                    // Калі рэжым "Усе": калі хоць адна з падгруп пустая -> даем кнопку
                    if (currentSg === 0) {
                        if (countSg1 === 0 || countSg2 === 0) needAddButton = true;
                    } 
                    // Калі рэжым "П/г 1" і яна пустая
                    else if (currentSg === 1 && countSg1 === 0) {
                        needAddButton = true;
                    }
                    // Калі рэжым "П/г 2" і яна пустая
                    else if (currentSg === 2 && countSg2 === 0) {
                        needAddButton = true;
                    }
                }

                if (needAddButton) {
                    renderGenericAddButton(infoCol, group, dayKey, timeSlot);
                    // Калі дадаем кнопку, значыць радок павінен быць бачны
                    hasContent = true; 
                }
            }

            // Вырашаем, ці паказваць радок
            // (Юзер бачыць толькі запоўненыя, Адмін бачыць запоўненыя + кнопкі)
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

// == 7. ДАПАМОЖНЫЯ ФУНКЦЫІ РЭНДЭРЫНГУ ==

// Кнопка "Дадаць" (Адна на ўвесь слот)
function renderGenericAddButton(container, group, dayKey, timeSlot) {
    const div = document.createElement('div');
    div.className = 'week-split empty-slot';
    div.style.padding = "5px";
    
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.textContent = t('btnAdd'); 
    
    // Разумнае даданне
    btn.onclick = () => addNewLessonSmart(group, dayKey, timeSlot);
    
    div.appendChild(btn);
    container.appendChild(div);
}

// Функцыя, якая сама вырашае, у якую падгрупу дадаць
function addNewLessonSmart(group, dayKey, timeSlot) {
    if (!scheduleData[group]) scheduleData[group] = {};
    if (!scheduleData[group][dayKey]) scheduleData[group][dayKey] = [];

    const existing = scheduleData[group][dayKey].filter(l => l.time === timeSlot);
    
    // Логіка па змаўчанні: Агульная (0)
    let targetSg = 0; 

    // Калі ўжо ёсць пара ў п/г 1 -> новую робім п/г 2
    if (existing.some(l => parseInt(l.num_subgroup) === 1)) {
        targetSg = 2;
    } 
    // Калі ўжо ёсць пара ў п/г 2 -> новую робім п/г 1
    else if (existing.some(l => parseInt(l.num_subgroup) === 2)) {
        targetSg = 1;
    }
    // Калі выбрана канкрэтная падгрупа ў фільтры, выкарыстоўваем яе
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

// Адлюстраванне звычайнай пары
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

// Адлюстраванне пары ў падгрупе (з каляровай рысачкай)
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
        <div>
            ${sgText}
            ${weekText}
        </div>
        <span class="subject">${item.subject}</span>
        <div class="details">${t('lblTeach')}: ${item.teacher || '-'}</div>
        <div class="location">${t('lblRoom')}: ${item.room || '-'}</div>
    `;
}

// == 8. ФУНКЦЫІ АДМІНА (КРМ, ВЫДАЛЕННЕ, ЗАХАВАННЕ) ==

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
        // Калі ў мульці-пары нічога не засталося, выдаляем і бацьку
        if (parent.content.length === 0) {
            scheduleData[group][dayKey].splice(index, 1);
        }
    } else {
        scheduleData[group][dayKey].splice(index, 1);
    }
    renderSchedule(group);
}

// Рэдагаванне праз замену HTML (Inline)
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

    // Ствараем форму
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

// Захаванне на GitHub
async function saveToGithub() {
    if (!state.token) return alert(t('errorAccess'));
    const btn = document.querySelector('.global-save-btn');
    if(btn) btn.textContent = t('saving');

    try {
        // Спачатку атрымліваем SHA файла
        const getRes = await fetch(API_URL, { headers: { "Authorization": `token ${state.token}` }});
        if (!getRes.ok) throw new Error("API Error: Cannot get file SHA");
        const fileData = await getRes.json();
        const fileSha = fileData.sha;

        // Кадуем кантэнт у Base64 (выпраўленне праблем з кірыліцай)
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(scheduleData, null, 2))));

        const putRes = await fetch(API_URL, {
            method: "PUT",
            headers: { "Authorization": `token ${state.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Update schedule from Admin UI",
                content: contentBase64,
                sha: fileSha
            })
        });
        
        if (!putRes.ok) throw new Error("Put Error: Cannot save file");
        
        // Абнаўляем кэш
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

// == 9. АЎТАРЫЗАЦЫЯ (Клікі па лагатыпе) ==
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

// ЗАПУСК
initApp();