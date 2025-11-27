// == НАЛАДЫ РЭПАЗІТОРЫЯ ==
const REPO_OWNER = "ffourtytwot";       // Напрыклад: "user123"
const REPO_NAME = "bsac-schedule";     // Напрыклад: "bsac-schedule"
const FILE_PATH = "schedule.json"; // Імя файла

// == БЯСПЕКА ==
const SALT = "bsac_super_salt_2025"; 
// Сюды трэба ўставіць хэш вашага токена.
// Як яго атрымаць: адкрыйце кансоль браўзера і ўвядзіце: await generateHash("ваш_токен_ghp...")
// Скапіруйце вынік і ўстаўце ніжэй.
const TARGET_HASH = "b1c7cec9eb702134065040072db3811ff6f7c3709ce49c853d01c5ef5187ff3a"; 

// == UI НАЛАДЫ ==
const translations = {
    ru: {
        title: "Расписание БГАС 1 Курс",
        selectLabel: "Выберите группу:",
        selectDefault: "-- Группа --",
        placeholder: "Пожалуйста, выберите группу. (Загрузка...)",
        themeBtnLight: "☀️ Светлая",
        themeBtnDark: "🌙 Тёмная",
        langBtn: "RU",
        btnEdit: "✎",
        btnDelete: "✖",
        btnSave: "☁️ Сохранить на GitHub",
        btnCancel: "🚫",
        days: { "Понедельник": "Понедельник", "Вторник": "Вторник", "Среда": "Среда", "Четверг": "Четверг", "Пятница": "Пятница", "Суббота": "Суббота" }
    },
    be: {
        title: "Расклад БДАС 1 Курс",
        selectLabel: "Абярыце групу:",
        selectDefault: "-- Група --",
        placeholder: "Калі ласка, абярыце групу. (Загрузка...)",
        themeBtnLight: "☀️ Светлая",
        themeBtnDark: "🌙 Цёмная",
        langBtn: "BY",
        btnEdit: "✎",
        btnDelete: "✖",
        btnSave: "☁️ Захаваць на GitHub",
        btnCancel: "🚫",
        days: { "Понедельник": "Панядзелак", "Вторник": "Аўторак", "Среда": "Серада", "Четверг": "Чацвер", "Пятница": "Пятніца", "Суббота": "Субота" }
    }
};

let currentLang = 'ru';
let currentTheme = 'light';
let isAdmin = false;
let scheduleData = {};
let githubToken = ""; 

// == 1. ІНІЦЫЯЛІЗАЦЫЯ ==
async function initApp() {
    // Правяраем, ці ёсць токен у памяці браўзера
    const savedToken = localStorage.getItem('bsac_gh_token');
    
    if (savedToken) {
        // Калі токен ёсць, правяраем яго валіднасць праз хэш (на выпадак падмены)
        const checkHash = await sha256(SALT + savedToken);
        if (checkHash === TARGET_HASH) {
            isAdmin = true;
            githubToken = savedToken;
            document.getElementById('adminBadge').classList.remove('hidden');
        } else {
            // Калі хэш не супаў (токен састарэў ці падроблены), чысцім
            localStorage.removeItem('bsac_gh_token');
        }
    }

    // Загрузка JSON
    try {
        const response = await fetch(`${FILE_PATH}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Немагчыма загрузіць schedule.json");
        scheduleData = await response.json();
    } catch (e) {
        console.error(e);
        document.getElementById('scheduleContainer').innerHTML = `<div class="placeholder" style="color:red">Error: ${e.message}</div>`;
    }

    updateButtons();
}

// == ФУНКЦЫЯ ЗАХАВАННЯ НА GITHUB (API) ==
async function saveToGithub() {
    if (!githubToken) {
        alert("Памылка: Няма доступу. Пезайдите ў адмінку.");
        return;
    }

    const btn = document.querySelector('.global-save-btn');
    if(btn) btn.textContent = "⏳ Захаванне...";

    try {
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        
        // 1. Атрымліваем SHA файла
        const getResponse = await fetch(apiUrl, {
            headers: { 
                "Authorization": `token ${githubToken}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });
        
        if (!getResponse.ok) throw new Error("Памылка доступу да API. Праверце права токена.");
        const fileData = await getResponse.json();
        const fileSha = fileData.sha;

        // 2. Рыхтуем змест
        const jsonString = JSON.stringify(scheduleData, null, 2);
        // Кадзіроўка UTF-8 у Base64
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

        // 3. Адпраўляем абнаўленне
        const putResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `token ${githubToken}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Update schedule via Web Interface",
                content: base64Content,
                sha: fileSha
            })
        });

        if (!putResponse.ok) throw new Error("Не ўдалося захаваць змены.");

        alert("✅ Расклад абноўлены!");
        if(btn) btn.textContent = "☁️ Захаваць на GitHub";

    } catch (e) {
        alert(`❌ Памылка: ${e.message}`);
        if(btn) btn.textContent = "❌ Памылка";
    }
}

// == UI / RENDER ==
const select = document.getElementById('groupSelect');
const container = document.getElementById('scheduleContainer');
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    updateButtons();
});

langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'ru' ? 'be' : 'ru';
    updateLanguage();
    updateButtons();
    if (select.value) renderSchedule(select.value);
});

function updateButtons() {
    const t = translations[currentLang];
    themeBtn.textContent = currentTheme === 'light' ? t.themeBtnLight : t.themeBtnDark;
    langBtn.textContent = t.langBtn;
}

function updateLanguage() {
    const t = translations[currentLang];
    document.getElementById('uiTitle').textContent = t.title;
    document.getElementById('uiLabel').textContent = t.selectLabel;
    document.getElementById('uiSelectDefault').textContent = t.selectDefault;
    if (!select.value) document.getElementById('uiPlaceholder').textContent = t.placeholder;
}

select.addEventListener('change', (e) => renderSchedule(e.target.value));

function renderSchedule(group) {
    container.innerHTML = '';
    const data = scheduleData[group];
    
    if (!data) {
        container.innerHTML = `<div class="placeholder">${translations[currentLang].placeholder}</div>`;
        return;
    }

    if (isAdmin) {
        const globalSaveBtn = document.createElement('button');
        globalSaveBtn.className = 'login-btn global-save-btn';
        globalSaveBtn.style.marginBottom = '20px';
        globalSaveBtn.style.backgroundColor = '#8e44ad';
        globalSaveBtn.textContent = translations[currentLang].btnSave;
        globalSaveBtn.onclick = saveToGithub;
        container.appendChild(globalSaveBtn);
    }

    const daysOrder = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

    daysOrder.forEach(dayKey => {
        if (!data[dayKey]) return;
        const daySchedule = data[dayKey];
        
        const dayBlock = document.createElement('div');
        dayBlock.className = 'schedule-day';

        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.textContent = translations[currentLang].days[dayKey] || dayKey;
        dayBlock.appendChild(dayTitle);

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        const table = document.createElement('table');
        
        daySchedule.forEach((lesson, index) => {
            const row = document.createElement('tr');
            
            const timeCell = document.createElement('td');
            timeCell.style.width = "15%";
            timeCell.innerHTML = `<strong>${lesson.time}</strong>`;
            
            const infoCell = document.createElement('td');
            infoCell.id = `cell-${group}-${dayKey}-${index}`;

            if (lesson.multi) {
                lesson.content.forEach((item, subIndex) => {
                    const div = document.createElement('div');
                    div.className = 'week-split';
                    div.innerHTML = generateLessonHTML(item, true);
                    if (isAdmin) div.appendChild(createAdminControls(group, dayKey, index, subIndex));
                    infoCell.appendChild(div);
                });
            } else {
                infoCell.innerHTML = generateLessonHTML(lesson, false);
                if (isAdmin) infoCell.appendChild(createAdminControls(group, dayKey, index, null));
            }

            row.appendChild(timeCell);
            row.appendChild(infoCell);
            table.appendChild(row);
        });

        tableWrapper.appendChild(table);
        dayBlock.appendChild(tableWrapper);
        container.appendChild(dayBlock);
    });
}

function generateLessonHTML(item, showWeeks) {
    let weekText = '';
    if (item.weeks || showWeeks) {
        const w = item.weeks || '';
        const weekClass = (w.includes('1')) ? 'week-odd' : 'week-even';
        const weekLabel = currentLang === 'be' ? 'тыд.' : 'нед.';
        if(w) weekText = `<span class="week-badge ${weekClass}">${w} ${weekLabel}</span>`;
    }
    return `
        ${weekText}
        <span class="subject">${item.subject}</span>
        <div class="details">${item.teacher || ''}</div>
        <div class="location">Ауд. ${item.room || '-'}</div>
    `;
}

function createAdminControls(group, day, index, subIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-controls';
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = "✎";
    btnEdit.onclick = () => enableEditMode(group, day, index, subIndex);

    const btnDel = document.createElement('button');
    btnDel.className = 'btn-delete';
    btnDel.textContent = "✖";
    btnDel.onclick = () => deleteLesson(group, day, index, subIndex);

    wrapper.appendChild(btnEdit);
    wrapper.appendChild(btnDel);
    return wrapper;
}

function deleteLesson(group, day, index, subIndex) {
    if(!confirm("Выдаліць пару?")) return;
    if (subIndex !== null) {
        scheduleData[group][day][index].content.splice(subIndex, 1);
        if(scheduleData[group][day][index].content.length === 0) scheduleData[group][day].splice(index, 1);
    } else {
        scheduleData[group][day].splice(index, 1);
    }
    renderSchedule(group);
}

function enableEditMode(group, day, index, subIndex) {
    let targetObj;
    let containerEl;

    if (subIndex !== null) {
        targetObj = scheduleData[group][day][index].content[subIndex];
        const td = document.getElementById(`cell-${group}-${day}-${index}`);
        containerEl = td.getElementsByClassName('week-split')[subIndex];
    } else {
        targetObj = scheduleData[group][day][index];
        containerEl = document.getElementById(`cell-${group}-${day}-${index}`);
    }

    containerEl.innerHTML = `
        <div style="background:#f9f9f9; padding:5px; border:1px solid #ccc;">
            <input type="text" class="edit-input inp-weeks" value="${targetObj.weeks || ''}" placeholder="Тыдні (1,3)">
            <input type="text" class="edit-input inp-subj" value="${targetObj.subject || ''}" placeholder="Прадмет">
            <input type="text" class="edit-input inp-teacher" value="${targetObj.teacher || ''}" placeholder="Выкладчык">
            <input type="text" class="edit-input inp-room" value="${targetObj.room || ''}" placeholder="Аўдыторыя">
            <div class="admin-controls">
                <button class="btn-save" style="background:green">OK</button>
                <button class="btn-cancel" style="background:gray">Cancel</button>
            </div>
        </div>
    `;

    const btnSave = containerEl.querySelector('.btn-save');
    const btnCancel = containerEl.querySelector('.btn-cancel');

    btnSave.onclick = () => {
        targetObj.weeks = containerEl.querySelector('.inp-weeks').value;
        targetObj.subject = containerEl.querySelector('.inp-subj').value;
        targetObj.teacher = containerEl.querySelector('.inp-teacher').value;
        targetObj.room = containerEl.querySelector('.inp-room').value;
        renderSchedule(group);
    };
    btnCancel.onclick = () => renderSchedule(group);
}

// == АЎТАРЫЗАЦЫЯ І ХЭШАВАННЕ ==

const logoImg = document.getElementById('secretLogo');
const loginModal = document.getElementById('adminModal');
const logoutModal = document.getElementById('logoutModal');
const loginForm = document.getElementById('loginForm');
const msgBox = document.getElementById('loginMessage');
const logoutBtn = document.getElementById('logoutBtn');

let clickCount = 0;
let clickTimer = null;

if(logoImg) {
    logoImg.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 400);

        if (clickCount >= 10) {
            clickCount = 0;
            if (isAdmin) logoutModal.classList.remove('hidden');
            else {
                loginModal.classList.remove('hidden');
                msgBox.textContent = "";
                document.getElementById('apiTokenInput').value = "";
            }
        }
    });
}

document.getElementById('closeLoginModal').addEventListener('click', () => loginModal.classList.add('hidden'));
document.getElementById('closeLogoutModal').addEventListener('click', () => logoutModal.classList.add('hidden'));

// Функцыя SHA-256
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Апрацоўка УВАХОДУ
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tokenInput = document.getElementById('apiTokenInput').value.trim();
    
    // Вылічваем хэш ад уведзенага токена
    const calculatedHash = await sha256(SALT + tokenInput);
    
    // Звяраем з захаваным хэшам
    if (calculatedHash === TARGET_HASH) {
        msgBox.textContent = "Успех! (Доступ дазволены)";
        msgBox.style.color = "#2ecc71";
        
        // Калі супала, захоўваем АРЫГІНАЛЬНЫ токен (ён патрэбен для API)
        localStorage.setItem('bsac_gh_token', tokenInput);
        
        setTimeout(() => {
            loginModal.classList.add('hidden');
            location.reload();
        }, 500);
    } else {
        msgBox.textContent = "Няправільны токен";
        msgBox.style.color = "#e74c3c";
    }
});

// Апрацоўка ВЫХАДУ
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('bsac_gh_token');
    location.reload();
});

// == КАМАНДА ДЛЯ ГЕНЕРАЦЫІ ВАШАГА ХЭША ==
// Выклікаць у кансолі браўзера: await generateHash("ghp_MyRealToken...")
window.generateHash = async (token) => {
    const h = await sha256(SALT + token);
    console.log(`%cВаш хэш для ўстаўкі ў код:`, 'color: orange; font-weight: bold;');
    console.log(h);
    return h;
};

// Запуск
initApp();
