(() => {
  const banner = document.getElementById('cookieBanner');
  const key = 'snapyt_cookie_preferences_v1';
  const measurementId = 'G-Q461H88NSR';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { return null; }
  };

  const analyticsBox = document.getElementById('analyticsConsent');
  const adsBox = document.getElementById('adsConsent');
  const options = document.getElementById('cookieOptions');

  const show = (manage = false) => {
    if (!banner) return;
    banner.classList.remove('hidden');
    if (options) options.classList.toggle('hidden', !manage);
    const saved = read() || {};
    if (analyticsBox) analyticsBox.checked = !!saved.analytics;
    if (adsBox) adsBox.checked = !!saved.ads;
  };

  const ensureGtag = () => {
    if (window.__snapytGtagReady) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.__snapytGtagReady = true;
  };

  const updateConsent = (analytics, ads) => {
    ensureGtag();
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: ads ? 'granted' : 'denied',
      ad_user_data: ads ? 'granted' : 'denied',
      ad_personalization: ads ? 'granted' : 'denied'
    });
  };

  const loadAnalytics = (ads = false) => {
    if (!window.__snapytAnalyticsLoaded && !window.__snapytAnalyticsLoading) {
      ensureGtag();
      window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: ads ? 'granted' : 'denied',
        ad_user_data: ads ? 'granted' : 'denied',
        ad_personalization: ads ? 'granted' : 'denied'
      });
      window.gtag('config', measurementId, {
        send_page_view: true,
        allow_google_signals: false
      });
      const script = document.createElement('script');
      window.__snapytAnalyticsLoading = true;
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      script.onload = () => { window.__snapytAnalyticsLoaded = true; window.__snapytAnalyticsLoading = false; };
      script.onerror = () => {
        window.__snapytAnalyticsLoadFailed = true;
        window.__snapytAnalyticsLoading = false;
        console.error('SnapYT Analytics: Google tag could not load. Check CSP or browser blockers.');
      };
      document.head.appendChild(script);
    } else {
      updateConsent(true, ads);
    }
  };

  const save = (analytics, ads) => {
    const preferences = {
      essential: true,
      analytics: !!analytics,
      ads: !!ads,
      savedAt: new Date().toISOString()
    };
    try { localStorage.setItem(key, JSON.stringify(preferences)); }
    catch (error) { console.warn('SnapYT: Could not save cookie preferences.', error); }

    if (analytics) loadAnalytics(ads);
    else if (window.__snapytGtagReady) updateConsent(false, ads);
    if (banner) banner.classList.add('hidden');
  };

  const existing = read();
  if (!existing) {
    show(false);
  } else if (existing.analytics) {
    loadAnalytics(!!existing.ads);
  }

  document.getElementById('cookieAccept')?.addEventListener('click', () => save(true, true));
  document.getElementById('cookieReject')?.addEventListener('click', () => save(false, false));
  document.getElementById('cookieManage')?.addEventListener('click', () => show(true));
  document.getElementById('cookieSave')?.addEventListener('click', () => {
    save(!!analyticsBox?.checked, !!adsBox?.checked);
  });
  document.getElementById('cookieSettings')?.addEventListener('click', () => show(true));
})();
