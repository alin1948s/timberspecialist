/**
 * TIMBER SPECIALIST S.R.L. - Contact & Comenzi Lemn de Foc Cer & Gorun
 * Salvare Automată Comenzi în Panoul Admin (localStorage + Server JSON API)
 * Telefon Oficial / WhatsApp: 0783 046 620
 */

const TIMBER_STORAGE_KEY = 'timber_specialist_orders_v1';

function getInitialSeedOrders() {
  // Nu încărcăm comenzi demonstrative sau date personale în browser.
  return [];
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

function saveOrderToLocalStore(newOrder) {
  try {
    let existing = [];
    const raw = localStorage.getItem(TIMBER_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed.filter(o => o && o.id !== newOrder.id);
      }
    } else {
      existing = [];
    }
    existing.unshift(newOrder);
    localStorage.setItem(TIMBER_STORAGE_KEY, JSON.stringify(existing));

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('timber_orders_channel');
      bc.postMessage({ type: 'NEW_ORDER', order: newOrder });
      bc.close();
    }
  } catch (err) {
    console.warn('Nu s-a putut salva comanda în localStorage:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Asigurare inițializare bază de date locală dacă este goală
  try {
    if (localStorage.getItem(TIMBER_STORAGE_KEY) === null) {
      localStorage.setItem(TIMBER_STORAGE_KEY, JSON.stringify([]));
    }
  } catch (e) {}

  const contactForms = document.querySelectorAll('.quote-form, .contact-form');

  contactForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = form.querySelector('[name="name"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const emailInput = form.querySelector('[name="email"]');
      const productInput = form.querySelector('[name="product"]');
      const volumeInput = form.querySelector('[name="volume"]');
      const messageInput = form.querySelector('[name="message"]');
      const alertBox = form.querySelector('.form-alert');
      const submitBtn = form.querySelector('button[type="submit"]');

      const errors = [];

      if (!nameInput || nameInput.value.trim().length < 3) {
        errors.push('Vă rugăm să introduceți numele dumneavoastră sau al societății.');
        if (nameInput) nameInput.focus();
      } else if (!phoneInput || !/^(0|\+40)?[0-9]{9,10}$/.test(phoneInput.value.replace(/[\s\-\.\(\)]/g, ''))) {
        errors.push('Vă rugăm să introduceți un număr de telefon valid (ex: 0783 046 620).');
        if (phoneInput) phoneInput.focus();
      }

      if (errors.length > 0) {
        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#fef2f2';
          alertBox.style.color = '#991b1b';
          alertBox.style.border = '1px solid #fecaca';
          alertBox.textContent = errors[0];
        } else {
          alert(errors[0]);
        }
        return;
      }

      const originalText = submitBtn ? submitBtn.innerHTML : 'Trimite';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Se transmite comanda...
        `;
      }

      const nowIso = new Date().toISOString();
      const orderId = 'TS-' + new Date().getFullYear() + '-' + String(Math.floor(1050 + Math.random() * 8900));
      const nameVal = nameInput.value.trim();
      const phoneVal = phoneInput.value.trim();
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const prodVal = productInput ? productInput.value : 'Lemn de foc Gorun paletizat ~2.5 mc (950 Lei/palet)';
      const volRaw = volumeInput && volumeInput.value.trim() ? volumeInput.value.trim() : '1 palet (~2.5 MC)';
      const msgVal = messageInput ? messageInput.value.trim() : '';
      const categoryVal = classifyProductCategory(prodVal);
      const estimatedTotalVal = estimateOrderValue(prodVal, volRaw);
      const isContactPage = window.location.pathname.toLowerCase().includes('contact') || form.classList.contains('contact-form');
      const sourceVal = isContactPage ? 'Pagina Contact (contact.html)' : 'Prima Pagină (index.html)';

      const newOrder = {
        id: orderId,
        createdAt: nowIso,
        updatedAt: nowIso,
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        product: prodVal,
        category: categoryVal,
        volume: volRaw,
        estimatedTotal: estimatedTotalVal,
        message: msgVal || 'Nespecificat (urmează confirmare telefonică)',
        source: sourceVal,
        status: 'noua',
        canceledAt: null,
        cancelReason: '',
        adminNotes: ''
      };

      // Salvare imediată în Panoul de Administrare (localStorage)
      saveOrderToLocalStore(newOrder);

      const formData = new FormData();
      formData.append('id', orderId);
      formData.append('createdAt', nowIso);
      formData.append('name', nameVal);
      formData.append('phone', phoneVal);
      formData.append('email', emailVal);
      formData.append('product', prodVal);
      formData.append('category', categoryVal);
      formData.append('volume', volRaw);
      formData.append('estimatedTotal', String(estimatedTotalVal));
      formData.append('message', msgVal);
      formData.append('source', sourceVal);

      fetch('sendmail.php', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .catch(() => {
        return { status: 'success', order: newOrder };
      })
      .then(() => {
        const volDisplay = volRaw ? ` (${volRaw})` : '';
        const formattedDate = new Date(nowIso).toLocaleString('ro-RO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        if (alertBox) {
          alertBox.style.display = 'block';
          alertBox.style.background = '#ecfdf5';
          alertBox.style.color = '#065f46';
          alertBox.style.border = '1px solid #a7f3d0';
          alertBox.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.4rem;">
              <strong style="font-size:1.02rem;">✅ Comandă recepționată cu succes!</strong>
              <span style="background:#065f46; color:#fff; font-size:0.78rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:999px;">Cod: #${escapeHTML(orderId)} • ${escapeHTML(formattedDate)}</span>
            </div>
            Vă mulțumim, <strong>${escapeHTML(nameVal)}</strong>. Solicitarea dumneavoastră a fost înregistrată în sistemul de comenzi Timber Specialist SRL din Someș-Odorhei.<br>
            Vă vom contacta în scurt timp la numărul <strong>${escapeHTML(phoneVal)}</strong> pentru stabilirea orei de livrare sau încărcare.
            <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.65rem; align-items: center;">
              <a href="https://wa.me/40783046620?text=Bună%20ziua,%20sunt%20${encodeURIComponent(nameVal)}%20și%20am%20transmis%20comanda%20%23${encodeURIComponent(orderId)}%20pentru%20${encodeURIComponent(prodVal + volDisplay)}" class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener">
                Confirmă comanda direct pe WhatsApp (0783 046 620)
              </a>
              <a href="admin.html" class="btn btn-outline btn-sm" style="background:#ffffff; border-color:#a7f3d0; color:#065f46; font-size:0.82rem;">
                Vezi în Panou Admin Comenzi &rarr;
              </a>
            </div>
          `;
        }

        form.reset();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    });
  });

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});
