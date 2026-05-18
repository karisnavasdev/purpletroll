/* ============================================================
   PTROLL — interactions
   Depends on audio.js (window.DCAudio { SFX, speak, voice })
   ============================================================ */

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const SFX = (n, ...args) => window.DCAudio?.SFX?.[n]?.(...args);
  const SAY = (text, opts) => window.DCAudio?.speak?.(text, opts);

  // ============================================================
  // 0) Hero video — lazy load + crossfade in over the poster image
  //    Picks the mobile or desktop source based on viewport.
  // ============================================================
  (() => {
    const vid = $('#heroVideo');
    if (!vid) return;
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const url = isMobile
      ? vid.dataset.srcMobile || vid.dataset.srcDesktop
      : vid.dataset.srcDesktop || vid.dataset.srcMobile;
    if (!url) return;
    let triggered = false;
    const swap = () => {
      if (triggered) return;
      triggered = true;
      // create the source element on-the-fly so we don't fetch until ready
      const s = document.createElement('source');
      s.src = url;
      s.type = 'video/mp4';
      vid.appendChild(s);
      vid.load();
      vid.addEventListener('canplay', () => {
        vid.play().catch(() => {});
        setTimeout(() => vid.classList.add('is-loaded'), 80);
      }, { once: true });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { swap(); io.disconnect(); return; }
        }
      }, { rootMargin: '400px 0px' });
      io.observe(vid);
    } else {
      swap();
    }
  })();

  // ============================================================
  // 1) Coin rain — purple troll faces falling
  // ============================================================
  function rainCoins(n = 24, sourceEl = null) {
    const layer = $('#coinLayer') || (() => {
      const d = document.createElement('div');
      d.id = 'coinLayer'; d.className = 'coin-layer';
      document.body.appendChild(d); return d;
    })();
    let originX, originY;
    if (sourceEl) {
      const r = sourceEl.getBoundingClientRect();
      originX = r.left + r.width / 2;
      originY = r.top + r.height / 2;
    }
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'coin';
      const startX = sourceEl ? originX + (Math.random() - .5) * 80 : Math.random() * window.innerWidth;
      const startY = sourceEl ? originY : -40;
      const drift  = (Math.random() - .5) * 220;
      const dur    = 1.6 + Math.random() * 1.6;
      c.style.left = `${startX}px`;
      c.style.top  = `${startY}px`;
      c.style.setProperty('--xt', `${drift}px`);
      c.style.setProperty('--rt', `${(Math.random() * 720 - 360) | 0}deg`);
      c.style.setProperty('--d',  `${dur}s`);
      layer.appendChild(c);
      setTimeout(() => c.remove(), dur * 1000 + 200);
    }
  }

  // ============================================================
  // 3) BUY / SELL handlers — for $PTROLL these all route to modal
  //    (no live token yet). When it goes live, set BUY_URL + TG_URL
  //    and remove the data-coming-soon on those buttons.
  // ============================================================
  const BUY_URL = 'https://jup.ag/swap?sell=So11111111111111111111111111111111111111112&buy=pumppump';
  const TG_URL  = 'https://t.me/purpletrollo';

  $$('[data-action="buy"]').forEach(b => {
    if (b.tagName === 'A' && BUY_URL) {
      const href = (b.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#')) b.setAttribute('href', BUY_URL);
      b.setAttribute('target', '_blank');
      b.setAttribute('rel', 'noopener noreferrer');
    }
    b.addEventListener('click', e => {
      SFX('buy_pop');
      pulse(b);
      if (!BUY_URL) {
        e.preventDefault();
        // let the data-coming-soon handler open the modal
        return;
      }
      if (b.tagName !== 'A') {
        e.preventDefault();
        window.open(BUY_URL, '_blank', 'noopener');
      }
    });
  });

  const sellBtns = $$('[data-action="sell"]');
  sellBtns.forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      const original = b.textContent;
      b.textContent = "TROLLS DON'T SELL";
      b.style.background = '#ffb1b1';
      SFX('rim_shot');
      setTimeout(() => { b.textContent = original; b.style.background = ''; }, 1600);
    });
  });

  $$('[data-action="telegram"]').forEach(b => {
    if (b.tagName === 'A' && TG_URL) {
      const href = (b.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#')) b.setAttribute('href', TG_URL);
      b.setAttribute('target', '_blank');
      b.setAttribute('rel', 'noopener noreferrer');
    }
    b.addEventListener('click', e => {
      SFX('coin');
      pulse(b);
      if (!TG_URL) {
        e.preventDefault();
        return;
      }
      if (b.tagName !== 'A') {
        e.preventDefault();
        window.open(TG_URL, '_blank', 'noopener');
      }
    });
  });

  function pulse(el) {
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'ease-out' }
    );
  }

  // ============================================================
  // 3) Konami code = troll rave
  // ============================================================
  const KEY_SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kPos = 0;
  document.addEventListener('keydown', e => {
    if (e.key === KEY_SEQ[kPos]) {
      kPos++;
      if (kPos === KEY_SEQ.length) {
        kPos = 0;
        document.body.classList.add('troll-rave');
        SFX('boombox'); SFX('cha_ching');
        rainCoins(140);
        setTimeout(() => document.body.classList.remove('troll-rave'), 5000);
      }
    } else { kPos = 0; }
  });
  // also: type "troll" anywhere → mini rave
  (() => {
    const target = 'troll';
    let buf = '';
    document.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      buf = (buf + (e.key || '')).toLowerCase().slice(-target.length);
      if (buf === target) {
        document.body.classList.add('troll-rave');
        rainCoins(60);
        setTimeout(() => document.body.classList.remove('troll-rave'), 3500);
      }
    });
  })();
  const raveStyle = document.createElement('style');
  raveStyle.textContent = `body.troll-rave { animation: trollhue 1.4s linear infinite; } @keyframes trollhue { from { filter: hue-rotate(0deg) saturate(1.4); } to { filter: hue-rotate(360deg) saturate(1.4); } }`;
  document.head.appendChild(raveStyle);

  // ============================================================
  // 6) Scene sprite click = SFX + pulse (lair / court / crowd trolls)
  // ============================================================
  $$('.lair-troll, .court-troll, .crowd-wojak').forEach(s => {
    s.addEventListener('click', () => {
      SFX('coin');
      pulse(s);
    });
  });

  // ============================================================
  // 7) "Coming soon" modal — used for all not-yet-live actions
  // ============================================================
  (() => {
    const modal = $('#csModal');
    if (!modal) return;
    const titleEl = $('#csTitle');
    const bodyEl  = $('#csBody');
    const COPY = {
      buy: {
        title: 'Buying coming soon…',
        body: "Patience, troll. We're not on Jupiter yet. Follow X — we'll holler the moment the contract drops, then you can lose money the regular way."
      },
      sell: {
        title: "Trolls don't sell.",
        body: "You can't sell what isn't live yet. And once it is? Diamond hands or get trolled. Your choice."
      },
      telegram: {
        title: 'Telegram coming soon…',
        body: "We're warming up the chat. Watch the X account — link drops the second the trolls are ready to scream into the void together."
      },
      x: {
        title: 'X account coming soon…',
        body: "We're polishing the bio and queueing the bait. Check back shortly. The troll respects only patience."
      },
      tiktok: {
        title: 'TikTok coming soon…',
        body: "Brainrot in production. The first 30 videos are loaded and waiting for the timeline. You'll see them whether you want to or not."
      },
      chart: {
        title: 'Chart coming soon…',
        body: "No CA, no chart. We'll wire up DexScreener / Birdeye the second the token lives on-chain."
      },
      pumpfun: {
        title: 'pump.fun link soon…',
        body: "Token isn't live yet. When it is, the pump.fun link will be the first thing you regret clicking that day."
      },
      default: {
        title: 'Coming soon…',
        body: "Not shipped yet. The troll moves at troll speed."
      }
    };
    let lastFocus = null;
    function open(key) {
      const copy = COPY[key] || COPY.default;
      if (titleEl) titleEl.textContent = copy.title;
      if (bodyEl)  bodyEl.textContent  = copy.body;
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      SFX('cha_ching');
      setTimeout(() => modal.querySelector('.cs-cta')?.focus(), 50);
    }
    function close() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.style.overflow = '';
      SFX('click');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }
    modal.addEventListener('click', e => {
      if (e.target.closest('[data-cs-close]')) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
    window.DCModal = { open, close };
    $$('[data-coming-soon]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        open(el.dataset.comingSoon);
      });
    });
  })();

  // ============================================================
  // 8) Contract Address pill — copy if real, troll if placeholder
  // ============================================================
  const TROLL_REPLIES = ['gotcha', 'no <3', 'try harder', 'still trolling', 'soon, son', 'lmao'];
  let trollReplyIdx = 0;
  const caPill = $('#caPill');
  if (caPill) {
    caPill.addEventListener('click', async () => {
      const valEl = caPill.querySelector('.ca-value');
      const ca = caPill.dataset.ca || (valEl?.textContent || '').trim();
      const looksReal = /^[A-Za-z0-9]{30,}$/.test(ca) && !/coming|soon|lol/i.test(ca);
      if (!looksReal) {
        const orig = valEl.textContent;
        valEl.textContent = TROLL_REPLIES[trollReplyIdx % TROLL_REPLIES.length];
        trollReplyIdx++;
        SFX('rim_shot');
        setTimeout(() => { valEl.textContent = orig; }, 1500);
        return;
      }
      try {
        await navigator.clipboard.writeText(ca);
        caPill.classList.add('copied');
        const orig = valEl.textContent;
        valEl.textContent = 'copied!';
        SFX('coin');
        setTimeout(() => {
          caPill.classList.remove('copied');
          valEl.textContent = orig;
        }, 1400);
      } catch {}
    });
  }

  // ============================================================
  // 9) target="_blank" on every external <a>
  // ============================================================
  $$('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    const isInPageAnchor = href.startsWith('#') && href.length > 1 && document.getElementById(href.slice(1));
    const isJustHash = href === '#';
    if (!isInPageAnchor && !isJustHash) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  console.log('%cPurple Troll — you got trolled.', 'color:#C084FC;font-weight:bold;font-size:14px;');
  console.log('%cpsst — type "troll" anywhere for rave mode, or try the konami code', 'color:#C4FF4F;font-size:11px;');

})();
