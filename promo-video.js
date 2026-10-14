(() => {
  const launcher = document.querySelector('#promo-open');
  const backdrop = document.querySelector('#promo-backdrop');
  const dialog = document.querySelector('#promo-dialog');
  const closeButton = document.querySelector('#promo-close');
  const player = document.querySelector('#promo-player');
  const choices = [...document.querySelectorAll('.promo-choice')];
  const estimateLink = document.querySelector('#promo-estimate');
  if (!launcher || !backdrop || !dialog || !closeButton || !player) return;

  const sessionKey = 'kvlSolarVideoPromptSeen';
  let seenThisPage = false;
  let previouslyFocused = null;

  const hasSeenPrompt = () => {
    try {
      return sessionStorage.getItem(sessionKey) === 'yes';
    } catch {
      return seenThisPage;
    }
  };

  const markPromptSeen = () => {
    seenThisPage = true;
    try {
      sessionStorage.setItem(sessionKey, 'yes');
    } catch {
      // Keep the once-per-page fallback when storage is unavailable.
    }
  };

  const openPromo = () => {
    if (!backdrop.hidden) return;
    previouslyFocused = document.activeElement;
    markPromptSeen();
    backdrop.hidden = false;
    document.body.classList.add('promo-open');
    player.muted = true;
    closeButton.focus();
    const playback = player.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  };

  const closePromo = () => {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.classList.remove('promo-open');
    player.pause();
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };

  launcher.addEventListener('click', openPromo);
  closeButton.addEventListener('click', closePromo);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closePromo();
  });
  estimateLink?.addEventListener('click', closePromo);

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      const nextSource = choice.dataset.promoSrc;
      if (!nextSource || player.getAttribute('src') === nextSource) return;
      choices.forEach((item) => {
        const active = item === choice;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      player.pause();
      player.src = nextSource;
      player.load();
      player.muted = true;
      const playback = player.play();
      if (playback && typeof playback.catch === 'function') playback.catch(() => {});
    });
  });

  document.addEventListener('keydown', (event) => {
    if (backdrop.hidden) return;
    if (event.key === 'Escape') {
      closePromo();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], video[controls]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (!hasSeenPrompt()) {
    window.setTimeout(() => {
      if (!hasSeenPrompt()) openPromo();
    }, 8000);
  }
})();
