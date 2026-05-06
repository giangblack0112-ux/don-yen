const MAX_THREADS = 5;

const els = {
  form: document.getElementById('config-form'),
  date: document.getElementById('date'),
  apiKey: document.getElementById('apiKey'),
  shopId: document.getElementById('shopId'),
  gsUrl: document.getElementById('gsUrl'),
  exportNowBtn: document.getElementById('exportNowBtn'),
  addGroupBtn: document.getElementById('addGroupBtn'),
  groupName: document.getElementById('groupName'),
  groupPids: document.getElementById('groupPids'),
  groupList: document.getElementById('groupList'),
  clearGroupsBtn: document.getElementById('clearGroupsBtn'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  exportGroupsBtn: document.getElementById('exportGroupsBtn'),
  status: document.getElementById('status'),
  progress: document.getElementById('progress'),
  results: document.getElementById('results'),
  statsCard: document.getElementById('stats-card'),
  successCount: document.getElementById('success-count'),
  failedCount: document.getElementById('failed-count'),
  totalCount: document.getElementById('total-count'),
  successRate: document.getElementById('success-rate'),
};

let productGroups = {}; // { groupName: [pid, ...] }
let latestSummaries = null; // Lưu bản tóm tắt gần nhất để xuất

function saveState() {
  const state = {
    date: els.date.value,
    apiKey: els.apiKey.value ? '__MASKED__' : '',
    shopId: els.shopId.value,
    groups: productGroups,
  };
  localStorage.setItem('tdtn_state', JSON.stringify(state));
}

function loadState() {
  const s = localStorage.getItem('tdtn_state');
  if (!s) return;
  try {
    const state = JSON.parse(s);
    if (state.date) els.date.value = state.date;
    if (state.shopId) els.shopId.value = state.shopId;
    if (state.groups) productGroups = state.groups;
    renderGroups();
  } catch {}
}

function setStatus(text) {
  els.status.textContent = text;
}

function setProgress(pct) {
  if (pct === null) {
    els.progress.hidden = true;
    els.progress.value = 0;
    return;
  }
  els.progress.hidden = false;
  els.progress.value = pct;
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function updateExportButtonState() {
  const hasSummaries = !!latestSummaries;
  const urlOk = els.gsUrl && isValidUrl(els.gsUrl.value.trim());
  if (!els.exportNowBtn) return;
  els.exportNowBtn.disabled = !(hasSummaries && urlOk);
}

function formatNumber(n) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

function showStats(success, failed, total) {
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  
  els.successCount.textContent = formatNumber(success);
  els.failedCount.textContent = formatNumber(failed);
  els.totalCount.textContent = formatNumber(total);
  els.successRate.textContent = `${successRate}%`;
  
  els.statsCard.style.display = 'block';
}

function renderGroups() {
  els.groupList.innerHTML = '';
  const entries = Object.entries(productGroups);
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'group-card';
    empty.textContent = 'Chưa có nhóm nào. Hãy thêm nhóm ở trên.';
    els.groupList.appendChild(empty);
    return;
  }
  for (const [groupName, pids] of entries) {
    const card = document.createElement('div');
    card.className = 'group-card';

    const header = document.createElement('div');
    header.className = 'group-card-header';

    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = groupName;

    const btns = document.createElement('div');
    const del = document.createElement('button');
    del.className = 'danger';
    del.type = 'button';
    del.textContent = '×';
    del.title = 'Xóa nhóm';
    del.onclick = () => { delete productGroups[groupName]; renderGroups(); saveState(); };
    btns.appendChild(del);

    header.appendChild(title);
    header.appendChild(btns);

    const pidList = document.createElement('div');
    pidList.className = 'pid-list';
    pidList.style.display = 'none'; // Ẩn danh sách product ID
    for (const pid of pids) {
      const badge = document.createElement('span');
      badge.className = 'pid-badge';
      badge.textContent = pid;
      const rm = document.createElement('button');
      rm.className = 'pid-remove';
      rm.type = 'button';
      rm.textContent = '×';
      rm.title = 'Xoá ID này khỏi nhóm';
      rm.onclick = () => {
        productGroups[groupName] = productGroups[groupName].filter(x => x !== pid);
        renderGroups();
        saveState();
      };
      badge.appendChild(rm);
      pidList.appendChild(badge);
    }

    const addRow = document.createElement('div');
    addRow.style.marginTop = '8px';
    addRow.style.display = 'none'; // Ẩn phần thêm product ID
    const addInput = document.createElement('input');
    addInput.placeholder = 'Thêm ID sản phẩm, cách nhau bởi dấu phẩy';
    addInput.style.width = '70%';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'secondary';
    addBtn.textContent = 'Thêm ID';
    addBtn.style.marginLeft = '8px';
    addBtn.onclick = () => {
      const ids = addInput.value.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) return;
      const set = new Set(productGroups[groupName]);
      for (const id of ids) set.add(id);
      productGroups[groupName] = Array.from(set);
      renderGroups();
      saveState();
      addInput.value = '';
    };
    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);

    card.appendChild(header);
    card.appendChild(pidList);
    card.appendChild(addRow);
    els.groupList.appendChild(card);
  }
}

function addGroupFromInputs() {
  const name = els.groupName.value.trim();
  const pids = els.groupPids.value.split(',').map(s => s.trim()).filter(Boolean);
  if (!name || pids.length === 0) return;
  const set = new Set(productGroups[name] || []);
  for (const id of pids) set.add(id);
  productGroups[name] = Array.from(set);
  els.groupName.value = '';
  els.groupPids.value = '';
  renderGroups();
  saveState();
}

els.addGroupBtn.addEventListener('click', addGroupFromInputs);
els.clearGroupsBtn.addEventListener('click', () => { productGroups = {}; renderGroups(); saveState(); });

// Event listeners cho các button mới
els.loadSampleBtn.addEventListener('click', loadFixedGroups);

els.exportGroupsBtn.addEventListener('click', () => {
  setStatus('Chức năng xuất nhóm đã được ẩn theo yêu cầu');
});


function buildOrdersUrl(shopId) {
  return `https://pos.pages.fm/api/v1/shops/${shopId}/orders`;
}
function buildOrderDetailUrl(shopId, orderId) {
  return `https://pos.pages.fm/api/v1/shops/${shopId}/orders/${orderId}`;
}

function toTimestampAtTZ(dateStr, h, m, s, tzOffsetHours) {
  const [y, mo, d] = dateStr.split('-').map(n => parseInt(n, 10));
  const utc = Date.UTC(y, mo - 1, d, h - tzOffsetHours, m, s, 0);
  return Math.floor(utc / 1000);
}

async function fetchOrderIds(apiKey, shopId, date) {
  const url = buildOrdersUrl(shopId);
  const startDateTime = toTimestampAtTZ(date, 0, 0, 0, -7 * -1); // we'll set below properly
}

async function fetchOrderIdsPaged(apiKey, shopId, date) {
  const url = buildOrdersUrl(shopId);
  const startTs = toTimestampAtTZ(date, 0, 0, 0, 7);
  const endTs = toTimestampAtTZ(date, 23, 59, 59, 7);
  const orderIds = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      api_key: apiKey,
      page_size: '100',
      page_number: String(page),
      startDateTime: String(startTs),
      endDateTime: String(endTs),
    });
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lỗi API orders: ${res.status} - ${text}`);
    }
    const data = await res.json();
    const orders = data.data || data.orders || data.list || data.items || [];
    if (!Array.isArray(orders) || orders.length === 0) break;
    for (const o of orders) { if (o && o.id) orderIds.push(o.id); }
    if (orders.length < 100) break;
    page += 1;
  }
  return orderIds;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchOrderDetailWithRetry(apiKey, shopId, orderId) {
  const url = buildOrderDetailUrl(shopId, orderId);
  const maxRetries = 3;
  const retryDelay = 2000;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) await sleep(retryDelay * attempt);
    try {
      const res = await fetch(`${url}?${new URLSearchParams({ api_key: apiKey }).toString()}`, { method: 'GET' });
      if (res.status === 200) {
        const data = await res.json();
        const order = data.data || data.order || data;
        if (order && typeof order === 'object') return order;
      } else if (res.status === 429) {
        const wait = retryDelay * Math.pow(2, attempt);
        setStatus(`Rate limit cho đơn ${orderId}, chờ ${wait/1000}s...`);
        await sleep(wait);
        continue;
      } else {
        const text = await res.text();
        console.warn(`Lỗi đơn ${orderId}: ${res.status} - ${text}`);
        break;
      }
    } catch (e) {
      console.warn(`Lỗi lấy đơn ${orderId} (lần ${attempt + 1}):`, e);
      if (attempt < maxRetries - 1) await sleep(retryDelay);
    }
  }
  return null;
}

async function promisePool(items, worker, concurrency, onProgress) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let done = 0;
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) break;
      try {
        results[current] = await worker(items[current], current);
      } finally {
        done++;
        if (onProgress) onProgress(done, items.length);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function analyze(productGroupsMap, orders) {
  const result = {};
  for (const [groupName, pids] of Object.entries(productGroupsMap)) {
    result[groupName] = {
      group_name: groupName,
      product_ids: pids,
      total_orders: 0,
      total_quantity: 0,
      total_money_to_collect: 0,
      related_items: {}, // pid -> { name, total_qty }
    };
  }

  for (const order of orders) {
    if (!order) continue;
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) continue;
    const orderPidSet = new Set(items.map(i => i && i.product_id).filter(Boolean));
    const money = order.money_to_collect || 0;
    if (orderPidSet.size === 0) continue;

    for (const [groupName, pids] of Object.entries(productGroupsMap)) {
      const hasAny = pids.some(pid => orderPidSet.has(pid));
      if (!hasAny) continue;
      const r = result[groupName];
      r.total_orders += 1;
      r.total_money_to_collect += money;
      for (const item of items) {
        if (!item || !item.product_id) continue;
        const pid = item.product_id;
        const name = (item.variation_info && item.variation_info.name) || '';
        const qty = item.quantity || 0;
        if (pids.includes(pid)) r.total_quantity += qty;
        if (!r.related_items[pid]) r.related_items[pid] = { name: name, total_qty: 0 };
        r.related_items[pid].name = name || r.related_items[pid].name;
        r.related_items[pid].total_qty += qty;
      }
    }
  }
  return result;
}

function renderResults(summaries) {
  els.results.innerHTML = '';
  latestSummaries = summaries;
  updateExportButtonState();
  for (const [groupName, summary] of Object.entries(summaries)) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const header = document.createElement('div');
    header.className = 'result-header';
    const h = document.createElement('div');
    h.textContent = groupName;
    h.style.fontWeight = '700';
    h.style.fontSize = '16px';

    const metrics = document.createElement('div');
    metrics.className = 'metrics';
    const m1 = document.createElement('div'); m1.className = 'metric'; m1.textContent = `Đơn: ${formatNumber(summary.total_orders)}`;
    const m2 = document.createElement('div'); m2.className = 'metric'; m2.textContent = `Số lượng: ${formatNumber(summary.total_quantity)}`;
    const m3 = document.createElement('div'); m3.className = 'metric'; m3.textContent = `COD: ${formatNumber(summary.total_money_to_collect)} đ`;
    metrics.appendChild(m1); metrics.appendChild(m2); metrics.appendChild(m3);

    header.appendChild(h);
    header.appendChild(metrics);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Tên</th><th>S.Lượng</th></tr>';
    const tbody = document.createElement('tbody');
    const entries = Object.entries(summary.related_items || {});
    entries.sort((a,b) => (b[1].total_qty||0) - (a[1].total_qty||0));
    for (const [pid, info] of entries) {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = info.name || '';
      const td2 = document.createElement('td'); td2.textContent = String(info.total_qty || 0);
      tr.appendChild(td1); tr.appendChild(td2);
      tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);

    card.appendChild(header);
    card.appendChild(table);
    els.results.appendChild(card);
  }
}

function buildMetricsRowsFromSummaries(summaries, dateStr) {
  const rows = [];
  for (const [groupName, s] of Object.entries(summaries || {})) {
    rows.push({
      date: dateStr,
      group_name: groupName,
      total_orders: s.total_orders || 0,
      total_quantity: s.total_quantity || 0,
      total_money_to_collect: s.total_money_to_collect || 0,
    });
  }
  return rows;
}


async function runAnalysis(evt) {
  evt.preventDefault();
  const apiKey = els.apiKey.value.trim();
  const shopId = els.shopId.value.trim();
  const date = els.date.value.trim();
  if (!apiKey || !shopId || !date) { setStatus('Vui lòng nhập đủ ngày, API Key và Shop ID'); return; }
  if (Object.keys(productGroups).length === 0) { setStatus('Chưa có nhóm sản phẩm'); return; }

  setStatus('Đang lấy danh sách đơn trong ngày...');
  setProgress(3);
  
  // Ẩn section thống kê khi bắt đầu phân tích mới
  els.statsCard.style.display = 'none';
  let orderIds = [];
  try {
    orderIds = await fetchOrderIdsPaged(apiKey, shopId, date);
  } catch (e) {
    setStatus(`Lỗi lấy danh sách đơn: ${e.message || e}`);
    setProgress(null);
    return;
  }
  setStatus(`Đã lấy ${orderIds.length} đơn. Đang tải chi tiết...`);
  if (orderIds.length === 0) { setProgress(null); return; }

  let doneCount = 0;
  const orders = await promisePool(orderIds, async (oid) => {
    const order = await fetchOrderDetailWithRetry(apiKey, shopId, oid);
    doneCount++;
    setProgress(Math.round((doneCount / orderIds.length) * 100));
    return order;
  }, MAX_THREADS);

  const success = orders.filter(Boolean).length;
  const failed = orders.length - success;
  const total = orders.length;
  
  setStatus(`Hoàn thành phân tích! Đã xử lý ${total} đơn hàng.`);
  setProgress(null);

  // Hiển thị thống kê chi tiết
  showStats(success, failed, total);

  const summaries = analyze(productGroups, orders);
  renderResults(summaries);

  saveState();
}

els.form.addEventListener('submit', runAnalysis);

async function exportToGoogleSheets() {
  const url = els.gsUrl.value.trim();
  if (!isValidUrl(url)) { setStatus('URL không hợp lệ'); return; }
  if (!latestSummaries) { setStatus('Chưa có dữ liệu để xuất'); return; }
  const rows = buildMetricsRowsFromSummaries(latestSummaries, els.date.value);
  const productRows = buildProductQuantityRowsFromSummaries(latestSummaries, els.date.value);
  if (productRows.length === 0) {
    setStatus('Cảnh báo: Không có product_rows nào được tạo (chỉ xuất ID nằm trong nhóm).');
  } else {
    const sample = productRows.slice(0, 3).map(r => `${r.product_id}:${r.total_quantity}`).join(', ');
    setStatus(`Chuẩn bị xuất ${productRows.length} product_rows. Ví dụ ID:Qty ${sample}`);
  }
  if (rows.length === 0 && productRows.length === 0) { setStatus('Không có hàng dữ liệu để xuất'); return; }
  const payload = { type: 'metrics', date: els.date.value, rows, product_rows: productRows };
  try {
    els.exportNowBtn.disabled = true;
    setStatus(`Đang xuất ${rows.length} hàng nhóm + ${productRows.length} hàng theo product_id sang Google Sheets...`);
    // Gửi JSON dưới content-type text/plain để tránh preflight; GAS parse e.postData.contents
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(`${res.status} - ${rawText}`);
    }
    let info = {};
    try { info = JSON.parse(rawText); } catch { info = { raw: rawText }; }
    const msg = info && info.ok
      ? (() => {
          const metricsUpdated = (info.results && info.results.metrics && info.results.metrics.groupsUpdated) || (info.result && info.result.metrics && info.result.metrics.groupsUpdated) || 0;
          const productUpdated = (info.results && info.results.product && info.results.product.updated) || (info.result && info.result.product && info.result.product.updated) || 0;
          const productMissing = (info.results && info.results.product && Array.isArray(info.results.product.missing) && info.results.product.missing.length) || (info.result && info.result.product && Array.isArray(info.result.product.missing) && info.result.product.missing.length) || 0;
          return `Xuất thành công: groupsUpdated=${metricsUpdated}, productUpdated=${productUpdated}, productMissing=${productMissing}`;
        })()
      : `Xuất xong nhưng phản hồi: ${rawText}`;
    setStatus(msg);
  } catch (e) {
    setStatus(`Xuất thất bại: ${e.message || e}`);
  } finally {
    updateExportButtonState();
  }
}

// Định nghĩa các nhóm sản phẩm cố định
const FIXED_PRODUCT_GROUPS = {
  "(1) Văn_Trúc        :": ["94b73162-db8e-45f2-91d3-ccf4365ef521"],
  "(2) Mẹ_Thuốc        :": ["b31f9bcf-09ee-4ff9-9a60-54dc4f66ebb1"],
  "(3) Chàm_Mèo        :": ["034c3893-264a-49d4-b3d2-85255aeb3dc7", "b4c79f4f-5882-4388-8818-ddf8c3bdf1db","396dfd64-c838-4385-aa1b-d87b3802d7a4"],
  "(4) Sung_Cảnh       :": ["f34f5a3d-5b41-4b94-88de-49fe85e1c3a4"],
  "(5) Búp_Sen         :": ["515fac53-1d92-44b6-919c-ab772a07c8fe"],
  // "(6) Sâm_Béo         :":["dbe8ac7d-4189-4f17-b6e2-a7bc047eacab"],
  // "(7) May_Mắn         :":["a04219f6-ac73-4b30-8d1b-bddea5d32802"],
  // "(8) Kim_ngân        :":["26f05750-3b94-4581-b40a-25de62b0a7bc"],
  "(9) Khúng_Khéng     :":["25515516-abde-4adf-8192-69c6efb1c635", "9dee6257-225a-4f74-8f95-22716662fa2d"],
  "(10) Trục_Hàn       :":["59a39c1a-fe01-44d1-b587-81fefd614dd2"],
  "(11) Vông_Nem       :":["fb322786-0e89-4f88-a61c-83f3447f4b82"],
  // "(12) Giống_bứa      :":["f40a795c-c9a6-4e04-bf89-a2232bab915b"],
  "(13) Bưởi_Non        :": ["872518d8-c806-4fde-bdc5-2858a73bc6b6", "10a784f2-4c3c-47c0-ab60-0d4e3e94b9a6"],
  "(14) Tía_Tô         :":["62ad48ab-86f4-45d5-ba6b-3de38925e938"],
  // "(15) TNK+cỏ_xước    :":["40d00e4d-5c95-4095-961c-b8edbff7a41f"],
  // "(16) Vỏ_Trâm        :":["8637e0b0-be69-4bba-a627-dc5a6cfa8778"],
  "(17) Ngót_Rừng      :":["6cb9b9da-7e22-439d-b4cd-33f3c939dd6f"],
 // "Thằn lằn cẩm thạch":["bdabf31f-cd55-41da-a6fc-c661d7c5b21d"],
  "(18) Tùng_Kim_Cương :":["b6679c70-7fe2-4f35-9a2d-21148a1628a8"],
  // "(19) Lan_Chuông     :":["35adaa92-6c1e-4b33-9d7b-de46f68c2475"],
  // "(20) Bầu_Đất_Mâm_Xôi:":["5010c8de-bffe-400a-9a5f-08c38b29b4b6"],
  "(21) Dòi_Tía        :":["01e7fe63-9769-4c3d-90fc-81d4914b531f", "a3922dbf-c250-44cb-b3eb-291e75881164"],
  //"Ớt ngũ sắc":["b45e1d76-0268-4b94-aa59-df2740deb7e6"],
  // "(22) Lựu_Bonsai     :":["8851ae14-3a95-4199-9559-d42e6f651772"],
  // "(23) Hồng_Ngọc_Mai  :":["b41d3ba0-b8d3-4aea-a638-c95cbd5cf7ea"],
  "(24) Giống_Nhội     :":["d47bc13c-c669-44a5-9759-87a04b69519a"],
  // "(25) Tam_Thất_Bắc   :":["5eb99318-6623-42ca-afb6-859ecbe6395e"],
  "(26) Trầu_Bà        :":["610f2e28-eb90-4e1b-95f8-fc1b1bacec9c", "2a0d217a-94b6-469d-b222-859b3c3b61b3"],
  "(28) Vạn_tuế        :":["327efe46-126d-4fa4-9c9f-7566979a9879"],
  // "(29) Đào_đông       :":["238e7d2f-2550-4f11-bf3b-f867bff3921a"],
  "(30) DN_minh_châu   :":["6ba98b04-8a29-4068-9d2f-d838d0e0b52b"],
  // "(31) Cúc_lá_nhám    :":["eecfc2cb-b28c-478b-b432-7e554f44da16"],
  // "(32) Cúc_vạn_thọ    :":["3abea3dd-ec3f-4301-af17-705078262262"],
  // "(33) Lông_vũ          :":["2738fd1d-efde-4bd5-8640-c1e002021b17"],
  // "(34) Chuối_Hoàng_yến:":["bcf58826-80b8-46ef-b55e-37d201ac903a"],
  // "(38) Sâm_đại_hành   :":["74123880-b00c-4e6b-96fe-8a01aae67b62"],
  "(40) Trà bổ tỳ 10 vị:":["a155546e-8e73-43c8-9219-5d088fb337b6"],
  // "(41) Lá mơ lông     :":["56be692b-684a-499e-a437-80d51a5c85cf"],
  // "(44) Cây Cá Vàng    :":["91d8f951-7f9f-4052-bd56-076ac6e937d0"],
  "(45) Dao phát cỏ    :":["7e988fbc-75c3-4e72-b88a-bb71a2425ae3"],
  "(46) Thuốc Sâu Răng :":["d384a212-7b9f-46e4-8716-8e014ac23c8f"],
  // "(47) Cối xay        :":[""],
  // "(49) Bộ chiêu tài   :":["d5e09f2e-7887-4626-b97f-c314aa0d9d37"],
  "(53) Mộc Lan Bầu Đất:":["b7cfeedf-5764-4a68-b84c-4cbdd4a02662"],
  "(60) Lan Vú Nữ      :":["6225d899-7289-4043-93f0-0121cdae0372"],
  "(57) Hồng Trúc Mini :":["fc176dbe-dd4c-4626-a3bd-6740b2c6c738", "15ad2dab-2fce-46ed-a826-e18fc04b75d6", "c2ecfca6-215f-48b8-b91c-74cf87ae5024"],
  "(58) Mộc Lan Cành   :":["d41b22de-b774-4f91-9778-d66b1b8ad2d2","52504be2-4fd5-48e1-bdb2-1f9bedcb35de"],
  "(67) Cây lá lột     :":["cc552245-f1c5-4744-8ae7-1990d4d79376"],
  "(35) Hòn Ngọc Viễn Đ:":["fc620435-b154-4f34-b119-dc9771abcf8a"],
  "(68) Trà bổ khí huyết":["074d56ec-55ca-4a01-a311-176529314b83", "a0407335-ddab-441b-b881-3bec239283c2"],
  "(70) Linh Chi Thảo  :":["35289fc5-7e27-4189-9f17-bad7188e1c90"],
  "(66) Hoàng kỳ       :":["baa23458-e3f4-4a56-8dfd-a5eef9e6b558", "50f4f672-b94d-46e8-9262-874846467388", "8d2051e4-590a-487a-a661-7c1d816660db", "69a1d426-3c1b-4c8b-8d0f-13339b8130b0", "c487c135-e05d-4ba2-b89b-2bc594766c53","2d179017-6d87-4674-b6f9-5991ba306a71", "ef1ebd1d-8637-4f89-9b10-dd7eb93b1385","9ae7eea3-4ebd-4c3d-9dab-be915c56f5ad"],
  // "(69) Cây Đuốc Đỏ    :":["d22f9987-5066-4b6b-8b7f-926c1e8cb1ca"],
  "(73) Lan ZÔ-RÔ      :":["93e35594-3de9-4b38-b8c4-6ae2b90df591","fdbbcad0-36af-4f0e-beb5-d4e76407d313","32cd3245-f329-479c-af61-fd50d9566529"],
  // "(78) Đèn lồng       :":["9c42f1a4-a1c9-4c61-ae76-74653b063fd7]"],
  "(74)Bắp cải Dũng đen:":["555713e5-d294-435a-8bfc-703d2dfc0ef0"],
  "(75)Vịt Quất Dũng Đen:":["d78e2c65-e93e-42a0-bbde-8e1b2f99503e"],
  "(77)Kim giao dũng đen":["ac61731e-e0c4-4a69-951b-84f7b21d632a","8cdb5370-3942-4d83-9a8f-8e5174b32ef4","fd76d735-75aa-4829-ad42-3088596f9fc8"],
  "(80) Dâu tằm sấy khô  :":["c31dc02f-5309-4fe1-879d-7224c05dba9e","1324cc8f-d2ea-4ef8-ac0e-2e5d0eb9a557","669c5412-576a-4a9d-9bdb-e4dd8b7e65a9","dfc9ccc9-3847-492a-b795-f35801a3d3e3"],
  "(79) Bạch Tuyết Mai  :":["ef89b19d-1771-4920-acaa-68d5b45938ae","436bd22f-88f3-469f-958b-0521d7db8b20","9cf2fe24-ee80-47ec-bb8a-1572621d2caf","1f072be2-d6cc-49ba-a64a-497a828d3df1","dbf37cd6-e3e1-4ec9-9ffa-b7a31672cae9"],
  "(81) Cây móng bò khô:":["b21d4c99-c47d-4c04-8f9a-ca2786474e90"],
  "(86) Xích nam       :":["00c5b2b1-8e25-4002-a178-4ce9092384a0"],
  "(87) Hoa Anh Đào    :":["2e5e96e6-60fb-4cd7-a686-66d7df304376"],
};

function loadFixedGroups() {
  productGroups = { ...FIXED_PRODUCT_GROUPS };
  renderGroups();
  saveState();
  setStatus('Đã tải nhóm mẫu thành công!');
}

(function init() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  els.date.value = `${yyyy}-${mm}-${dd}`;
  loadState();
  
  
  renderGroups();
  if (els.gsUrl) {
    els.gsUrl.addEventListener('input', updateExportButtonState);
  }
  if (els.exportNowBtn) {
    els.exportNowBtn.addEventListener('click', exportToGoogleSheets);
  }
  updateExportButtonState();
})();

// Trích xuất số lượng theo product_id từ summaries để xuất sang trang tính
function buildProductQuantityRowsFromSummaries(summaries, dateStr) {
  const rows = [];
  for (const [groupName, s] of Object.entries(summaries || {})) {
    const related = s.related_items || {};
    const allowedIds = new Set((s.product_ids || []).length ? s.product_ids : (productGroups[groupName] || []));
    for (const [productId, info] of Object.entries(related)) {
      if (allowedIds.size > 0 && !allowedIds.has(productId)) continue; // chỉ xuất ID thuộc nhóm
      rows.push({
        date: dateStr,
        group_name: groupName,
        product_id: productId,
        product_name: info.name || '',
        total_quantity: info.total_qty || 0,
      });
    }
  }
  return rows;
}

