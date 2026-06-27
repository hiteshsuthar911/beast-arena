// Apply saved theme or default light theme immediately to prevent flashing
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  const desktopNav = header.querySelector('nav');
  if (!desktopNav) return;

  // Mark desktop navigation
  desktopNav.classList.add('desktop-nav');

  // Insert theme toggle button
  const themeLi = document.createElement('li');
  themeLi.className = 'theme-toggle-item';

  const themeBtn = document.createElement('button');
  themeBtn.id = 'theme-toggle-btn';
  themeBtn.className = 'theme-toggle-btn-ui';
  themeBtn.type = 'button';
  themeBtn.style.padding = '0.45rem 0.8rem';
  themeBtn.style.background = 'transparent';
  themeBtn.style.border = 'none';
  themeBtn.style.cursor = 'pointer';
  themeBtn.style.fontSize = '0.9rem';
  themeBtn.style.display = 'inline-flex';
  themeBtn.style.alignItems = 'center';
  themeBtn.style.justifyContent = 'center';

  const updateToggleUI = (theme) => {
    themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    themeBtn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  };

  updateToggleUI(localStorage.getItem('theme') || 'light');

  themeBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleUI(newTheme);

    const mobileBtn = document.querySelector('.overlay-nav .theme-toggle-btn-ui');
    if (mobileBtn) {
      mobileBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    }
  });

  themeLi.appendChild(themeBtn);

  const desktopUl = desktopNav.querySelector('ul');
  if (desktopUl) {
    desktopUl.appendChild(themeLi);
  }

  // Sync navigation item visibility based on authentication state
  const syncNavItems = (navElement) => {
    const token = localStorage.getItem('playerToken');
    const logoutLi = navElement.querySelector('#player-logout-btn')?.closest('li');
    const profileLi = navElement.querySelector('a[href="/profile"]')?.closest('li');
    const registerLi = navElement.querySelector('a[href="/register"]')?.closest('li');
    const loginLi = navElement.querySelector('a[href="/login"]')?.closest('li');
    
    if (token) {
      if (loginLi) loginLi.setAttribute('hidden', '');
      if (logoutLi) logoutLi.removeAttribute('hidden');
      if (profileLi) profileLi.removeAttribute('hidden');
      if (registerLi) registerLi.removeAttribute('hidden');
    } else {
      if (loginLi) loginLi.removeAttribute('hidden');
      if (logoutLi) logoutLi.setAttribute('hidden', '');
      if (profileLi) profileLi.setAttribute('hidden', '');
      if (registerLi) registerLi.setAttribute('hidden', '');
    }
  };

  syncNavItems(desktopNav);

  // 1. Create Mobile Hamburger Menu Button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'menu-toggle-btn';
  toggleBtn.className = 'menu-toggle-btn';
  toggleBtn.type = 'button';
  toggleBtn.textContent = '☰ Menu';
  
  const headerInner = header.querySelector('.header-inner') || header;
  headerInner.appendChild(toggleBtn);

  // Sync toggle button visibility with the desktop nav's hidden state (important for login walls)
  const syncToggleState = () => {
    if (desktopNav.hasAttribute('hidden') || desktopNav.style.display === 'none') {
      toggleBtn.setAttribute('hidden', '');
    } else {
      toggleBtn.removeAttribute('hidden');
    }
  };

  syncToggleState();

  // Watch for dynamic visibility changes on the main navigation element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
        syncToggleState();
      }
    });
  });
  observer.observe(desktopNav, { attributes: true });

  // 2. Create Full-Screen Mobile Navigation Overlay
  const overlay = document.createElement('div');
  overlay.id = 'nav-overlay';
  overlay.className = 'nav-overlay';
  overlay.setAttribute('hidden', '');

  const closeBtn = document.createElement('button');
  closeBtn.id = 'menu-close-btn';
  closeBtn.className = 'menu-close-btn';
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  overlay.appendChild(closeBtn);

  const overlayNav = document.createElement('nav');
  overlayNav.className = 'overlay-nav';

  // Clone desktop navigation lists dynamically to keep links synchronized
  if (desktopUl) {
    const overlayUl = desktopUl.cloneNode(true);
    overlayUl.classList.remove('desktop-nav'); // prevent mobile CSS from hiding the cloned list

    // Bind click events on the cloned buttons (like Sign Out / Log Out)
    const originalButtons = desktopUl.querySelectorAll('button');
    const clonedButtons = overlayUl.querySelectorAll('button');
    clonedButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (originalButtons[index]) {
          originalButtons[index].click();
        }
      });
    });

    overlayNav.appendChild(overlayUl);
  }

  overlay.appendChild(overlayNav);
  document.body.appendChild(overlay);

  // 3. Register Overlay Toggle Listeners
  function openOverlay() {
    overlay.removeAttribute('hidden');
    // Small delay so display kicks in before animation starts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('open'));
    });
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    overlay.classList.add('closing');
    overlay.addEventListener('animationend', () => {
      overlay.setAttribute('hidden', '');
      overlay.classList.remove('closing');
    }, { once: true });
  }

  toggleBtn.addEventListener('click', openOverlay);
  closeBtn.addEventListener('click', closeOverlay);

  // Hide overlay if any link is clicked
  overlayNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeOverlay);
  });

  // Close on backdrop tap (clicking outside the nav card)
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });
});
