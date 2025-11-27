// == НАЛАДЫ (ЗАПОЎНІЦЕ ГЭТА!) ==
const REPO_OWNER = "User";       
const REPO_NAME = "Repo";     
const FILE_PATH = "schedule.json"; 
const SALT = "bsac_super_salt_2025"; 
const TARGET_HASH = "38bff4d29d08888d2f3c8e0250551c3d7662bcc2cd1490048dc22a89502afc41"; // generateHash("ghp_...")

// == ЧАСАВЫЯ СЛОТЫ (Шаблон дня) ==
const TIME_SLOTS = [
    "08:00-09:40",
    "09:55-11:35",
    "12:15-13:55",
    "14:10-15:50",
    "16:20-18:00",
    "18:15-19:55" // Вячэрняя, калі трэба
];

// == ЛАКАЛІЗАЦЫЯ (ПОЎНАЯ) ==
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
        confirmDelete: "Очистить этот слот? (Он станет пустым шаблоном)",
        btnSaveGlobal: "☁️ Сохранить на GitHub",
        saving: "⏳ Сохранение...",
        
        // Элементы пар
        emptySlot: "Нет занятий",
        btnAdd: "➕ Добавить",
        btnEdit: "✎",
        btnDelete: "✖",
        btnOk: "OK",
        btnCancel: "Отмена",
        lblWeeks: "Недели (напр. 1,3)",
        lblSubj: "Предмет",
        lblTeach: "Преподаватель",
        lblRoom: "Аудитория",
        
        days: { 
            "Понедельник": "Понедельник", "Вторник": "Вторник", "Среда": "Среда", 
            "Четверг": "Четверг", "Пятница": "Пятница", "Суббота": "Суббота" 
        }
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
        confirmDelete: "Ачысціць гэты слот? (Ён стане пустым)",
        btnSaveGlobal: "☁️ Захаваць на GitHub",
        saving: "⏳ Захаванне...",

        emptySlot: "Няма заняткаў",
        btnAdd: "➕ Дадаць",
        btnEdit: "✎",
        btnDelete: "✖",
        btnOk: "OK",
        btnCancel: "Скасаваць",
        lblWeeks: "Тыдні (напр. 1,3)",
        lblSubj: "Прадмет",
        lblTeach: "Выкладчык",
        lblRoom: "Аўдыторыя",

        days: { 
            "Понедельник": "Панядзелак", "Вторник": "Аўторак", "Среда": "Серада", 
            "Четверг": "Чацвер", "Пятница": "Пятніца", "Суббота": "Субота" 
        }
    }
};

// Стан праграмы
let state = {
    lang: 'ru',
    theme: 'light',
    group: '',
    isAdmin: false,
    token: ''
};

let scheduleData = {};
const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// == 1. ІНІЦЫЯЛІЗАЦЫЯ І КЭШ ==
async function initApp() {
    // 1. Чытаем налады з кэша
    const cachedSettings = localStorage.getItem('bsac_settings');
    if (cachedSettings) {
        const parsed = JSON.parse(cachedSettings);
        state.lang = parsed.lang || 'ru';
        state.theme = parsed.theme || 'light';
        state.group = parsed.group || '';
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

    // 3. Прымяняем налады
    applyTheme();
    applyLang();
    document.getElementById('groupSelect').value = state.group;

    // 4. Загружаем дадзеныя
    try {
        const response = await fetch(`${FILE_PATH}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("HTTP " + response.status);
        scheduleData = await response.json();
        
        if (state.group) renderSchedule(state.group);
    } catch (e) {
        console.error(e);
        document.getElementById('uiPlaceholder').textContent = t('errorLoad') + ": " + e.message;
    }
}

// Захаванне налад
function saveSettings() {
    localStorage.setItem('bsac_settings', JSON.stringify({
        lang: state.lang,
        theme: state.theme,
        group: state.group
    }));
}

// Хэлпер перакладу
function t(key) {
    return translations[state.lang][key] || key;
}

// == UI ЛОГІКА ==
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
const groupSelect = document.getElementById('groupSelect');

themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings();
});

langBtn.addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'be' : 'ru';
    applyLang();
    if(state.group) renderSchedule(state.group); // Перарысоўка раскладу на новай мове
    saveSettings();
});

groupSelect.addEventListener('change', (e) => {
    state.group = e.target.value;
    renderSchedule(state.group);
    saveSettings();
});

function applyTheme() {
    document.body.className = state.theme === 'dark' ? 'dark-theme' : '';
    themeBtn.textContent = t(state.theme === 'light' ? 'themeLight' : 'themeDark');
}

function applyLang() {
    langBtn.textContent = state.lang.toUpperCase();
    
    // Пераклад статычных элементаў
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Плэйсхолдэры input
    document.querySelectorAll('input[placeholder]').forEach(el => {
        // Тут можна дадаць логіку, калі трэба перакладаць і placeholders
    });
}

// == РЭНДЭРЫНГ (Галоўная логіка) ==
function renderSchedule(group) {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';

    const data = scheduleData[group] || {}; // Дадзеныя групы ці пуста

    // Кнопка захавання для адміна
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

        // Ітэрацыя па ФІКСАВАНЫХ СЛОТАХ, а не па існуючых парах
        TIME_SLOTS.forEach((timeSlot) => {
            const row = document.createElement('tr');
            
            // 1. Час
            const timeCol = document.createElement('td');
            timeCol.className = 'time-col';
            timeCol.textContent = timeSlot;
            row.appendChild(timeCol);

            // 2. Пошук пары ў JSON для гэтага часу
            // Шукаем, ці ёсць у масіве data[dayKey] аб'ект з time === timeSlot
            const lessonIndex = dayLessons.findIndex(l => l.time === timeSlot);
            const lesson = dayLessons[lessonIndex];

            const infoCol = document.createElement('td');

            if (lesson) {
                // ПАРА ЁСЦЬ
                if (lesson.multi) {
                    // Мульці-пара (падгрупы ці тыдні)
                    lesson.content.forEach((subItem, subIdx) => {
                        const div = document.createElement('div');
                        div.className = 'week-split';
                        div.innerHTML = generateLessonHTML(subItem);
                        if (state.isAdmin) {
                            div.appendChild(createAdminControls(group, dayKey, lessonIndex, subIdx));
                        }
                        infoCol.appendChild(div);
                    });
                } else {
                    // Звычайная пара
                    infoCol.innerHTML = generateLessonHTML(lesson);
                    if (state.isAdmin) {
                        infoCol.appendChild(createAdminControls(group, dayKey, lessonIndex, null));
                    }
                }
            } else {
                // ПАРЫ НЯМА (ПУСТЫ СЛОТ)
                infoCol.className = 'empty-slot';
                infoCol.textContent = state.isAdmin ? "" : t('emptySlot');
                
                if (state.isAdmin) {
                    const addBtn = document.createElement('button');
                    addBtn.className = 'btn-add';
                    addBtn.textContent = t('btnAdd');
                    addBtn.onclick = () => addNewLesson(group, dayKey, timeSlot);
                    infoCol.appendChild(addBtn);
                }
            }

            row.appendChild(infoCol);
            table.appendChild(row);
        });

        dayBlock.appendChild(table);
        container.appendChild(dayBlock);
    });
}

function generateLessonHTML(item) {
    let weekText = '';
    if (item.weeks) {
        const w = item.weeks;
        const weekClass = w.includes('1') ? 'week-odd' : 'week-even';
        weekText = `<span class="week-badge ${weekClass}">${t('lblWeeks')} ${w}</span>`;
    }
    return `
        ${weekText}
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

// ДАДАННЕ НОВАЙ ПАРЫ
function addNewLesson(group, dayKey, timeSlot) {
    if (!scheduleData[group]) scheduleData[group] = {};
    if (!scheduleData[group][dayKey]) scheduleData[group][dayKey] = [];

    // Ствараем пусты аб'ект
    const newLesson = {
        time: timeSlot,
        subject: "Новый предмет",
        teacher: "",
        room: "",
        weeks: ""
    };
    
    scheduleData[group][dayKey].push(newLesson);
    // Адразу адкрываем рэдагаванне, бо пара "Новая"
    const newIndex = scheduleData[group][dayKey].length - 1;
    renderSchedule(group); // Спачатку малюем, каб з'явіўся DOM
    // Можна адразу трыгернуць editLesson, але для прастаты пакуль проста рэндэр
}

// ВЫДАЛЕННЕ (АЧЫСТКА)
function deleteLesson(group, dayKey, index, subIndex) {
    if (!confirm(t('confirmDelete'))) return;

    if (subIndex !== null) {
        // Выдаляем падгрупу
        const parent = scheduleData[group][dayKey][index];
        parent.content.splice(subIndex, 1);
        // Калі ў multi нічога не засталося, выдаляем увесь бацькоўскі элемент
        if (parent.content.length === 0) {
            scheduleData[group][dayKey].splice(index, 1);
        }
    } else {
        // Выдаляем аб'ект з масіва -> Слот стане пустым пры наступным рэндэры
        scheduleData[group][dayKey].splice(index, 1);
    }
    renderSchedule(group);
}

// РЭДАГАВАННЕ
function editLesson(group, dayKey, index, subIndex) {
    // Лагічны пошук аб'екта
    let targetLesson;
    if (subIndex !== null) {
        targetLesson = scheduleData[group][dayKey][index].content[subIndex];
    } else {
        targetLesson = scheduleData[group][dayKey][index];
    }

    // Шукаем DOM элемент. Цяжэй, бо мы перайшлі на Time Slots, а не індэксы
    // Але мы ведаем час targetLesson.time.
    // Аднак прасцей перамаляваць канкрэтную ячэйку, але для стабільнасці
    // мы проста знойдзем патрэбны div праз querySelector па тэксце ці пераробім renderSchedule,
    // але прасцей проста зрабіць "Modal Edit" ці "Inline Replace".
    // Зробім Inline Replace, але трэба знайсці бацьку кнопкі.
    
    // Хакаваты спосаб: Event target, але мы яго не перадалі.
    // Таму давайце проста перамалюем усё акно ў рэжым рэдагавання? Не, гэта доўга.
    // Давайце выкарыстоўваць event.target, які перададзім пры кліку.
    // Але ў createAdminControls onclick - гэта стрэлачная функцыя.
    // ПЕРАПІШАМ createAdminControls каб атрымаць доступ да event.
    
    // Прасцей: ператварыць увесь расклад у "Edit Form"? Не.
    
    // РАШЭННЕ: Мы проста адкрыем prompt (дрэнна) ці заменім усё праз пошук.
    // Давайце зробім прыгожа: знойдзем бацькоўскі кантэйнер праз DOM (гэта не вельмі чыста, але працуе).
    // Але ў нас няма доступу да `this`.
    
    // Вернемся да варыянту з мінулага кода: мы ведаем `index`. Але гэта індэкс у МАСІВЕ JSON.
    // А ў табліцы радкі ідуць па TIME_SLOTS.
    // Таму мы не можам проста ўзяць `tr[index]`.
    
    // Актуальны падыход: Prompt для прастаты кода (каб не раздзімаць файл), 
    // АБО перамаляваць гэты канкрэтны блок на форму.
    // Давайце перамалюем усю табліцу, але пазначым, што гэты элемент у рэжыме рэдагавання.
    
    // Дадаем у state: editing: { group, day, index, subIndex }
    state.editing = { group, dayKey, index, subIndex };
    renderEditForm(targetLesson);
}

function renderEditForm(targetLesson) {
    // Мы не будзем шукаць элемент у DOM. Мы проста выклічам мадалку? 
    // Не, карыстальнік прасіў "як было".
    // Добра, давайце проста выкарыстаем `window.event.target` (гэта працуе ў Chrome/FF).
    
    const btn = window.event.target;
    const container = btn.closest('td') || btn.closest('.week-split');
    
    // Захоўваем HTML
    const originalHTML = container.innerHTML;
    
    container.innerHTML = `
        <div style="background:#fff; border:1px solid #aaa; padding:5px;">
            <label>${t('lblWeeks')}</label>
            <input class="edit-input inp-weeks" value="${targetLesson.weeks || ''}">
            <label>${t('lblSubj')}</label>
            <input class="edit-input inp-subj" value="${targetLesson.subject || ''}">
            <label>${t('lblTeach')}</label>
            <input class="edit-input inp-teach" value="${targetLesson.teacher || ''}">
            <label>${t('lblRoom')}</label>
            <input class="edit-input inp-room" value="${targetLesson.room || ''}">
            <div class="admin-controls">
                <button class="btn-save">${t('btnOk')}</button>
                <button class="btn-cancel">${t('btnCancel')}</button>
            </div>
        </div>
    `;
    
    const btnSave = container.querySelector('.btn-save');
    const btnCancel = container.querySelector('.btn-cancel');
    
    btnSave.onclick = () => {
        targetLesson.weeks = container.querySelector('.inp-weeks').value;
        targetLesson.subject = container.querySelector('.inp-subj').value;
        targetLesson.teacher = container.querySelector('.inp-teach').value;
        targetLesson.room = container.querySelector('.inp-room').value;
        renderSchedule(state.group); // Абнавіць выгляд
    };
    
    btnCancel.onclick = () => {
        container.innerHTML = originalHTML;
        // Трэба аднавіць слухачы падзей (якія згубіліся пры innerHTML replace), 
        // таму прасцей перарэндэрыць усё
        renderSchedule(state.group);
    };
}


// == API GITHUB ==
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
            headers: { 
                "Authorization": `token ${state.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Update schedule",
                content: contentBase64,
                sha: fileSha
            })
        });

        if (!putRes.ok) throw new Error("Put Error");
        alert(t('successSave'));
    } catch (e) {
        alert(t('errorSave') + e.message);
    } finally {
        if(btn) btn.textContent = t('btnSaveGlobal');
    }
}

// == АЎТАРЫЗАЦЫЯ І HASH ==
async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Лагін
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

// Закрыццё крэсцікам
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function() { this.closest('.modal').classList.add('hidden'); }
});

// Запуск
initApp();

// Хэлпер для генерацыі
window.generateHash = async (t) => console.log(await sha256(SALT + t));