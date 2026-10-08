/**
 * TIMBER SPECIALIST S.R.L. - JavaScript Principal (2026 Production)
 * Lemn de Foc Gorun & Cer Paletizat ~2.5 MC • Someș-Odorhei, Sălaj
 * Telefon: 0783 046 620
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Meniu Mobil Off-Canvas Drawer & Overlay
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // Asigurare Nav Overlay pentru tap-to-close
  let navOverlay = document.getElementById('navOverlay');
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.id = 'navOverlay';
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);
  }

  function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.classList.remove('drawer-open');
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-label', 'Deschide meniul');
      mobileToggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>`;
    }
  }

  function openMenu() {
    if (!navMenu) return;
    navMenu.classList.add('open');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.classList.add('drawer-open');
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileToggle.setAttribute('aria-label', 'Închide meniul');
      mobileToggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
    }
  }

  if (mobileToggle && navMenu) {
    // Injectare CTA rapid în interiorul sertarului mobil (Drawer)
    if (!navMenu.querySelector('.mobile-drawer-cta')) {
      const drawerCta = document.createElement('li');
      drawerCta.className = 'mobile-drawer-cta';
      drawerCta.innerHTML = `
        <a href="tel:0783046620" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          Sună: 0783 046 620
        </a>
        <a href="https://wa.me/40783046620?text=Bună%20ziua,%20doresc%20să%20comand%20lemn%20de%20foc%20gorun/cer%20paletizat." class="btn btn-whatsapp btn-sm" style="width: 100%; justify-content: center;" target="_blank" rel="noopener">
          Comandă pe WhatsApp
        </a>
        <a href="index.html#calculator" class="btn btn-outline btn-sm drawer-calc-link" style="width: 100%; justify-content: center;">
          Calculator Preț &amp; Volum
        </a>
      `;
      navMenu.appendChild(drawerCta);
    }

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navMenu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (navOverlay) {
      navOverlay.addEventListener('click', closeMenu);
    }

    const navLinks = navMenu.querySelectorAll('.nav-link, .mobile-drawer-cta a');
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && navMenu.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // Injectare Automată Mobile Bottom Action Bar (pe telefoane)
  if (!document.querySelector('.mobile-bottom-bar')) {
    const bottomBar = document.createElement('nav');
    bottomBar.className = 'mobile-bottom-bar';
    bottomBar.setAttribute('aria-label', 'Acțiuni rapide mobil');
    bottomBar.innerHTML = `
      <a href="tel:0783046620" class="mobile-bar-item call-action" aria-label="Apelează numărul de contact">
        <div class="mobile-bar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </div>
        <span class="mobile-bar-label">Sună</span>
      </a>
      <a href="https://wa.me/40783046620?text=Bună%20ziua,%20doresc%20o%20ofertă%20de%20preț%20pentru%20lemn%20de%20foc%20/%20grinzi." class="mobile-bar-item wa-action" target="_blank" rel="noopener" aria-label="Mesaj WhatsApp">
        <div class="mobile-bar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
        </div>
        <span class="mobile-bar-label">WhatsApp</span>
      </a>
      <a href="index.html#calculator" class="mobile-bar-item calc-action" aria-label="Calculator volum și cost">
        <div class="mobile-bar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"></path></svg>
        </div>
        <span class="mobile-bar-label">Calculator</span>
      </a>
      <a href="contact.html" class="mobile-bar-item map-action" aria-label="Hartă și contact Someș-Odorhei">
        <div class="mobile-bar-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        <span class="mobile-bar-label">Contact</span>
      </a>
    `;
    document.body.appendChild(bottomBar);
  }

  // 2. Efect Umbră Header la Scroll
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        siteHeader.classList.add('header-scrolled');
      } else {
        siteHeader.classList.remove('header-scrolled');
      }
    });
  }

  // 3. Calculator Interactiv: Taburi Paleți Lemn Foc, Grinzi Masive & Podele
  const calcSection = document.getElementById('calculator');
  const tabPaletiBtn = document.getElementById('tabPaletiBtn');
  const tabGrinziBtn = document.getElementById('tabGrinziBtn');
  const tabPodeleBtn = document.getElementById('tabPodeleBtn');
  const panelPaleti = document.getElementById('panelPaleti');
  const panelGrinzi = document.getElementById('panelGrinzi');
  const panelPodele = document.getElementById('panelPodele');

  function pulseResultBox(panelEl) {
    if (!panelEl) return;
    const box = panelEl.querySelector('.calc-result-box');
    if (!box) return;
    box.classList.add('calc-updated');
    clearTimeout(box._pulseTimer);
    box._pulseTimer = setTimeout(() => {
      box.classList.remove('calc-updated');
    }, 280);
  }

  function syncQuickChips(inputId, valStr) {
    const wrapper = document.querySelector(`.quick-mp-wrapper[data-quick-for="${inputId}"]`);
    if (!wrapper) return;
    wrapper.querySelectorAll('.quick-mp-btn').forEach(btn => {
      const btnVal = btn.getAttribute('data-val') || btn.getAttribute('data-mp');
      if (String(btnVal) === String(valStr)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function switchCalcTab(tabName) {
    [tabPaletiBtn, tabGrinziBtn, tabPodeleBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });
    [panelPaleti, panelGrinzi, panelPodele].forEach(panel => {
      if (panel) panel.classList.remove('active');
    });

    if (tabName === 'grinzi') {
      if (tabGrinziBtn) {
        tabGrinziBtn.classList.add('active');
        tabGrinziBtn.setAttribute('aria-selected', 'true');
      }
      if (panelGrinzi) panelGrinzi.classList.add('active');
    } else if (tabName === 'podele') {
      if (tabPodeleBtn) {
        tabPodeleBtn.classList.add('active');
        tabPodeleBtn.setAttribute('aria-selected', 'true');
      }
      if (panelPodele) panelPodele.classList.add('active');
    } else {
      if (tabPaletiBtn) {
        tabPaletiBtn.classList.add('active');
        tabPaletiBtn.setAttribute('aria-selected', 'true');
      }
      if (panelPaleti) panelPaleti.classList.add('active');
    }
  }

  // Expose to window for button onclick triggers
  window.switchCalcTab = switchCalcTab;

  function handleCalcHash(hashStr, shouldScroll = false) {
    if (!hashStr) return;
    let targetTab = null;
    if (hashStr.includes('#calculatorGrinzi')) {
      targetTab = 'grinzi';
    } else if (hashStr.includes('#calculatorPodele')) {
      targetTab = 'podele';
    } else if (hashStr.includes('#calculatorPaleti') || hashStr.includes('#calculator')) {
      targetTab = 'paleti';
    }
    if (targetTab) {
      switchCalcTab(targetTab);
      if (shouldScroll && calcSection) {
        calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  if (tabPaletiBtn || tabGrinziBtn || tabPodeleBtn) {
    if (tabPaletiBtn) tabPaletiBtn.addEventListener('click', () => switchCalcTab('paleti'));
    if (tabGrinziBtn) tabGrinziBtn.addEventListener('click', () => switchCalcTab('grinzi'));
    if (tabPodeleBtn) tabPodeleBtn.addEventListener('click', () => switchCalcTab('podele'));

    // Check hash on load or hashchange
    if (window.location.hash && window.location.hash.includes('#calculator')) {
      handleCalcHash(window.location.hash, true);
    }
    window.addEventListener('hashchange', () => {
      handleCalcHash(window.location.hash, true);
    });

    // Intercept any in-page links pointing to #calculator* so clicking them always switches tab & scrolls
    document.querySelectorAll('a[href*="#calculator"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        const isSamePage = href.startsWith('#') || window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
        if (isSamePage && calcSection) {
          e.preventDefault();
          const hashPart = href.substring(href.indexOf('#'));
          if (history.replaceState) {
            history.replaceState(null, '', hashPart);
          }
          handleCalcHash(hashPart, true);
        }
      });
    });
  }

  function scrollToAndHighlightQuoteForm() {
    const quoteBox = document.querySelector('#comanda .quote-box') || document.getElementById('gorunQuoteForm') || document.getElementById('comanda');
    const qProduct = document.getElementById('qProduct');
    const qPallets = document.getElementById('qPallets');

    if (quoteBox) {
      quoteBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    [qProduct, qPallets].forEach(el => {
      if (!el) return;
      el.classList.add('input-prefilled-flash');
      clearTimeout(el._flashTimer);
      el._flashTimer = setTimeout(() => {
        el.classList.remove('input-prefilled-flash');
      }, 1800);
    });
  }

  // 3A. Calculator Paleți Lemn de Foc Cer & Gorun
  const calcNrPaleti = document.getElementById('calcNrPaleti');
  const calcEsenta = document.getElementById('calcEsenta');
  const resPretTotal = document.getElementById('resPretTotal');
  const resVolumTotal = document.getElementById('resVolumTotal');
  const resNumarPaleti = document.getElementById('resNumarPaleti');
  const resGreutate = document.getElementById('resGreutate');
  const btnPaletiWa = document.getElementById('btnPaletiWa');
  const btnPaletiFormular = document.getElementById('btnPaletiFormular');

  function calculatePallets() {
    if (!calcNrPaleti || !resPretTotal) return;

    const rawVal = parseInt(calcNrPaleti.value, 10);
    const paleti = (!isNaN(rawVal) && rawVal > 0) ? Math.min(rawVal, 200) : 1;
    const pretPerPalet = 950; // LEI per palet (~2.5 mc)

    const pretTotal = paleti * pretPerPalet;
    const volumTotal = (paleti * 2.5).toFixed(1);

    // Gorun / Cer densitate medie uscată: ~720 - 800 kg/mc => ~1.800 kg / palet de 2.5 mc
    const greutateTotala = paleti * 1800;

    resPretTotal.textContent = pretTotal.toLocaleString('ro-RO');
    if (resVolumTotal) resVolumTotal.textContent = `Volum total: ~${volumTotal} MC`;
    if (resNumarPaleti) resNumarPaleti.textContent = `${paleti} ${paleti === 1 ? 'palet' : 'paleți'}`;
    if (resGreutate) resGreutate.textContent = `~ ${greutateTotala.toLocaleString('ro-RO')} kg`;

    syncQuickChips('calcNrPaleti', paleti);
    pulseResultBox(panelPaleti);

    if (btnPaletiWa) {
      const esentaText = calcEsenta ? calcEsenta.options[calcEsenta.selectedIndex].text.split(' - ')[0] : 'Gorun / Cer';
      const waMsg = `Bună ziua! Doresc o ofertă pentru ${paleti} ${paleti === 1 ? 'palet' : 'paleți'} de lemn de foc (${esentaText}), volum ~${volumTotal} MC (~${pretTotal.toLocaleString('ro-RO')} Lei). Mulțumesc!`;
      btnPaletiWa.href = `https://wa.me/40783046620?text=${encodeURIComponent(waMsg)}`;
    }
  }

  if (calcNrPaleti) {
    calcNrPaleti.addEventListener('input', calculatePallets);
    calcNrPaleti.addEventListener('change', () => {
      let val = parseInt(calcNrPaleti.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 200) val = 200;
      calcNrPaleti.value = val;
      calculatePallets();
    });
    if (calcEsenta) {
      calcEsenta.addEventListener('change', calculatePallets);
    }
    calculatePallets();
  }

  if (btnPaletiFormular) {
    btnPaletiFormular.addEventListener('click', (e) => {
      e.preventDefault();
      const qProduct = document.getElementById('qProduct');
      const qPallets = document.getElementById('qPallets');
      const esentaVal = calcEsenta ? calcEsenta.value : 'gorun';

      if (qProduct) {
        for (let i = 0; i < qProduct.options.length; i++) {
          const optText = qProduct.options[i].value.toLowerCase();
          if (esentaVal === 'cer' && optText.includes('lemn de foc cer')) {
            qProduct.selectedIndex = i;
            break;
          } else if (esentaVal === 'mix' && optText.includes('mix gorun')) {
            qProduct.selectedIndex = i;
            break;
          } else if (esentaVal === 'gorun' && optText.includes('lemn de foc gorun')) {
            qProduct.selectedIndex = i;
            break;
          }
        }
      }
      if (qPallets && calcNrPaleti) {
        const rawVal = parseInt(calcNrPaleti.value, 10);
        const paleti = (!isNaN(rawVal) && rawVal > 0) ? Math.min(rawVal, 200) : 1;
        calcNrPaleti.value = paleti;
        calculatePallets();
        const volumTotal = (paleti * 2.5).toFixed(1);
        qPallets.value = `${paleti} ${paleti === 1 ? 'palet' : 'paleți'}`;
        const qAddress = document.getElementById('qAddress');
        if (qAddress && (!qAddress.value.trim() || qAddress.dataset.autoPrefilled === 'true')) {
          qAddress.value = `Comandă ${paleti} ${paleti === 1 ? 'palet' : 'paleți'} (~${volumTotal} MC, ${(paleti * 950).toLocaleString('ro-RO')} Lei). Localitate livrare: `;
          qAddress.dataset.autoPrefilled = 'true';
        }
      }
      scrollToAndHighlightQuoteForm();
    });
  }

  // 3B. Calculator Grinzi & Cherestea Masivă Cer / Gorun
  const calcGrinziEsenta = document.getElementById('calcGrinziEsenta');
  const calcGrinziSectiune = document.getElementById('calcGrinziSectiune');
  const calcGrinziLungime = document.getElementById('calcGrinziLungime');
  const calcGrinziBucati = document.getElementById('calcGrinziBucati');

  const resGrinziVolum = document.getElementById('resGrinziVolum');
  const resGrinziMl = document.getElementById('resGrinziMl');
  const resGrinziDimensiuni = document.getElementById('resGrinziDimensiuni');
  const resGrinziBucati = document.getElementById('resGrinziBucati');
  const resGrinziGreutate = document.getElementById('resGrinziGreutate');
  const resGrinziEsenta = document.getElementById('resGrinziEsenta');
  const btnGrinziWa = document.getElementById('btnGrinziWa');
  const btnGrinziFormular = document.getElementById('btnGrinziFormular');

  const sectiuneArii = {
    '10x10': 0.0100,
    '10x12': 0.0120,
    '10x15': 0.0150,
    '12x12': 0.0144,
    '12x15': 0.0180,
    '15x15': 0.0225,
    '15x20': 0.0300,
    '20x20': 0.0400,
    '25x25': 0.0625
  };

  function calculateBeams() {
    if (!calcGrinziSectiune || !resGrinziVolum) return;

    const sectiuneKey = calcGrinziSectiune.value;
    const arieM2 = sectiuneArii[sectiuneKey] || 0.0225;
    const lungime = parseFloat(calcGrinziLungime.value) || 4;
    const rawBuc = parseInt(calcGrinziBucati.value, 10);
    const bucati = (!isNaN(rawBuc) && rawBuc > 0) ? Math.min(rawBuc, 500) : 1;
    const esenta = calcGrinziEsenta ? calcGrinziEsenta.value : 'Gorun';

    const volumTotal = (arieM2 * lungime * bucati).toFixed(2);
    const metriLiniari = (lungime * bucati).toFixed(0);
    const greutate = Math.round(parseFloat(volumTotal) * 850);
    const sectiuneText = sectiuneKey.replace('x', '×');

    resGrinziVolum.textContent = volumTotal;
    if (resGrinziMl) resGrinziMl.textContent = `Total: ${metriLiniari} metri liniari`;
    if (resGrinziDimensiuni) resGrinziDimensiuni.textContent = `${sectiuneText} cm × ${lungime}m`;
    if (resGrinziBucati) resGrinziBucati.textContent = `${bucati} ${bucati === 1 ? 'bucată' : 'bucăți'}`;
    if (resGrinziGreutate) resGrinziGreutate.textContent = `~ ${greutate.toLocaleString('ro-RO')} kg`;
    if (resGrinziEsenta) resGrinziEsenta.textContent = esenta;

    syncQuickChips('calcGrinziBucati', bucati);
    pulseResultBox(panelGrinzi);

    if (btnGrinziWa) {
      const waMsg = `Bună ziua! Doresc o ofertă de preț pentru ${bucati} bucăți grinzi ${esenta}, secțiune ${sectiuneText} cm, lungime ${lungime}m (Volum total: ~${volumTotal} MC, ${metriLiniari} ml). Mulțumesc!`;
      btnGrinziWa.href = `https://wa.me/40783046620?text=${encodeURIComponent(waMsg)}`;
    }
  }

  if (calcGrinziSectiune) {
    calcGrinziSectiune.addEventListener('change', calculateBeams);
    if (calcGrinziLungime) calcGrinziLungime.addEventListener('change', calculateBeams);
    if (calcGrinziBucati) {
      calcGrinziBucati.addEventListener('input', calculateBeams);
      calcGrinziBucati.addEventListener('change', () => {
        let val = parseInt(calcGrinziBucati.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 500) val = 500;
        calcGrinziBucati.value = val;
        calculateBeams();
      });
    }
    if (calcGrinziEsenta) calcGrinziEsenta.addEventListener('change', calculateBeams);
    calculateBeams();
  }

  if (btnGrinziFormular) {
    btnGrinziFormular.addEventListener('click', (e) => {
      e.preventDefault();
      const qProduct = document.getElementById('qProduct');
      const qPallets = document.getElementById('qPallets');

      if (qProduct) {
        for (let i = 0; i < qProduct.options.length; i++) {
          if (qProduct.options[i].value.includes('Grinzi')) {
            qProduct.selectedIndex = i;
            break;
          }
        }
      }
      if (qPallets && calcGrinziBucati && calcGrinziSectiune && calcGrinziLungime) {
        const rawBuc = parseInt(calcGrinziBucati.value, 10);
        const bucati = (!isNaN(rawBuc) && rawBuc > 0) ? Math.min(rawBuc, 500) : 1;
        calcGrinziBucati.value = bucati;
        calculateBeams();
        const esenta = calcGrinziEsenta ? calcGrinziEsenta.value : 'Gorun';
        const sectiuneKey = calcGrinziSectiune.value.replace('x', '×');
        qPallets.value = `${bucati} ${bucati === 1 ? 'bucată' : 'bucăți'}`;
        const qAddress = document.getElementById('qAddress');
        if (qAddress && (!qAddress.value.trim() || qAddress.dataset.autoPrefilled === 'true')) {
          qAddress.value = `Grinzi ${esenta}: ${bucati} buc × ${sectiuneKey} cm × ${calcGrinziLungime.value}m (~${resGrinziVolum.textContent} MC). Localitate livrare: `;
          qAddress.dataset.autoPrefilled = 'true';
        }
      }
      scrollToAndHighlightQuoteForm();
    });
  }

  // 3C. Calculator Podele & Dușumea Masivă Cer / Gorun
  const calcPodeleEsenta = document.getElementById('calcPodeleEsenta');
  const calcPodeleGrosime = document.getElementById('calcPodeleGrosime');
  const calcPodeleMarja = document.getElementById('calcPodeleMarja');
  const calcPodeleMp = document.getElementById('calcPodeleMp');

  const resPodeleTotalMp = document.getElementById('resPodeleTotalMp');
  const resPodeleVolum = document.getElementById('resPodeleVolum');
  const resPodeleNetMp = document.getElementById('resPodeleNetMp');
  const resPodeleGrosimeText = document.getElementById('resPodeleGrosimeText');
  const resPodeleMl = document.getElementById('resPodeleMl');
  const resPodeleGreutate = document.getElementById('resPodeleGreutate');
  const resPodeleEsenta = document.getElementById('resPodeleEsenta');
  const btnPodeleWa = document.getElementById('btnPodeleWa');
  const btnPodeleFormular = document.getElementById('btnPodeleFormular');

  function calculateFlooring() {
    if (!calcPodeleMp || !resPodeleTotalMp) return;

    const rawMp = parseFloat(calcPodeleMp.value);
    const suprafataNeta = (!isNaN(rawMp) && rawMp > 0) ? Math.min(rawMp, 2000) : 1;
    const marja = parseFloat(calcPodeleMarja ? calcPodeleMarja.value : 0.10) || 0.10;
    const suprafataTotala = suprafataNeta * (1 + marja);
    const grosimeM = parseFloat(calcPodeleGrosime ? calcPodeleGrosime.value : 0.025) || 0.025;
    const grosimeMm = Math.round(grosimeM * 1000);
    const esenta = calcPodeleEsenta ? calcPodeleEsenta.value : 'Gorun';

    const volumTotal = (suprafataTotala * grosimeM).toFixed(2);
    const greutate = Math.round(parseFloat(volumTotal) * 850);
    const metriLiniari = Math.round(suprafataTotala / 0.14);

    resPodeleTotalMp.textContent = suprafataTotala.toFixed(1);
    if (resPodeleVolum) resPodeleVolum.textContent = `Volum debitat: ~${volumTotal} MC`;
    if (resPodeleNetMp) resPodeleNetMp.textContent = `${suprafataNeta} mp`;
    if (resPodeleGrosimeText) resPodeleGrosimeText.textContent = `${grosimeMm} mm (${(grosimeMm / 10).toFixed(1)} cm)`;
    if (resPodeleMl) resPodeleMl.textContent = `~ ${metriLiniari.toLocaleString('ro-RO')} ml`;
    if (resPodeleGreutate) resPodeleGreutate.textContent = `~ ${greutate.toLocaleString('ro-RO')} kg`;
    if (resPodeleEsenta) resPodeleEsenta.textContent = esenta;

    syncQuickChips('calcPodeleMp', suprafataNeta);
    pulseResultBox(panelPodele);

    if (btnPodeleWa) {
      const waMsg = `Bună ziua! Doresc o ofertă de preț pentru podele / dușumea masivă de ${esenta}, grosime ${grosimeMm} mm, suprafață netă ${suprafataNeta} mp (total cu marjă ~${suprafataTotala.toFixed(1)} mp, volum ~${volumTotal} MC, ~${metriLiniari} ml). Vă rog să-mi transmiteți prețul și disponibilitatea. Mulțumesc!`;
      btnPodeleWa.href = `https://wa.me/40783046620?text=${encodeURIComponent(waMsg)}`;
    }
  }

  if (calcPodeleMp) {
    calcPodeleMp.addEventListener('input', calculateFlooring);
    calcPodeleMp.addEventListener('change', () => {
      let val = parseFloat(calcPodeleMp.value);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 2000) val = 2000;
      calcPodeleMp.value = val;
      calculateFlooring();
    });
    if (calcPodeleGrosime) calcPodeleGrosime.addEventListener('change', calculateFlooring);
    if (calcPodeleMarja) calcPodeleMarja.addEventListener('change', calculateFlooring);
    if (calcPodeleEsenta) calcPodeleEsenta.addEventListener('change', calculateFlooring);
    calculateFlooring();
  }

  if (btnPodeleFormular) {
    btnPodeleFormular.addEventListener('click', (e) => {
      e.preventDefault();
      const qProduct = document.getElementById('qProduct');
      const qPallets = document.getElementById('qPallets');

      if (qProduct) {
        for (let i = 0; i < qProduct.options.length; i++) {
          if (qProduct.options[i].value.includes('Podele')) {
            qProduct.selectedIndex = i;
            break;
          }
        }
      }
      if (qPallets && calcPodeleMp && calcPodeleGrosime && calcPodeleEsenta) {
        const rawMp = parseFloat(calcPodeleMp.value);
        const suprafataNeta = (!isNaN(rawMp) && rawMp > 0) ? Math.min(rawMp, 2000) : 1;
        calcPodeleMp.value = suprafataNeta;
        calculateFlooring();
        const grosimeMm = Math.round(parseFloat(calcPodeleGrosime.value) * 1000);
        const volText = resPodeleVolum.textContent.replace('Volum debitat: ~', '');
        qPallets.value = `~${resPodeleTotalMp.textContent} mp`;
        const qAddress = document.getElementById('qAddress');
        if (qAddress && (!qAddress.value.trim() || qAddress.dataset.autoPrefilled === 'true')) {
          qAddress.value = `Podele ${calcPodeleEsenta.value}: ~${resPodeleTotalMp.textContent} mp, grosime ${grosimeMm} mm (~${volText}). Localitate livrare: `;
          qAddress.dataset.autoPrefilled = 'true';
        }
      }
      scrollToAndHighlightQuoteForm();
    });
  }

  // 3D. Control Universal Butoane Stepper (- / +) și Cipuri Rapide (Paleți, Bucăți, MP)
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const step = parseFloat(btn.getAttribute('data-step')) || 1;
      const inputEl = document.getElementById(targetId);
      if (!inputEl) return;

      const min = parseFloat(inputEl.getAttribute('min')) || 1;
      const max = parseFloat(inputEl.getAttribute('max')) || 9999;
      const current = parseFloat(inputEl.value) || min;
      let nextVal = current + step;
      if (nextVal < min) nextVal = min;
      if (nextVal > max) nextVal = max;

      inputEl.value = nextVal;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  document.querySelectorAll('.quick-mp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target') || 'calcPodeleMp';
      const val = btn.getAttribute('data-val') || btn.getAttribute('data-mp');
      const inputEl = document.getElementById(targetId);
      if (!inputEl || val === null) return;

      inputEl.value = val;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // 4. Filtru Portofoliu / Catalog Produse & Quick-Jump Pills
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  function updatePortfolioOddSpan() {
    if (projectCards.length === 0) return;
    const visibleCards = Array.from(projectCards).filter(c => c.style.display !== 'none');
    projectCards.forEach(c => c.classList.remove('project-card-odd-last'));
    if (visibleCards.length % 2 === 1) {
      visibleCards[visibleCards.length - 1].classList.add('project-card-odd-last');
    }
  }

  if (filterBtns.length > 0 && projectCards.length > 0) {
    updatePortfolioOddSpan();
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterVal = btn.getAttribute('data-filter');
        const matchingCards = [];

        projectCards.forEach(card => {
          card.classList.remove('project-card-odd-last');
          const category = card.getAttribute('data-category');
          if (filterVal === 'all' || category === filterVal) {
            matchingCards.push(card);
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 30);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.96)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 150);
          }
        });

        if (matchingCards.length % 2 === 1) {
          matchingCards[matchingCards.length - 1].classList.add('project-card-odd-last');
        }
      });
    });
  } else if (filterBtns.length > 0) {
    // Quick-jump anchor pills (e.g. servicii.html)
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // 5. Formatare Exactă Contoare Statistici (fără reset la 0 care afișează valori parțiale eronate la încărcare)
  document.querySelectorAll('.stat-number').forEach(stat => {
    const target = parseInt(stat.getAttribute('data-count'), 10);
    const prefix = stat.getAttribute('data-prefix') || '';
    const suffix = stat.getAttribute('data-suffix') || '';
    if (!isNaN(target)) {
      stat.textContent = prefix + target.toLocaleString('ro-RO') + suffix;
    }
  });
});
