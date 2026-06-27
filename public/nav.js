// Apply saved theme or default light theme immediately to prevent flashing
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Check if session verified
  const isVerified = sessionStorage.getItem('arena_verified');
  
  if (!isVerified) {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const overlay = document.createElement('div');
    overlay.id = 'security-verification-overlay';
    
    const genRayId = () => {
      const chars = '0123456789abcdef';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };
    const rayId = genRayId();
    
    overlay.innerHTML = `
      <div class="verification-content">
        <div class="verification-logo-row" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;">
          <svg class="logo-svg" style="width: 48px; height: 48px;" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-grad-ver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7c3aed" />
                <stop offset="100%" stop-color="#b814b8" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(192, 132, 252, 0.15)" stroke-width="6" />
            <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" fill="none" stroke="url(#logo-grad-ver)" stroke-width="4" stroke-linejoin="round" />
            <g fill="url(#logo-grad-ver)">
              <path d="M35,32 L45,45 L32,52 L28,40 Z" />
              <path d="M65,32 L72,40 L68,52 L55,45 Z" />
              <path d="M50,25 L58,42 L50,55 L42,42 Z" />
              <path d="M42,60 L50,52 L58,60 L50,75 Z" />
            </g>
          </svg>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 1.35rem; font-weight: 850; color: #ffffff; letter-spacing: -0.03em; line-height: 1.1;">Beast Arena</span>
            <span style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; line-height: 1;">Security Center</span>
          </div>
        </div>
        
        <h2 style="font-size: 1.8rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #ffffff; font-family: system-ui, -apple-system, sans-serif;">Performing security verification</h2>
        <p class="verification-subtext" style="font-size: 0.95rem; color: #9ca3af; line-height: 1.5; margin-bottom: 1.5rem; font-family: system-ui, -apple-system, sans-serif;">This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.</p>
        
        <div class="verification-loader-container" style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; margin-bottom: 1rem;">
          <div class="verification-loader-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #7c3aed, #ec4899); border-radius: 2px; transition: width 1.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>
        
        <div class="verification-status" style="font-size: 0.85rem; color: #9ca3af; font-family: monospace; margin-bottom: 2rem;">Initiating challenge handshake...</div>
        
        <div class="verification-footer" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.5rem; font-size: 0.75rem; color: #6b7280; line-height: 1.5; font-family: monospace;">
          Ray ID: <span style="color: #9ca3af;">${rayId}</span><br>
          Performance & Security by Beast Guard | Privacy
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const loaderBar = overlay.querySelector('.verification-loader-bar');
    const statusMsg = overlay.querySelector('.verification-status');
    
    setTimeout(() => {
      loaderBar.style.width = '100%';
    }, 50);
    
    setTimeout(() => {
      statusMsg.textContent = 'Validating client security profile...';
    }, 600);
    
    setTimeout(() => {
      statusMsg.textContent = 'Verification successful. Entering the Arena...';
      statusMsg.style.color = '#10b981';
    }, 1200);
    
    setTimeout(() => {
      overlay.style.opacity = '0';
      document.body.style.overflow = originalOverflow;
      sessionStorage.setItem('arena_verified', 'true');
      
      setTimeout(() => {
        overlay.remove();
      }, 500);
    }, 1800);
  }

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
