/* Component Loader - injects sidebar/navbar/footer into every admin page */
async function loadComponent(id, file) {
  try {
    const res = await fetch(file);
    if (!res.ok) return;
    const html = await res.text();
    const el = document.getElementById(id);
    if (el) { el.outerHTML = html; SidebarManager.setActiveLink(); }
  } catch(e) { console.warn('Component load failed:', file, e); }
}

async function loadAdminLayout() {
  await Promise.all([
    loadComponent('sidebarPlaceholder', 'components/sidebar.html'),
    loadComponent('navbarPlaceholder', 'components/navbar.html'),
    loadComponent('footerPlaceholder', 'components/footer.html')
  ]);
  // re-init after components load
  SidebarManager.init();
  ThemeManager.init();
  initCounters();
  document.getElementById('themeToggle')?.addEventListener('click', () => ThemeManager.toggle());
  document.getElementById('sidebarToggle')?.addEventListener('click', () => SidebarManager.toggle());
  document.getElementById('mobileSidebarToggle')?.addEventListener('click', () => SidebarManager.openMobile());
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => SidebarManager.closeMobile());
}

document.addEventListener('DOMContentLoaded', loadAdminLayout);
