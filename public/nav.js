document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  if (!header) return;

  const desktopNav = header.querySelector('nav');
  if (!desktopNav) return;

  // Mark desktop navigation
  desktopNav.classList.add('desktop-nav');

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
  const desktopUl = desktopNav.querySelector('ul');
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
  header.appendChild(overlay);

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
