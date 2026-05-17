let apiBase = localStorage.getItem("healthApiBase") || "http://localhost:9999";

const state = {
  backend: false,
  token: "",
  userName: "龙辉铉",
  records: [],
  sports: [],
  aiRows: [],
  evaluationText: "系统将根据身体信息、历史记录和生活方式生成健康评估。",
  recordPage: 1,
  sportPage: 1,
  pageSize: 10,
  lastKeyword: ""
};

const pageMeta = {
  dashboard: ["个人健康智能管理系统", "欢迎回来，龙辉铉", "健康数据管理、运动知识推荐与 AI 智能分析"],
  body: ["身体信息上传", "身体信息上传", "保存当前身体指标，并写入历史健康记录"],
  data: ["健康数据管理", "健康数据管理", "身体信息列表、历史记录与条件查询"],
  ai: ["AI 智能分析", "AI 智能分析", "体检报告解读、风险评估、趋势分析、个性化建议"],
  report: ["体检报告解读", "体检报告解读", "报告输入、提示词构建、知识检索、模型分析和结构化呈现"],
  suggestion: ["健康评估建议", "健康评估建议", "结合健康评估与 AI 建议生成"],
  sport: ["运动知识", "运动知识", "运动知识、适合心率、推荐频率和速度"],
  admin: ["系统管理", "系统管理", "用户、角色、菜单与运动详情管理"]
};

const statusMap = {
  normal: ["正常", "status-normal"],
  warning: ["偏高", "status-warning"],
  danger: ["异常", "status-danger"]
};

const suggestions = [
  ["饮食建议", "减少高油、高糖和高盐饮食，增加蔬菜、优质蛋白和膳食纤维摄入；血糖或血脂偏高时，优先控制精制碳水。"],
  ["运动建议", "每周进行 3-5 次中等强度有氧运动，每次 30-45 分钟；可选择快走、慢跑、游泳或骑行，并结合心率区间调整强度。"],
  ["生活方式建议", "保持 7-8 小时睡眠，戒烟限酒，避免长期熬夜；通过规律作息和压力管理降低代谢风险。"],
  ["复查建议", "如果血糖、血脂、血压持续异常，建议 2-4 周后复查，并及时咨询专业医生。"]
];

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function showMessage(target, text, type = "info") {
  target.textContent = text;
  target.dataset.type = type;
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, value => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[value]));
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8", ...(options.headers || {}) };
  if (state.token) headers["X-Token"] = state.token;
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  if (!response.ok) throw new Error(`接口异常：${response.status}`);
  return response.json();
}

function enterApp() {
  $("#loginScreen").classList.add("hidden");
  $("#appScreen").classList.remove("hidden");
  renderAll();
}

function switchPage(page) {
  $all(".page").forEach(item => item.classList.remove("active"));
  $(`#page-${page}`).classList.add("active");
  $all(".menu-item").forEach(item => item.classList.toggle("active", item.dataset.page === page));
  $("#figureTitle").textContent = pageMeta[page][0];
  $("#pageHeading").textContent = pageMeta[page][1];
  $("#pageSubline").textContent = pageMeta[page][2];
}

function setMode(backend) {
  state.backend = backend;
  $("#modeBadge").textContent = backend ? "数据库已连接" : "数据库未连接";
}

function bestDisplayName() {
  const recordName = state.records.find(item => item.name && !["admin", "test"].includes(String(item.name).toLowerCase()))?.name;
  if (recordName) return recordName;
  if (state.userName && !["admin", "test"].includes(String(state.userName).toLowerCase())) return state.userName;
  const formName = document.querySelector("[name='name']")?.value;
  return formName || "龙辉铉";
}

function firstNameChar() {
  const name = bestDisplayName().trim();
  return Array.from(name)[0] || "用";
}

function normalizeRecord(item, index = 0) {
  const bloodSugar = Number(item.bloodSugar ?? item.blood_sugar ?? 0);
  const bloodPressure = String(item.bloodPressure ?? item.blood_pressure ?? "--");
  const lipidRaw = item.bloodLipid ?? item.blood_lipid ?? 0;
  const bloodLipid = Number(String(lipidRaw).replace(/[^\d.]/g, "")) || 0;
  let status = "normal";
  if (bloodSugar >= 7 || bloodLipid >= 6.2 || bloodPressure.startsWith("14") || bloodPressure.startsWith("135")) status = "danger";
  else if (bloodSugar >= 5.8 || bloodLipid >= 5.2 || bloodPressure.startsWith("13") || bloodPressure.startsWith("125")) status = "warning";
  return {
    id: String(item.notesid || item.notes_id || item.id || `R${String(index + 1).padStart(4, "0")}`),
    type: item.type || "日常监测",
    bloodPressure,
    bloodSugar,
    bloodLipid,
    heartRate: Number(item.heartRate ?? item.heart_rate ?? 0),
    weight: Number(item.weight ?? 0),
    height: Number(item.height ?? 1.75),
    date: String(item.Date || item.date || new Date().toISOString()).slice(0, 16).replace("T", " "),
    status,
    name: item.name || state.userName
  };
}

function currentRecord() {
  return state.records[0] || null;
}

function renderStats() {
  const item = currentRecord();
  $("#heartRateStat").textContent = item ? item.heartRate : "--";
  $("#pressureStat").textContent = item ? item.bloodPressure : "--";
  $("#sugarStat").textContent = item ? item.bloodSugar : "--";
  const bmi = item && item.weight && item.height ? (item.weight / (item.height * item.height)).toFixed(1) : "--";
  $("#bmiStat").textContent = bmi;
  $("#avatarText").textContent = firstNameChar();
  $("#pageHeading").textContent = `欢迎回来，${bestDisplayName()}`;
  $("#clockText").textContent = new Date().toLocaleString("zh-CN", { hour12: false });
}

function renderTodayList() {
  const item = currentRecord();
  if (!item) {
    $("#todayHealthList").innerHTML = `<div class="health-item"><div><div class="health-label">暂无记录</div><div class="health-value">请先读取数据库或上传身体信息</div></div></div>`;
    return;
  }
  const rows = [
    ["💓", "心率", `${item.heartRate} 次/分`, item.heartRate > 90 ? "warning" : "normal"],
    ["🩺", "血压", `${item.bloodPressure} mmHg`, item.bloodPressure.startsWith("13") || item.bloodPressure.startsWith("125") ? "warning" : "normal"],
    ["🧪", "血糖", `${item.bloodSugar} mmol/L`, item.bloodSugar >= 5.8 ? "warning" : "normal"],
    ["⚖", "体重", `${item.weight} kg`, item.weight >= 69 ? "warning" : "normal"]
  ];
  $("#todayHealthList").innerHTML = rows.map(([icon, label, value, status]) => `
    <div class="health-item">
      <div class="health-main"><span class="mini-icon">${icon}</span><div><div class="health-label">${label}</div><div class="health-value">${value}</div></div></div>
      <span class="status-badge ${statusMap[status][1]}">${statusMap[status][0]}</span>
    </div>
  `).join("");
}

function renderTrendChart() {
  const data = state.records.slice(0, 8).reverse().map(item => Number(item.bloodSugar)).filter(Boolean);
  if (!data.length) {
    $("#trendChart").innerHTML = `<div class="empty-state">暂无趋势数据</div>`;
    return;
  }
  const points = data.map((value, index) => {
    const x = 56 + index * (560 / Math.max(data.length - 1, 1));
    const y = 205 - ((value - 4.5) / 4) * 145;
    return [x, Math.max(40, Math.min(205, y)), value];
  });
  const path = points.map((point, index) => `${index ? "L" : "M"}${point[0]},${point[1]}`).join(" ");
  $("#trendChart").innerHTML = `
    <svg viewBox="0 0 680 250" aria-label="健康数据趋势图">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#667eea" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#667eea" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line x1="45" y1="35" x2="45" y2="210" stroke="#9aa9bd" stroke-width="2"/>
      <line x1="45" y1="210" x2="640" y2="210" stroke="#9aa9bd" stroke-width="2"/>
      <path d="${path} L640,210 L45,210 Z" fill="url(#trendFill)"/>
      <path d="${path}" fill="none" stroke="#334e86" stroke-width="4" stroke-linecap="round"/>
      ${points.map(point => `<circle cx="${point[0]}" cy="${point[1]}" r="7" fill="#334e86"/><text x="${point[0]}" y="${point[1] - 14}" text-anchor="middle" font-size="14" fill="#21324d">${point[2]}</text>`).join("")}
      <text x="340" y="28" text-anchor="middle" font-size="18" font-weight="700" fill="#21324d">血糖指标变化曲线</text>
      <text x="500" y="65" font-size="13" fill="#667eea">AI 预警参考线</text>
    </svg>
  `;
}

function renderRecords(keyword = "") {
  state.lastKeyword = keyword;
  const text = keyword.trim();
  const rows = state.records.filter(item => !text || `${item.id}${item.type}${item.bloodPressure}${statusMap[item.status][0]}${item.name || ""}`.includes(text));
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  state.recordPage = Math.min(Math.max(1, state.recordPage), totalPages);
  const pageRows = rows.slice((state.recordPage - 1) * state.pageSize, state.recordPage * state.pageSize);
  $("#recordsBody").innerHTML = pageRows.length ? pageRows.map(item => `
    <tr>
      <td>#${item.id}</td>
      <td>${item.type}</td>
      <td>${item.bloodPressure}</td>
      <td>${item.bloodSugar}</td>
      <td>${item.heartRate}</td>
      <td>${item.weight}</td>
      <td><span class="status-badge ${statusMap[item.status][1]}">${statusMap[item.status][0]}</span></td>
      <td>${item.date}</td>
      <td><div class="action-icons"><button class="icon-btn view" title="查看">👁</button><button class="icon-btn edit" title="编辑">✎</button><button class="icon-btn delete" title="删除">×</button></div></td>
    </tr>
  `).join("") : `<tr><td colspan="9">暂无健康数据，请读取数据库或上传身体信息。</td></tr>`;
  renderPagination("#recordsPagination", state.recordPage, totalPages, rows.length, page => {
    state.recordPage = page;
    renderRecords(state.lastKeyword);
  });
}

function suggestionHtml(rows) {
  return rows.map(([title, text], index) => {
    const icons = ["🥗", "🏃", "🌙", "🩺"];
    return `
      <div class="suggestion-item">
        <div class="suggestion-category"><span class="mini-icon">${icons[index] || "💡"}</span>${escapeHtml(title)}</div>
        <div class="suggestion-text">${escapeHtml(text)}</div>
      </div>
    `;
  }).join("");
}

function renderSuggestions(rows = suggestions) {
  state.aiRows = rows;
  $("#suggestionList").innerHTML = suggestionHtml(rows);
  $("#dashboardSuggestionList").innerHTML = rows.slice(0, 2).map(([title, text]) => `
    <div class="ai-suggestion">
      <div class="ai-suggestion-title">${escapeHtml(title)}</div>
      <div class="ai-suggestion-content">${escapeHtml(text)}</div>
    </div>
  `).join("");
  renderEvaluationAdvice();
}

function renderEvaluationAdvice() {
  const evaluation = $("#healthEvaluationText");
  const advice = $("#healthAdviceList");
  if (!evaluation || !advice) return;
  evaluation.textContent = state.evaluationText || buildLocalEvaluationText();
  advice.innerHTML = suggestionHtml(state.aiRows);
}

function renderSports() {
  const totalPages = Math.max(1, Math.ceil(state.sports.length / state.pageSize));
  state.sportPage = Math.min(Math.max(1, state.sportPage), totalPages);
  const rows = state.sports.slice((state.sportPage - 1) * state.pageSize, state.sportPage * state.pageSize);
  $("#sportBody").innerHTML = rows.length ? rows.map(item => `
    <tr>
      <td>${item.sportType || item.sport_type || "--"}</td>
      <td>${item.suitableTime || item.suitable_time || "--"}</td>
      <td>${item.suitableHeartRate || item.suitable_heart_rate || "--"}</td>
      <td>${item.suitableFrequency || item.suitable_frequency || "--"}</td>
      <td>${item.recommendedSpeed || item.recommended_speed || "--"}</td>
    </tr>
  `).join("") : `<tr><td colspan="5">暂无运动知识数据。</td></tr>`;
  renderPagination("#sportPagination", state.sportPage, totalPages, state.sports.length, page => {
    state.sportPage = page;
    renderSports();
  });
}

function renderPagination(selector, current, total, count, onChange) {
  const target = $(selector);
  const buttons = Array.from({ length: total }, (_, index) => index + 1).map(page =>
    `<button class="page-btn ${page === current ? "active" : ""}" data-page="${page}">${page}</button>`
  ).join("");
  target.innerHTML = `
    <button class="page-btn" data-page="${Math.max(1, current - 1)}" ${current === 1 ? "disabled" : ""}>上一页</button>
    ${buttons}
    <button class="page-btn" data-page="${Math.min(total, current + 1)}" ${current === total ? "disabled" : ""}>下一页</button>
    <span>共 ${count} 条记录</span>
  `;
  target.querySelectorAll("button[data-page]").forEach(button => {
    button.addEventListener("click", () => onChange(Number(button.dataset.page)));
  });
}

function renderAdminEmpty() {
  $("#adminUserCount").textContent = "0";
  $("#adminRoleCount").textContent = "0";
  $("#adminMenuCount").textContent = "0";
  $("#userAdminList").innerHTML = adminEmptyTable("请点击右上角按钮读取用户数据");
  $("#roleAdminList").innerHTML = adminEmptyTable("等待读取角色权限");
  $("#menuAdminList").innerHTML = adminEmptyTable("等待读取菜单资源");
}

function renderAll() {
  renderStats();
  renderTodayList();
  renderTrendChart();
  renderRecords();
  renderSuggestions();
  renderEvaluationAdvice();
  renderSports();
  renderAdminEmpty();
}

async function loginBackend(username, password) {
  const result = await api("/user/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  if (result.code && result.code !== 20000) {
    throw new Error(result.message || "登录失败");
  }
  const data = result.data || {};
  state.token = data.token || data["X-Token"] || "";
  state.userName = username || "当前用户";
  const info = await api(`/user/info?token=${encodeURIComponent(state.token)}`).catch(() => null);
  if (info?.data?.name || info?.data?.username) {
    state.userName = info.data.name || info.data.username;
  }
  setMode(true);
}

async function checkBackendConnection() {
  const result = await api("/api/site/ping");
  if (result.code && result.code !== 20000) throw new Error(result.message || "连接失败");
  return result;
}

async function loadDashboardData() {
  const result = await api("/api/site/dashboard");
  const records = result.data?.records || [];
  const sports = result.data?.sports || [];
  state.records = Array.isArray(records) ? records.map(normalizeRecord).reverse() : [];
  state.sports = Array.isArray(sports) ? sports : [];
  setMode(true);
  renderAll();
  refreshAiSuggestions();
}

async function loadBodyList(showTip = true) {
  const result = await api("/api/site/health-records");
  const rows = result.data || [];
  state.records = Array.isArray(rows) ? rows.map(normalizeRecord).reverse() : [];
  state.recordPage = 1;
  renderAll();
  refreshAiSuggestions();
  if (showTip) alert(`已读取 ${state.records.length} 条真实健康记录。`);
}

async function saveBodyInfo() {
  const form = $("#bodyForm");
  const data = Object.fromEntries(new FormData(form).entries());
  const payload = {
    ...data,
    age: Number(data.age),
    height: Number(data.height),
    weight: Number(data.weight),
    bloodSugar: Number(data.bloodSugar),
    heartRate: Number(data.heartRate),
    vision: Number(data.vision),
    sleepDuration: Number(data.sleepDuration),
    waterConsumption: Number(data.waterConsumption),
    smoking: false,
    drinking: false,
    exercise: true
  };
  try {
    await api("/api/site/body", { method: "POST", body: JSON.stringify(payload) });
    await loadBodyList(false);
    showMessage($("#bodyMessage"), "已保存到 MySQL，正在自动生成 AI 分析。", "success");
    const reportText = buildReportText(payload);
    $("#reportText").value = reportText;
    switchPage("ai");
    runAiAnalysis(reportText);
  } catch (error) {
    showMessage($("#bodyMessage"), `保存失败：${error.message}`, "error");
  }
}

async function loadSports() {
  try {
    const result = await api("/api/site/sports");
    const rows = result.data || [];
    state.sports = Array.isArray(rows) ? rows : [];
    state.sportPage = 1;
    renderSports();
    alert(`已读取 ${state.sports.length} 条运动知识数据。`);
  } catch (error) {
    alert(`运动知识接口不可用：${error.message}`);
  }
}

async function loadAdmin() {
  try {
    const result = await api("/api/site/admin");
    const userRows = result?.data?.users || [];
    const roleRows = result?.data?.roles || [];
    const menuRows = result?.data?.menus || [];
    $("#adminUserCount").textContent = userRows.length;
    $("#adminRoleCount").textContent = roleRows.length;
    $("#adminMenuCount").textContent = menuRows.length;
    $("#userAdminList").innerHTML = adminTable(["用户名", "联系方式", "邮箱"], userRows.map(item => [
      item.username || item.name || "用户",
      item.phone || "未填写",
      item.email || "未填写"
    ]));
    $("#roleAdminList").innerHTML = adminTable(["角色标识", "角色名称", "说明"], roleRows.map(item => [
      item.role || item.roleKey || item.role_key || "role",
      item.roleName || item.role_name || item.name || "角色",
      item.roleDesc || item.role_desc || "系统权限"
    ]));
    $("#menuAdminList").innerHTML = adminTable(["菜单名称", "路径", "组件"], menuRows.map(item => [
      item.title || item.name || "菜单",
      item.path || "未配置",
      item.component || "未配置"
    ]));
  } catch (error) {
    alert(`系统管理接口不可用：${error.message}`);
  }
}

function adminEmptyTable(text) {
  return `<div class="admin-empty">${text}</div>`;
}

function adminTable(headers, rows) {
  if (!rows.length) return adminEmptyTable("暂无数据");
  return `
    <div class="table-wrap admin-table-wrap">
      <table class="data-table admin-table">
        <thead><tr>${headers.map(item => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead>
        <tbody>${rows.slice(0, 8).map(row => `<tr>${row.map(item => `<td>${escapeHtml(item)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function runAiAnalysis() {
  const text = ($("#reportText").value || "").trim();
  const validation = validateHealthText(text);
  if (!validation.ok) {
    $("#reportTip").textContent = validation.message;
    $("#reportTip").dataset.type = "error";
    $("#aiResultBox").classList.remove("is-loading");
    $("#aiResultBox").innerHTML = `
      <div class="result-title">请输入正确的健康信息</div>
      <div class="result-content"><p>${validation.message}</p><p>示例：血糖 6.4 mmol/L，血压 135/86 mmHg，心率 80 次/分，睡眠 6 小时。</p></div>
    `;
    return;
  }
  $("#reportTip").textContent = "内容格式正确，可以进行 AI 分析。";
  $("#reportTip").dataset.type = "success";
  const steps = ["正在读取健康数据", "正在整理医学知识", "正在调用 DeepSeek 模型", "正在生成健康分析报告"];
  const box = $("#loadingSteps");
  box.classList.remove("hidden");
  box.innerHTML = "";
  $("#aiResultBox").classList.add("is-loading");
  steps.forEach((step, index) => {
    setTimeout(() => {
      box.innerHTML += `<div><span class="mini-icon">✓</span>${step}</div>`;
      if (index === steps.length - 1) {
        requestAiAnalysis(text);
      }
    }, index * 500);
  });
}

async function requestAiAnalysis(text = $("#reportText").value.trim()) {
  try {
    const result = await api("/api/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ reportText: text })
    });
    const data = result.data || {};
    $("#scoreValue").textContent = data.score || "85";
    $("#aiResultBox").classList.remove("is-loading");
    const sourceClass = data.source === "deepseek" ? "source-deepseek" : "source-fallback";
    $("#aiResultBox").innerHTML = `
      <div class="result-title">AI 分析结果</div>
      <div class="result-source ${sourceClass}">${data.sourceText || "AI 分析完成"}</div>
      <div class="result-content">${formatAiText(data.result || "")}</div>
    `;
    applyAiSuggestion(data.result || "");
  } catch (error) {
    $("#aiResultBox").classList.remove("is-loading");
    $("#aiResultBox").innerHTML = `
      <div class="result-title">AI 接口调用失败</div>
      <div class="result-source source-fallback">未能连接后端 AI 接口</div>
      <div class="result-content"><p>${error.message}</p><p>请确认 Spring Boot 已启动，并且 DEEPSEEK_API_KEY 已配置。</p></div>
    `;
  }
}

function validateHealthText(text) {
  const healthWords = /(血糖|血压|血脂|心率|体重|身高|BMI|睡眠|运动|胆固醇|甘油三酯|尿酸|体检|mmol|mmHg|kg|次\/分)/i;
  const hasNumber = /\d/.test(text);
  if (text.length < 12) return { ok: false, message: "请输入包含具体指标的健康数据，不能只输入一句话。" };
  if (!healthWords.test(text) || !hasNumber) return { ok: false, message: "内容未识别到健康指标，请补充血压、血糖、血脂、心率、体重或睡眠等数据。" };
  return { ok: true, message: "" };
}

function buildReportText(item = currentRecord()) {
  if (!item) return "";
  return `姓名 ${item.name || bestDisplayName()}，体重 ${item.weight} kg，血糖 ${item.bloodSugar} mmol/L，血脂 ${item.bloodLipid || "--"} mmol/L，血压 ${item.bloodPressure} mmHg，心率 ${item.heartRate} 次/分，睡眠 ${item.sleepDuration || "7"} 小时。`;
}

async function refreshAiSuggestions() {
  const text = buildReportText();
  if (!validateHealthText(text).ok) {
    renderSuggestions();
    return;
  }
  try {
    const result = await api("/api/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ reportText: text })
    });
    applyAiSuggestion(result.data?.result || "");
  } catch {
    renderSuggestions();
  }
}

function applyAiSuggestion(text) {
  const lines = formatAiPlainLines(text);
  if (!lines.length) return;
  state.evaluationText = cleanAdviceText(findAdviceValue(lines, ["整体评估", "关注指标", "风险等级"]) || lines[0]) || buildLocalEvaluationText();
  const rows = buildAdviceRows(lines);
  renderSuggestions(rows);
}

function buildAdviceRows(lines) {
  const diet = cleanAdviceText(findAdviceValue(lines, ["饮食建议", "饮食"]) || "少吃高盐、高脂、高糖食物，多吃绿叶蔬菜、粗粮、鱼肉和豆制品。");
  const sport = cleanAdviceText(findAdviceValue(lines, ["运动建议", "运动"]) || "每周 3-5 次快走、慢跑或骑行，每次 30-45 分钟，强度以微微出汗为宜。");
  const lifestyle = cleanAdviceText(findAdviceValue(lines, ["生活方式", "睡眠", "作息"]) || "保持 7-8 小时睡眠，规律作息，减少熬夜，保证每日饮水。");
  const check = cleanAdviceText(findAdviceValue(lines, ["复查", "就医"]) || "如血压、血糖或血脂持续异常，建议 2-4 周后复查并咨询医生。");
  return [
    ["AI 饮食建议", diet],
    ["AI 运动建议", sport],
    ["AI 生活建议", lifestyle],
    ["AI 复查建议", check]
  ];
}

function findAdviceValue(lines, keywords) {
  for (let index = 0; index < lines.length; index += 1) {
    if (!keywords.some(keyword => lines[index].includes(keyword))) continue;
    const current = cleanAdviceText(lines[index]);
    if (current) return current;
    const next = lines[index + 1] ? cleanAdviceText(lines[index + 1]) : "";
    if (next) return next;
  }
  return "";
}

function cleanAdviceText(text) {
  return String(text || "")
    .replace(/^(整体评估|关注指标|风险等级|饮食建议|运动建议|生活方式|复查提醒|饮食运动)[:：]\s*/, "")
    .trim();
}

function buildLocalEvaluationText() {
  const item = currentRecord();
  if (!item) return "暂无健康记录，请先上传身体信息或读取真实数据。";
  const risks = [];
  if (item.bloodSugar >= 5.8) risks.push("血糖偏高");
  if (item.bloodLipid >= 5.2) risks.push("血脂偏高");
  if (/^(13|14)/.test(item.bloodPressure)) risks.push("血压需关注");
  if (item.heartRate >= 90) risks.push("心率偏快");
  return risks.length
    ? `当前指标提示${risks.join("、")}，建议结合饮食、运动和复查计划持续管理。`
    : "当前主要健康指标整体平稳，建议继续保持规律饮食、运动和睡眠。";
}

function formatAiPlainLines(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^[-*_]{3,}$/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/^\s*\d+[.)]\s*/gm, "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function formatAiText(text) {
  return formatAiPlainLines(text)
    .slice(0, 8)
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function bindEvents() {
  $("#apiBase").value = apiBase;

  $("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    apiBase = $("#apiBase").value.trim().replace(/\/$/, "") || "http://localhost:9999";
    localStorage.setItem("healthApiBase", apiBase);
    showMessage($("#loginMessage"), "正在登录并连接数据库...");
    try {
      await loginBackend($("#username").value.trim(), $("#password").value);
      await loadDashboardData();
      enterApp();
    } catch (error) {
      showMessage($("#loginMessage"), `登录或连接失败：${error.message}`, "error");
    }
  });

  $("#checkBackend").addEventListener("click", async event => {
    event.preventDefault();
    apiBase = $("#apiBase").value.trim().replace(/\/$/, "") || "http://localhost:9999";
    localStorage.setItem("healthApiBase", apiBase);
    showMessage($("#loginMessage"), "正在检测后端和数据库...");
    try {
      const result = await checkBackendConnection();
      showMessage($("#loginMessage"), `${result.message}，当前健康记录数：${result.data?.records ?? 0}`, "success");
    } catch (error) {
      showMessage($("#loginMessage"), `连接失败：${error.message}`, "error");
    }
  });

  $all(".menu-item").forEach(button => button.addEventListener("click", () => switchPage(button.dataset.page)));
  $all("[data-page-link]").forEach(button => button.addEventListener("click", () => switchPage(button.dataset.pageLink)));
  $("#searchBtn").addEventListener("click", () => renderRecords($("#keywordInput").value));
  $("#keywordInput").addEventListener("input", event => renderRecords(event.target.value));
  $("#addRecordBtn").addEventListener("click", () => switchPage("body"));
  $("#loadBodyList").addEventListener("click", () => loadBodyList(true));
  $("#saveBodyBtn").addEventListener("click", saveBodyInfo);
  $("#runAiBtn").addEventListener("click", runAiAnalysis);
  $("#loadSportBtn").addEventListener("click", loadSports);
  $("#loadAdminBtn").addEventListener("click", loadAdmin);
}

bindEvents();
renderAll();
