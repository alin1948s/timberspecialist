/**
 * TIMBER SPECIALIST S.R.L. - Controller Panou Administrare Comenzi (admin.js)
 * Sortare, Grupare Avansată, Filtrare, Anulare & Gestiune Comenzi Contact
 */

const STATUS_CONFIG = {
  noua: {
    label: 'Comandă Nouă',
    shortLabel: 'Nouă',
    icon: '🟢',
    groupTitle: '🟢 Comenzi Noi — În Așteptare Confirmare',
    priority: 1
  },
  confirmata: {
    label: 'Confirmată / În Lucru',
    shortLabel: 'Confirmată',
    icon: '🔵',
    groupTitle: '🔵 Comenzi Confirmate — În Pregătire / Încărcare',
    priority: 2
  },
  livrata: {
    label: 'Finalizată / Livrată',
    shortLabel: 'Livrată',
    icon: '✅',
    groupTitle: '✅ Comenzi Finalizate & Livrate',
    priority: 3
  },
  anulata: {
    label: 'Comandă Anulată',
    shortLabel: 'Anulată',
    icon: '🔴',
    groupTitle: '🔴 Comenzi Anulate / Arhivate',
    priority: 4
  }
};

function generateOrderId() {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `TS-${new Date().getFullYear()}-${token}`;
}

function classifyProductCategory(productStr) {
  const p = (productStr || '').toLowerCase();
  if (p.includes('mix')) return 'Mix Gorun & Cer Paletizat';
  if (p.includes('en-gros') || p.includes('10 pale')) return 'Comenzi En-Gros (>10 Paleți)';
  if (p.includes('grinzi') || p.includes('elemente masive')) return 'Grinzi & Elemente Masive';
  if (p.includes('podele') || p.includes('dușumea') || p.includes('dusumea')) return 'Podele & Dușumea Masivă';
  if (p.includes('lăturoaie') || p.includes('laturoaie')) return 'Lăturoaie & Capete Paletizate';
  if (p.includes('cer') && !p.includes('gorun')) return 'Lemn de Foc Cer Paletizat';
  if (p.includes('gorun')) return 'Lemn de Foc Gorun Paletizat';
  return 'Lemn de Foc & Cherestea';
}

function estimateOrderValue(productStr, volumeStr) {
  const p = (productStr || '').toLowerCase();
  const v = (volumeStr || '').toLowerCase().replace(',', '.');
  const numMatch = v.match(/(\d+(\.\d+)?)/);
  if (!numMatch) {
    if (p.includes('950')) return 950;
    return 0;
  }
  const qty = parseFloat(numMatch[1]);
  if (isNaN(qty) || qty <= 0) return 0;

  if (p.includes('950') || p.includes('palet') || p.includes('en-gros')) {
    if ((v.includes('mc') || v.includes('m3') || v.includes('metri')) && !v.includes('palet') && !v.includes('paleți')) {
      return Math.round((qty / 2.5) * 950);
    }
    if (p.includes('lăturoaie') || p.includes('laturoaie')) {
      return Math.round(qty * 550);
    }
    return Math.round(qty * 950);
  }
  if (p.includes('podele') || p.includes('dușumea')) {
    return Math.round(qty * 120);
  }
  if (p.includes('grinzi')) {
    if (v.includes('mc') || v.includes('m3')) {
      return Math.round(qty * 2100);
    }
    return Math.round(qty * 235);
  }
  return Math.round(qty * 950);
}

function detectLocality(order) {
  const text = ((order.message || '') + ' ' + (order.name || '')).toLowerCase();
  if (text.includes('someș-odorhei') || text.includes('somes-odorhei') || text.includes('odorhei')) return 'Someș-Odorhei (Depozit / Local)';
  if (text.includes('jibou')) return 'Jibou, jud. Sălaj';
  if (text.includes('zalău') || text.includes('zalau') || text.includes('ortelec')) return 'Zalău, jud. Sălaj';
  if (text.includes('cehu silvaniei') || text.includes('cehu')) return 'Cehu Silvaniei, jud. Sălaj';
  if (text.includes('hida') || text.includes('almaș')) return 'Hida / Valea Almașului, Sălaj';
  if (text.includes('șimleu') || text.includes('simleu')) return 'Șimleu Silvaniei, Sălaj';
  if (text.includes('baia mare') || text.includes('maramureș')) return 'Baia Mare / Maramureș';
  if (text.includes('cluj') || text.includes('dej') || text.includes('gherla')) return 'Cluj / Dej';
  return 'Alte Localități Sălaj & Împrejurimi';
}

document.addEventListener('DOMContentLoaded', async () => {
  const adminApp = document.getElementById('adminApp');
  const loginGate = document.getElementById('adminLoginGate');
  const loginForm = document.getElementById('adminLoginForm');
  const loginPassword = document.getElementById('adminLoginPassword');
  const loginMessage = document.getElementById('adminLoginMessage');
  const loginSubmit = document.getElementById('adminLoginSubmit');

  const setLoginMessage = (message, isError = false) => {
    if (!loginMessage) return;
    loginMessage.textContent = message;
    loginMessage.classList.toggle('is-error', isError);
  };

  try {
    const response = await fetch('admin-auth.php?action=status', { cache: 'no-store' });
    const authState = await response.json();
    if (!response.ok || authState.status !== 'success') {
      throw new Error(authState.message || 'Nu am putut verifica sesiunea.');
    }

    if (!authState.authenticated) {
      if (authState.setupRequired) {
        setLoginMessage('Autentificarea este dezactivată. Configurează secretul TIMBER_ADMIN_PASSWORD în Cloudflare.');
        if (loginPassword) loginPassword.disabled = true;
        if (loginSubmit) loginSubmit.disabled = true;
      } else if (loginForm) {
        setLoginMessage('Introdu parola de administrator pentru a continua.');
        loginForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!loginPassword || !loginSubmit) return;

          loginSubmit.disabled = true;
          setLoginMessage('Verificăm parola…');
          try {
            const loginResponse = await fetch('admin-auth.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'login', password: loginPassword.value })
            });
            const loginResult = await loginResponse.json();
            if (!loginResponse.ok || loginResult.status !== 'success') {
              throw new Error(loginResult.message || 'Autentificarea nu a reușit.');
            }
            loginPassword.value = '';
            window.location.reload();
          } catch (error) {
            setLoginMessage(error.message || 'Nu am putut confirma autentificarea.', true);
            loginSubmit.disabled = false;
          }
        });
      }
      return;
    }
  } catch (error) {
    setLoginMessage('Panoul nu poate contacta serviciul de autentificare. Verifică conexiunea și încearcă din nou.', true);
    if (loginPassword) loginPassword.disabled = true;
    if (loginSubmit) loginSubmit.disabled = true;
    return;
  }

  if (loginGate) loginGate.hidden = true;
  if (adminApp) adminApp.hidden = false;

  const logoutButton = document.getElementById('btnAdminLogout');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      try {
        await fetch('admin-auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' })
        });
      } finally {
        window.location.reload();
      }
    });
  }

  let orders = [];
  let serverOrdersAvailable = false;
  let pendingServerSaves = 0;
  let serverSaveQueue = Promise.resolve();
  let state = {
    statusFilter: 'all',
    categoryFilter: 'all',
    dateFilter: 'all',
    searchQuery: '',
    groupBy: 'date',
    sortBy: 'date_desc',
    viewMode: 'cards',
    collapsedGroups: new Set()
  };

  let pendingCancelOrderId = null;

  // Elemente DOM
  const ordersContainer = document.getElementById('ordersContainer');
  const statusTabsContainer = document.getElementById('statusFilterTabs');
  const searchInput = document.getElementById('searchOrdersInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const groupBySelect = document.getElementById('groupBySelect');
  const sortBySelect = document.getElementById('sortBySelect');
  const filterCategorySelect = document.getElementById('filterCategorySelect');
  const filterDateSelect = document.getElementById('filterDateSelect');
  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');
  const activeFilterSummary = document.getElementById('activeFilterSummary');

  // Modale
  const cancelOrderModal = document.getElementById('cancelOrderModal');
  const cancelModalOrderCode = document.getElementById('cancelModalOrderCode');
  const cancelModalClientName = document.getElementById('cancelModalClientName');
  const cancelReasonInput = document.getElementById('cancelReasonInput');
  const confirmCancelOrderBtn = document.getElementById('confirmCancelOrderBtn');

  const editOrderModal = document.getElementById('editOrderModal');
  const editOrderForm = document.getElementById('editOrderForm');
  const editModalTitle = document.getElementById('editModalTitle');

  // 1. Normalizare comenzi
  function normalizeOrder(o) {
    const prod = o.product || 'Lemn de foc Gorun paletizat ~2.5 mc (950 Lei/palet)';
    const vol = o.volume || '1 palet (~2.5 MC)';
    return {
      id: o.id || generateOrderId(),
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
      name: o.name || 'Client Nespecificat',
      phone: o.phone || '',
      email: o.email || '',
      product: prod,
      category: o.category || classifyProductCategory(prod),
      volume: vol,
      estimatedTotal: typeof o.estimatedTotal === 'number' ? o.estimatedTotal : estimateOrderValue(prod, vol),
      message: o.message || '',
      source: o.source || 'Pagina Contact (contact.html)',
      status: STATUS_CONFIG[o.status] ? o.status : 'noua',
      canceledAt: o.canceledAt || null,
      cancelReason: o.cancelReason || '',
      adminNotes: o.adminNotes || ''
    };
  }

  function saveOrdersToServer() {
    // Comenzile conțin date personale și rămân în baza serverului, nu în browser.
    const snapshot = JSON.stringify({ action: 'sync_all', orders });
    pendingServerSaves += 1;
    serverSaveQueue = serverSaveQueue.then(async () => {
      const response = await fetch('orders_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: snapshot
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result || result.status !== 'success') {
        throw new Error(result.message || 'Comenzile nu au putut fi salvate în baza de date.');
      }
    }).catch(error => {
      console.error('Eroare salvare comenzi pe server:', error);
      showToast('⚠️ Modificarea nu a putut fi salvată pe server. Verifică conexiunea și reîncearcă.');
    }).finally(() => {
      pendingServerSaves = Math.max(0, pendingServerSaves - 1);
    });
  }

  function syncWithServerApi() {
    if (pendingServerSaves > 0) return;
    fetch('orders_api.php')
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data || data.status !== 'success' || !Array.isArray(data.orders)) {
          throw new Error(data.message || 'Nu am putut încărca comenzile de pe server.');
        }
        if (pendingServerSaves > 0) return;
        const wasAlreadySynced = serverOrdersAvailable;
        const knownOrderIds = new Set(orders.map(order => order.id));
        const newOrders = data.orders.filter(order => order && !knownOrderIds.has(order.id));
        serverOrdersAvailable = true;
        orders = data.orders.map(normalizeOrder);
        renderAll();
        if (wasAlreadySynced && newOrders.length > 0) {
          showToast(`🔔 ${newOrders.length === 1 ? 'A sosit o comandă nouă' : `Au sosit ${newOrders.length} comenzi noi`} pe site.`);
        }
      })
      .catch(error => {
        console.warn('Sincronizarea comenzilor a eșuat:', error);
        if (!serverOrdersAvailable) {
          orders = [];
          renderAll();
          showToast('⚠️ Nu am putut încărca lista de comenzi de pe server.');
        }
      });
  }

  // 2. Formatare Date & Timp Relativ
  function formatFullDateTime(isoStr) {
    if (!isoStr) return { dateStr: '-', timeStr: '-', fullStr: '-' };
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return { dateStr: isoStr, timeStr: '', fullStr: isoStr };

    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr} la ora ${timeStr}`
    };
  }

  function getDayKeyAndTitle(isoStr) {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) {
      return { key: '0000-00-00', title: 'Dată Necunoscută' };
    }
    const pad = n => String(n).padStart(2, '0');
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const now = getReferenceNow();
    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const yestKey = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;

    const formattedLong = d.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const capitalizedDate = formattedLong.charAt(0).toUpperCase() + formattedLong.slice(1);

    if (key === todayKey) {
      return { key, title: `Astăzi — ${capitalizedDate}` };
    }
    if (key === yestKey) {
      return { key, title: `Ieri — ${capitalizedDate}` };
    }
    return { key, title: capitalizedDate };
  }

  function getReferenceNow() {
    // Folosește timpul curent sau cea mai recentă dată din comenzi pentru consistență
    return new Date();
  }

  function getRelativeTimeLabel(isoStr) {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const now = getReferenceNow();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin >= 0 && diffMin < 2) return 'Chiar acum';
    if (diffMin >= 2 && diffMin < 60) return `Acum ${diffMin} min`;
    if (diffHours >= 1 && diffHours < 24 && d.getDate() === now.getDate()) return `Astăzi, acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`;
    if (diffDays === 1 || (diffHours < 48 && d.getDate() !== now.getDate())) return 'Ieri';
    if (diffDays > 1 && diffDays <= 30) return `Acum ${diffDays} zile`;
    return d.toLocaleDateString('ro-RO');
  }

  function formatCurrency(val) {
    const n = Number(val) || 0;
    return n.toLocaleString('ro-RO') + ' Lei';
  }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // 3. Filtrare, Sortare & Grupare
  function getFilteredAndSortedOrders() {
    const now = getReferenceNow();
    const pad = n => String(n).padStart(2, '0');
    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const yestKey = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;

    const q = state.searchQuery.trim().toLowerCase();

    const filtered = orders.filter(ord => {
      if (state.statusFilter !== 'all' && ord.status !== state.statusFilter) {
        return false;
      }
      if (state.categoryFilter !== 'all' && ord.category !== state.categoryFilter) {
        return false;
      }
      if (state.dateFilter !== 'all') {
        const d = new Date(ord.createdAt);
        const ordDayKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const diffDays = (now - d) / 86400000;
        if (state.dateFilter === 'today' && ordDayKey !== todayKey) return false;
        if (state.dateFilter === 'yesterday' && ordDayKey !== yestKey) return false;
        if (state.dateFilter === 'last7' && (diffDays < -1 || diffDays > 7)) return false;
        if (state.dateFilter === 'last30' && (diffDays < -1 || diffDays > 30)) return false;
      }
      if (q) {
        const haystack = [
          ord.id,
          ord.name,
          ord.phone,
          ord.email,
          ord.product,
          ord.category,
          ord.volume,
          ord.message,
          ord.adminNotes,
          ord.cancelReason
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;

      switch (state.sortBy) {
        case 'date_asc':
          return timeA - timeB;
        case 'priority': {
          const pA = STATUS_CONFIG[a.status] ? STATUS_CONFIG[a.status].priority : 99;
          const pB = STATUS_CONFIG[b.status] ? STATUS_CONFIG[b.status].priority : 99;
          if (pA !== pB) return pA - pB;
          return timeB - timeA;
        }
        case 'value_desc':
          return (b.estimatedTotal || 0) - (a.estimatedTotal || 0);
        case 'value_asc':
          return (a.estimatedTotal || 0) - (b.estimatedTotal || 0);
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '', 'ro');
        case 'product_asc':
          return (a.product || '').localeCompare(b.product || '', 'ro');
        case 'date_desc':
        default:
          return timeB - timeA;
      }
    });

    return filtered;
  }

  function groupOrders(sortedOrders) {
    const groupsMap = new Map();

    if (state.groupBy === 'none') {
      groupsMap.set('all', {
        key: 'all',
        icon: '📋',
        title: 'Toate Comenzile Afișate',
        items: sortedOrders
      });
      return Array.from(groupsMap.values());
    }

    sortedOrders.forEach(ord => {
      let groupKey = '';
      let groupTitle = '';
      let groupIcon = '📦';

      if (state.groupBy === 'date') {
        const dayInfo = getDayKeyAndTitle(ord.createdAt);
        groupKey = dayInfo.key;
        groupTitle = dayInfo.title;
        groupIcon = '📅';
      } else if (state.groupBy === 'status') {
        const stCfg = STATUS_CONFIG[ord.status] || STATUS_CONFIG.noua;
        groupKey = `${stCfg.priority}_${ord.status}`;
        groupTitle = stCfg.groupTitle;
        groupIcon = stCfg.icon;
      } else if (state.groupBy === 'category') {
        groupKey = ord.category || 'Alte Produse';
        groupTitle = ord.category || 'Alte Produse';
        groupIcon = '🪵';
      } else if (state.groupBy === 'locality') {
        const loc = detectLocality(ord);
        groupKey = loc;
        groupTitle = `Zonă Livrare: ${loc}`;
        groupIcon = '📍';
      }

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          icon: groupIcon,
          title: groupTitle,
          items: []
        });
      }
      groupsMap.get(groupKey).items.push(ord);
    });

    const groupsArray = Array.from(groupsMap.values());

    if (state.groupBy === 'status') {
      groupsArray.sort((a, b) => a.key.localeCompare(b.key));
    } else if (state.groupBy === 'date') {
      if (state.sortBy === 'date_asc') {
        groupsArray.sort((a, b) => a.key.localeCompare(b.key));
      } else {
        groupsArray.sort((a, b) => b.key.localeCompare(a.key));
      }
    }

    return groupsArray;
  }

  // 4. Actualizare KPI & Contoare Tab-uri
  function updateKPIsAndCounts() {
    const total = orders.length;
    const newOrders = orders.filter(o => o.status === 'noua');
    const confirmedOrders = orders.filter(o => o.status === 'confirmata');
    const deliveredOrders = orders.filter(o => o.status === 'livrata');
    const canceledOrders = orders.filter(o => o.status === 'anulata');

    const activeTotalValue = orders
      .filter(o => o.status !== 'anulata')
      .reduce((acc, o) => acc + (Number(o.estimatedTotal) || 0), 0);

    const confirmedAndDeliveredValue = [...confirmedOrders, ...deliveredOrders]
      .reduce((acc, o) => acc + (Number(o.estimatedTotal) || 0), 0);

    document.getElementById('kpiTotalCount').textContent = total;
    document.getElementById('kpiTotalValue').textContent = `Valoare activă: ${formatCurrency(activeTotalValue)}`;

    document.getElementById('kpiNewCount').textContent = newOrders.length;
    document.getElementById('kpiNewMeta').textContent = newOrders.length > 0
      ? `${newOrders.length} ${newOrders.length === 1 ? 'comandă așteaptă' : 'comenzi așteaptă'} confirmare`
      : 'Toate comenzile au fost preluate';

    document.getElementById('kpiConfirmedCount').textContent = confirmedOrders.length + deliveredOrders.length;
    document.getElementById('kpiConfirmedMeta').textContent = `${confirmedOrders.length} în lucru • ${deliveredOrders.length} livrate (${formatCurrency(confirmedAndDeliveredValue)})`;

    document.getElementById('kpiCanceledCount').textContent = canceledOrders.length;
    document.getElementById('kpiCanceledMeta').textContent = canceledOrders.length > 0
      ? `${canceledOrders.length} ${canceledOrders.length === 1 ? 'comandă anulată' : 'comenzi anulate'} în istoric`
      : 'Nicio comandă anulată';

    document.getElementById('tabCountAll').textContent = total;
    document.getElementById('tabCountNoua').textContent = newOrders.length;
    document.getElementById('tabCountConfirmata').textContent = confirmedOrders.length;
    document.getElementById('tabCountLivrata').textContent = deliveredOrders.length;
    document.getElementById('tabCountAnulata').textContent = canceledOrders.length;
  }

  // 5. Randare Card Comandă & Tabel
  function renderOrderCard(ord) {
    const dt = formatFullDateTime(ord.createdAt);
    const relTime = getRelativeTimeLabel(ord.createdAt);
    const st = STATUS_CONFIG[ord.status] || STATUS_CONFIG.noua;
    const cleanPhone = (ord.phone || '').replace(/[^0-9+]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '40' + cleanPhone.slice(1) : cleanPhone.replace('+', '');
    const waText = encodeURIComponent(
      `Bună ziua ${ord.name}, vă contactăm de la TIMBER SPECIALIST S.R.L. (Someș-Odorhei) referitor la comanda #${ord.id} din ${dt.dateStr} pentru ${ord.product} (${ord.volume}).`
    );

    let cancelBannerHtml = '';
    if (ord.status === 'anulata') {
      const cancelDt = ord.canceledAt ? formatFullDateTime(ord.canceledAt).fullStr : dt.fullStr;
      cancelBannerHtml = `
        <div class="order-cancel-banner">
          <div>
            <strong>🔴 Comandă Anulată</strong> la data de <strong>${escapeHTML(cancelDt)}</strong>
            ${ord.cancelReason ? `<br><span><strong>Motiv anulare:</strong> ${escapeHTML(ord.cancelReason)}</span>` : ''}
          </div>
        </div>
      `;
    }

    let actionButtonsHtml = '';
    if (ord.status !== 'anulata') {
      if (ord.status === 'noua') {
        actionButtonsHtml += `
          <button type="button" class="btn-order-act btn-act-confirm" data-action="confirm" data-id="${escapeHTML(ord.id)}">
          &#10003; Confirmă
          </button>
        `;
      }
      if (ord.status === 'noua' || ord.status === 'confirmata') {
        actionButtonsHtml += `
          <button type="button" class="btn-order-act btn-act-deliver" data-action="deliver" data-id="${escapeHTML(ord.id)}">
          &#128666; Marchează livrată
          </button>
        `;
      }
      actionButtonsHtml += `
        <button type="button" class="btn-order-act btn-act-cancel" data-action="open-cancel" data-id="${escapeHTML(ord.id)}">
          &#10005; Anulează
        </button>
      `;
    } else {
      actionButtonsHtml += `
        <button type="button" class="btn-order-act btn-act-restore" data-action="restore" data-id="${escapeHTML(ord.id)}">
          &#8634; Reactivează
        </button>
      `;
    }

    return `
      <article class="order-card status-${escapeHTML(ord.status)}" data-order-id="${escapeHTML(ord.id)}">
        <div class="order-card-top">
          <div class="order-meta-left">
            <span class="order-id-badge">#${escapeHTML(ord.id)}</span>
            <span class="order-datetime-badge" title="Data și ora exactă a înregistrării comenzii">
              📅 ${escapeHTML(dt.dateStr)} &bull; 🕒 ${escapeHTML(dt.timeStr)}
            </span>
            <span class="order-relative-time">(${escapeHTML(relTime)})</span>
            <span class="order-source-tag">${escapeHTML(ord.source)}</span>
          </div>
          <div>
            <span class="status-badge status-${escapeHTML(ord.status)}">
              ${st.icon} ${escapeHTML(st.label)}
            </span>
          </div>
        </div>

        <div class="order-card-grid">
          <div class="order-info-block order-client-block">
            <div class="order-col-label">Client</div>
            <div class="order-client-name">${escapeHTML(ord.name)}</div>
            <div class="order-contact-lines">
              <a href="tel:${escapeHTML(cleanPhone)}" class="order-client-phone">${escapeHTML(ord.phone)}</a>
              ${ord.email ? `<div class="order-client-email">${escapeHTML(ord.email)}</div>` : ''}
            </div>
            <div class="order-client-locality">
              <span aria-hidden="true">⌖</span> ${escapeHTML(detectLocality(ord))}
            </div>
          </div>

          <div class="order-info-block order-product-block">
            <div class="order-col-label">Produs și cantitate</div>
            <div class="order-product-title">${escapeHTML(ord.product)}</div>
            <div class="order-product-cat">
              ${escapeHTML(ord.category)}
            </div>
            <div class="order-volume-row">
              <span class="order-volume-pill">${escapeHTML(ord.volume)}</span>
              <span class="order-price-pill">${escapeHTML(formatCurrency(ord.estimatedTotal))}</span>
            </div>
          </div>

          <div class="order-info-block order-delivery-block">
            <div class="order-col-label">Livrare și mențiuni</div>
            <div class="order-message-box">
              ${escapeHTML(ord.message || 'Nicio mențiune suplimentară.')}
            </div>
            ${ord.adminNotes ? `
              <div class="order-notes-box">
                <strong>Notă internă:</strong> ${escapeHTML(ord.adminNotes)}
              </div>
            ` : ''}
          </div>
        </div>

        ${cancelBannerHtml}

        <div class="order-card-actions">
          <div class="order-actions-left">
            ${actionButtonsHtml}
          </div>
          <div class="order-actions-right">
            <a href="tel:${escapeHTML(cleanPhone)}" class="btn-order-act btn-act-call" title="Apelează telefonic clientul">
              Sună
            </a>
            <a href="https://wa.me/${escapeHTML(waPhone)}?text=${waText}" target="_blank" rel="noopener" class="btn-order-act btn-act-wa" title="Trimite mesaj pe WhatsApp clientului">
              WhatsApp
            </a>
            <button type="button" class="btn-order-act btn-act-edit" data-action="edit" data-id="${escapeHTML(ord.id)}">
              Editează
            </button>
            <details class="order-more-actions">
              <summary class="btn-order-act btn-act-edit">Mai mult</summary>
              <div class="order-more-popover">
                <button type="button" class="btn-order-act btn-act-delete" data-action="delete" data-id="${escapeHTML(ord.id)}" title="Șterge definitiv comanda">Șterge comanda</button>
              </div>
            </details>
          </div>
        </div>
      </article>
    `;
  }

  function renderOrdersTable(items) {
    const rowsHtml = items.map(ord => {
      const dt = formatFullDateTime(ord.createdAt);
      const st = STATUS_CONFIG[ord.status] || STATUS_CONFIG.noua;
      const cleanPhone = (ord.phone || '').replace(/[^0-9+]/g, '');
      const waPhone = cleanPhone.startsWith('0') ? '40' + cleanPhone.slice(1) : cleanPhone.replace('+', '');
      const waText = encodeURIComponent(
        `Bună ziua ${ord.name}, vă contactăm de la TIMBER SPECIALIST S.R.L. (Someș-Odorhei) referitor la comanda #${ord.id} din ${dt.dateStr} pentru ${ord.product} (${ord.volume}).`
      );
      const cancelDt = ord.canceledAt ? formatFullDateTime(ord.canceledAt).fullStr : dt.fullStr;

      return `
        <tr class="row-${escapeHTML(ord.status)}" data-order-id="${escapeHTML(ord.id)}">
          <td data-label="Cod Comandă">
            <span class="order-id-badge">#${escapeHTML(ord.id)}</span>
          </td>
          <td data-label="Data & Ora" style="white-space: nowrap;">
            <div style="font-weight: 800; color: var(--color-brand-forest);">📅 ${escapeHTML(dt.dateStr)}</div>
            <div style="font-size: 0.78rem; color: var(--color-text-muted);">🕒 ${escapeHTML(dt.timeStr)}</div>
          </td>
          <td data-label="Client & Telefon">
            <div style="font-weight: 800;">${escapeHTML(ord.name)}</div>
            <a href="tel:${escapeHTML(cleanPhone)}" style="color: var(--color-timber-amber); font-weight: 700; font-size: 0.82rem;">
              📞 ${escapeHTML(ord.phone)}
            </a>
            ${ord.email ? `<div style="font-size: 0.75rem; color: var(--color-text-muted);">✉️ ${escapeHTML(ord.email)}</div>` : ''}
          </td>
          <td data-label="Produs & Adresă Livrare" class="td-product-col">
            <div style="font-weight: 700; color: var(--color-brand-forest);">${escapeHTML(ord.product)}</div>
            <div style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHTML(ord.message)}</div>
            ${ord.adminNotes ? `<div style="font-size: 0.76rem; color: #1e40af; font-weight: 600;">📌 Notă: ${escapeHTML(ord.adminNotes)}</div>` : ''}
            ${ord.status === 'anulata' ? `<div style="font-size: 0.76rem; color: #b91c1c; font-weight: 700;">🔴 Anulată la ${escapeHTML(cancelDt)}${ord.cancelReason ? ` — Motiv: ${escapeHTML(ord.cancelReason)}` : ''}</div>` : ''}
          </td>
          <td data-label="Cantitate & Total" style="white-space: nowrap;">
            <div style="font-weight: 700;">${escapeHTML(ord.volume)}</div>
            <div style="font-size: 0.8rem; color: #92400e; font-weight: 800;">${escapeHTML(formatCurrency(ord.estimatedTotal))}</div>
          </td>
          <td data-label="Status" style="white-space: nowrap;">
            <span class="status-badge status-${escapeHTML(ord.status)}" style="font-size: 0.74rem; padding: 0.22rem 0.6rem;">
              ${st.icon} ${escapeHTML(st.shortLabel)}
            </span>
          </td>
          <td data-label="Acțiuni Rapide" class="td-actions-col" style="white-space: nowrap;">
            <div class="table-actions-wrap" style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${ord.status === 'noua' ? `<button type="button" class="btn-order-act btn-act-confirm" style="padding:0.3rem 0.55rem; font-size:0.75rem;" data-action="confirm" data-id="${escapeHTML(ord.id)}">Confirmă</button>` : ''}
              ${(ord.status === 'noua' || ord.status === 'confirmata') ? `<button type="button" class="btn-order-act btn-act-deliver" style="padding:0.3rem 0.55rem; font-size:0.75rem;" data-action="deliver" data-id="${escapeHTML(ord.id)}">Livrată</button>` : ''}
              ${ord.status !== 'anulata'
                ? `<button type="button" class="btn-order-act btn-act-cancel" style="padding:0.3rem 0.55rem; font-size:0.75rem;" data-action="open-cancel" data-id="${escapeHTML(ord.id)}">Anulează</button>`
                : `<button type="button" class="btn-order-act btn-act-restore" style="padding:0.3rem 0.55rem; font-size:0.75rem;" data-action="restore" data-id="${escapeHTML(ord.id)}">Reactivează</button>`
              }
              <a href="https://wa.me/${escapeHTML(waPhone)}?text=${waText}" target="_blank" rel="noopener" class="btn-order-act btn-act-wa" style="padding:0.3rem 0.55rem; font-size:0.75rem;" title="Trimite mesaj WhatsApp">💬 WA</a>
              <button type="button" class="btn-order-act btn-act-edit" style="padding:0.3rem 0.55rem; font-size:0.75rem;" data-action="edit" data-id="${escapeHTML(ord.id)}">Editează</button>
              <button type="button" class="btn-order-act btn-act-delete" style="padding:0.3rem 0.55rem; font-size:0.75rem;" data-action="delete" data-id="${escapeHTML(ord.id)}" title="Șterge definitiv comanda">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="admin-orders-table-wrap">
        <table class="admin-orders-table">
          <thead>
            <tr>
              <th>Cod Comandă</th>
              <th>Data &amp; Ora Comenzii</th>
              <th>Client &amp; Telefon</th>
              <th>Produs &amp; Adresă Livrare</th>
              <th>Cantitate &amp; Valoare</th>
              <th>Status</th>
              <th>Acțiuni Rapide</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAll() {
    updateKPIsAndCounts();
    const filteredOrders = getFilteredAndSortedOrders();
    const groups = groupOrders(filteredOrders);

    const groupLabels = {
      date: 'grupate pe zile calendaristice',
      status: 'grupate după statusul comenzii',
      category: 'grupate după categorie produs / esență',
      locality: 'grupate după localitatea de livrare',
      none: 'în listă continuă'
    };

    activeFilterSummary.innerHTML = `
      Afișare <strong>${filteredOrders.length}</strong> din <strong>${orders.length}</strong> comenzi (${groupLabels[state.groupBy] || ''}, în <strong>${groups.length}</strong> ${groups.length === 1 ? 'grup' : 'grupuri'})
    `;

    if (filteredOrders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="admin-empty-state">
          <div style="font-size: 2.4rem; margin-bottom: 0.6rem;">📭</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--color-brand-forest); margin-bottom: 0.4rem;">
            Nicio comandă găsită pentru filtrele selectate
          </h3>
          <p style="font-size: 0.9rem; margin-bottom: 1.2rem;">
            Încercați să resetați filtrele de căutare sau adăugați o comandă nouă din formularul de Contact.
          </p>
          <button type="button" class="btn-order-act btn-act-confirm" id="btnResetFiltersEmpty">
            Resetează Toate Filtrele
          </button>
        </div>
      `;
      const resetBtn = document.getElementById('btnResetFiltersEmpty');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.statusFilter = 'all';
          state.categoryFilter = 'all';
          state.dateFilter = 'all';
          state.searchQuery = '';
          searchInput.value = '';
          clearSearchBtn.style.display = 'none';
          filterCategorySelect.value = 'all';
          filterDateSelect.value = 'all';
          statusTabsContainer.querySelectorAll('.status-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.status === 'all');
          });
          renderAll();
        });
      }
      return;
    }

    const html = groups.map(grp => {
      const isCollapsed = state.collapsedGroups.has(grp.key);
      const groupActiveOrders = grp.items.filter(i => i.status !== 'anulata');
      const groupCanceledCount = grp.items.length - groupActiveOrders.length;
      const groupTotalVal = groupActiveOrders.reduce((acc, i) => acc + (Number(i.estimatedTotal) || 0), 0);

      const bodyContent = state.viewMode === 'table'
        ? renderOrdersTable(grp.items)
        : grp.items.map(renderOrderCard).join('');

      return `
        <section class="order-group-section ${isCollapsed ? 'collapsed' : ''}" data-group-key="${escapeHTML(grp.key)}">
          <header class="order-group-header" data-toggle-group="${escapeHTML(grp.key)}">
            <div class="order-group-title-wrap">
              <div class="order-group-icon">${grp.icon}</div>
              <div>
                <h2 class="order-group-title">${escapeHTML(grp.title)}</h2>
              </div>
            </div>
            <div class="order-group-badges">
              <span class="group-pill">${grp.items.length} ${grp.items.length === 1 ? 'comandă' : 'comenzi'}</span>
              ${groupCanceledCount > 0 ? `<span class="group-pill" style="background:#fee2e2; color:#991b1b;">${groupCanceledCount} ${groupCanceledCount === 1 ? 'anulată' : 'anulate'}</span>` : ''}
              <span class="group-pill group-pill-value">Total grup: ${escapeHTML(formatCurrency(groupTotalVal))}</span>
              <svg class="group-collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </header>
          <div class="order-group-body">
            ${bodyContent}
          </div>
        </section>
      `;
    }).join('');

    ordersContainer.innerHTML = html;
  }

  // 6. Toast Notification
  function showToast(message) {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.innerHTML = `<span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3600);
  }

  // 7. Event Listeners Controale Sortare, Grupare, Filtrare
  statusTabsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.status-tab-btn');
    if (!btn) return;
    state.statusFilter = btn.dataset.status || 'all';
    statusTabsContainer.querySelectorAll('.status-tab-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    renderAll();
  });

  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderAll();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderAll();
  });

  groupBySelect.addEventListener('change', () => {
    state.groupBy = groupBySelect.value;
    state.collapsedGroups.clear();
    renderAll();
  });

  sortBySelect.addEventListener('change', () => {
    state.sortBy = sortBySelect.value;
    renderAll();
  });

  filterCategorySelect.addEventListener('change', () => {
    state.categoryFilter = filterCategorySelect.value;
    renderAll();
  });

  filterDateSelect.addEventListener('change', () => {
    state.dateFilter = filterDateSelect.value;
    renderAll();
  });

  viewCardsBtn.addEventListener('click', () => {
    state.viewMode = 'cards';
    viewCardsBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderAll();
  });

  viewTableBtn.addEventListener('click', () => {
    state.viewMode = 'table';
    viewTableBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    renderAll();
  });

  document.getElementById('btnExpandAllGroups').addEventListener('click', () => {
    state.collapsedGroups.clear();
    renderAll();
  });

  document.getElementById('btnCollapseAllGroups').addEventListener('click', () => {
    document.querySelectorAll('.order-group-section').forEach(sec => {
      if (sec.dataset.groupKey) state.collapsedGroups.add(sec.dataset.groupKey);
    });
    renderAll();
  });

  // 8. Delegare Acțiuni pe Comenzi (Confirmare, Livrare, Anulare, Reactivare, Editare, Ștergere)
  ordersContainer.addEventListener('click', (e) => {
    const toggleHeader = e.target.closest('[data-toggle-group]');
    if (toggleHeader) {
      const gKey = toggleHeader.getAttribute('data-toggle-group');
      if (state.collapsedGroups.has(gKey)) {
        state.collapsedGroups.delete(gKey);
      } else {
        state.collapsedGroups.add(gKey);
      }
      renderAll();
      return;
    }

    const actBtn = e.target.closest('[data-action]');
    if (!actBtn) return;

    const action = actBtn.dataset.action;
    const orderId = actBtn.dataset.id;
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    if (action === 'confirm') {
      ord.status = 'confirmata';
      ord.updatedAt = new Date().toISOString();
      saveOrdersToServer();
      renderAll();
      showToast(`✅ Comanda #${ord.id} (${ord.name}) a fost marcată ca CONFIRMATĂ.`);
    } else if (action === 'deliver') {
      ord.status = 'livrata';
      ord.updatedAt = new Date().toISOString();
      saveOrdersToServer();
      renderAll();
      showToast(`🚚 Comanda #${ord.id} (${ord.name}) a fost marcată ca LIVRATĂ / FINALIZATĂ.`);
    } else if (action === 'open-cancel') {
      pendingCancelOrderId = ord.id;
      cancelModalOrderCode.textContent = '#' + ord.id;
      cancelModalClientName.textContent = `${ord.name} (${ord.product})`;
      cancelReasonInput.value = ord.cancelReason || 'Clientul a renunțat / a amânat livrarea';
      document.querySelectorAll('#cancelReasonChips .reason-chip').forEach(c => c.classList.remove('active'));
      cancelOrderModal.classList.add('open');
    } else if (action === 'restore') {
      ord.status = 'noua';
      ord.canceledAt = null;
      ord.cancelReason = '';
      ord.updatedAt = new Date().toISOString();
      saveOrdersToServer();
      renderAll();
      showToast(`🔄 Comanda #${ord.id} (${ord.name}) a fost REACTIVATĂ.`);
    } else if (action === 'edit') {
      openEditModal(ord);
    } else if (action === 'delete') {
      if (confirm(`Sigur doriți să ștergeți definitiv comanda #${ord.id} (${ord.name})?`)) {
        orders = orders.filter(o => o.id !== ord.id);
        saveOrdersToServer();
        renderAll();
        showToast(`🗑️ Comanda #${ord.id} a fost ștearsă definitiv.`);
      }
    }
  });

  // 9. Modal Anulare Comandă
  document.getElementById('cancelReasonChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.reason-chip');
    if (!chip) return;
    document.querySelectorAll('#cancelReasonChips .reason-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    cancelReasonInput.value = chip.dataset.reason || '';
  });

  confirmCancelOrderBtn.addEventListener('click', () => {
    if (!pendingCancelOrderId) return;
    const ord = orders.find(o => o.id === pendingCancelOrderId);
    if (ord) {
      const nowIso = new Date().toISOString();
      ord.status = 'anulata';
      ord.canceledAt = nowIso;
      ord.cancelReason = cancelReasonInput.value.trim() || 'Anulată din panoul de administrare';
      ord.updatedAt = nowIso;
      saveOrdersToServer();
      renderAll();
      showToast(`🔴 Comanda #${ord.id} (${ord.name}) a fost ANULATĂ.`);
    }
    pendingCancelOrderId = null;
    cancelOrderModal.classList.remove('open');
  });

  // 10. Modal Adăugare / Editare Comandă
  const editStatusSelect = document.getElementById('editStatus');
  const editCancelReasonGroup = document.getElementById('editCancelReasonGroup');
  const editCancelReasonInput = document.getElementById('editCancelReason');
  const editClientEmailInput = document.getElementById('editClientEmail');

  if (editStatusSelect && editCancelReasonGroup) {
    editStatusSelect.addEventListener('change', () => {
      editCancelReasonGroup.style.display = editStatusSelect.value === 'anulata' ? 'block' : 'none';
    });
  }

  function openEditModal(ord = null) {
    const prodSelect = document.getElementById('editProduct');
    if (ord) {
      editModalTitle.textContent = `Editare Comandă #${ord.id}`;
      document.getElementById('editOrderId').value = ord.id;
      document.getElementById('editClientName').value = ord.name;
      document.getElementById('editClientPhone').value = ord.phone;
      if (editClientEmailInput) editClientEmailInput.value = ord.email || '';

      if (prodSelect && ord.product) {
        const hasOption = Array.from(prodSelect.options).some(opt => opt.value === ord.product);
        if (!hasOption) {
          const customOpt = document.createElement('option');
          customOpt.value = ord.product;
          customOpt.textContent = ord.product;
          prodSelect.appendChild(customOpt);
        }
        prodSelect.value = ord.product;
      }

      document.getElementById('editStatus').value = ord.status;
      document.getElementById('editVolume').value = ord.volume;
      document.getElementById('editEstimatedTotal').value = ord.estimatedTotal || 0;
      document.getElementById('editMessage').value = ord.message || '';
      document.getElementById('editAdminNotes').value = ord.adminNotes || '';
      if (editCancelReasonInput) editCancelReasonInput.value = ord.cancelReason || '';
      if (editCancelReasonGroup) editCancelReasonGroup.style.display = ord.status === 'anulata' ? 'block' : 'none';
    } else {
      editModalTitle.textContent = 'Adaugă Comandă Nouă (Telefonic / Depozit)';
      document.getElementById('editOrderId').value = '';
      document.getElementById('editClientName').value = '';
      document.getElementById('editClientPhone').value = '';
      if (editClientEmailInput) editClientEmailInput.value = '';
      if (prodSelect) prodSelect.selectedIndex = 0;
      document.getElementById('editStatus').value = 'noua';
      document.getElementById('editVolume').value = '2 paleți (~5 MC)';
      document.getElementById('editEstimatedTotal').value = 1900;
      document.getElementById('editMessage').value = '';
      document.getElementById('editAdminNotes').value = '';
      if (editCancelReasonInput) editCancelReasonInput.value = '';
      if (editCancelReasonGroup) editCancelReasonGroup.style.display = 'none';
    }
    editOrderModal.classList.add('open');
  }

  document.getElementById('btnAddManualOrder').addEventListener('click', () => {
    openEditModal(null);
  });

  document.getElementById('editProduct').addEventListener('change', updateModalEstimate);
  document.getElementById('editVolume').addEventListener('input', updateModalEstimate);

  function updateModalEstimate() {
    const prod = document.getElementById('editProduct').value;
    const vol = document.getElementById('editVolume').value;
    const est = estimateOrderValue(prod, vol);
    if (est > 0) {
      document.getElementById('editEstimatedTotal').value = est;
    }
  }

  editOrderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idVal = document.getElementById('editOrderId').value.trim();
    const nameVal = document.getElementById('editClientName').value.trim();
    const phoneVal = document.getElementById('editClientPhone').value.trim();
    const emailVal = editClientEmailInput ? editClientEmailInput.value.trim() : '';
    const prodVal = document.getElementById('editProduct').value;
    const statusVal = document.getElementById('editStatus').value;
    const volVal = document.getElementById('editVolume').value.trim() || '1 palet';
    const totalVal = Number(document.getElementById('editEstimatedTotal').value) || 0;
    const msgVal = document.getElementById('editMessage').value.trim();
    const notesVal = document.getElementById('editAdminNotes').value.trim();
    const reasonVal = editCancelReasonInput ? editCancelReasonInput.value.trim() : '';
    const nowIso = new Date().toISOString();

    if (!nameVal || !phoneVal) {
      alert('Completați numele și telefonul clientului!');
      return;
    }

    if (idVal) {
      const existing = orders.find(o => o.id === idVal);
      if (existing) {
        existing.name = nameVal;
        existing.phone = phoneVal;
        existing.email = emailVal;
        existing.product = prodVal;
        existing.category = classifyProductCategory(prodVal);
        existing.status = statusVal;
        existing.volume = volVal;
        existing.estimatedTotal = totalVal;
        existing.message = msgVal;
        existing.adminNotes = notesVal;
        existing.updatedAt = nowIso;
        if (statusVal === 'anulata') {
          if (!existing.canceledAt) existing.canceledAt = nowIso;
          existing.cancelReason = reasonVal || existing.cancelReason || 'Anulată la editare în panoul admin';
        } else {
          existing.canceledAt = null;
          existing.cancelReason = '';
        }
        showToast(`✅ Comanda #${existing.id} a fost actualizată.`);
      }
    } else {
      const newOrder = normalizeOrder({
        id: generateOrderId(),
        createdAt: nowIso,
        updatedAt: nowIso,
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        product: prodVal,
        category: classifyProductCategory(prodVal),
        volume: volVal,
        estimatedTotal: totalVal,
        message: msgVal || 'Comandă preluată telefonic în dispecerat',
        source: 'Panou Admin / Telefon (0783 046 620)',
        status: statusVal,
        canceledAt: statusVal === 'anulata' ? nowIso : null,
        cancelReason: statusVal === 'anulata' ? (reasonVal || 'Anulată la înregistrare') : '',
        adminNotes: notesVal
      });
      orders.unshift(newOrder);
      showToast(`✅ Comanda nouă #${newOrder.id} (${newOrder.name}) a fost adăugată.`);
    }

    saveOrdersToServer();
    editOrderModal.classList.remove('open');
    renderAll();
  });

  // Închidere modale
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      const modal = document.getElementById(targetId);
      if (modal) modal.classList.remove('open');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal-backdrop')) {
      e.target.classList.remove('open');
    }
  });

  // 11. Export CSV, Print & Reset Demo
  document.getElementById('btnExportCsv').addEventListener('click', () => {
    const list = getFilteredAndSortedOrders();
    const headers = ['Cod Comanda', 'Data Comenzii', 'Ora Comenzii', 'Status', 'Client / Societate', 'Telefon', 'Categorie Produs', 'Produs Solicitat', 'Cantitate', 'Valoare Estimata (Lei)', 'Localitate / Adresa / Mentiuni', 'Notite Admin', 'Motiv Anulare'];

    const rows = list.map(o => {
      const dt = formatFullDateTime(o.createdAt);
      const st = STATUS_CONFIG[o.status] ? STATUS_CONFIG[o.status].shortLabel : o.status;
      return [
        o.id,
        dt.dateStr,
        dt.timeStr,
        st,
        o.name,
        o.phone,
        o.category,
        o.product,
        o.volume,
        o.estimatedTotal || 0,
        (o.message || '').replace(/\r?\n/g, ' '),
        (o.adminNotes || '').replace(/\r?\n/g, ' '),
        (o.cancelReason || '').replace(/\r?\n/g, ' ')
      ].map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comenzi_TimberSpecialist_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📥 Tabelul de comenzi a fost exportat în format CSV (Excel).');
  });

  document.getElementById('btnPrintOrders').addEventListener('click', () => {
    window.print();
  });

  // Pornire inițială
  renderAll();
  syncWithServerApi();
  window.setInterval(syncWithServerApi, 30000);
});
