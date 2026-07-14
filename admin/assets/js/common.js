/* ===========================================
   Common.js — Admin Dashboard
   Sidebar, Theme, Modal, Toast, Tabs, Counters
   =========================================== */

/* ── Theme ─────────────────────────────── */
var ThemeManager = {
  key: 'admin_theme',
  init: function() {
    this.apply(localStorage.getItem(this.key) || 'light');
  },
  apply: function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.key, theme);
    var icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
  },
  toggle: function() {
    var curr = document.documentElement.getAttribute('data-theme') || 'light';
    this.apply(curr === 'dark' ? 'light' : 'dark');
  }
};

/* ── Sidebar ───────────────────────────── */
var SidebarManager = {
  key: 'sidebar_state',
  init: function() {
    var sidebar = document.getElementById('sidebar');
    var main = document.getElementById('mainContent');
    if (!sidebar) return;
    if (localStorage.getItem(this.key) === 'collapsed') {
      sidebar.classList.add('collapsed');
      if (main) main.classList.add('sidebar-collapsed');
    }
    this.setActiveLink();
  },
  toggle: function() {
    var sidebar = document.getElementById('sidebar');
    var main = document.getElementById('mainContent');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed');
    if (main) main.classList.toggle('sidebar-collapsed');
    localStorage.setItem(this.key, sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
  },
  openMobile: function() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
  },
  closeMobile: function() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  },
  setActiveLink: function() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-link').forEach(function(el) {
      el.classList.remove('active');
      if (el.dataset.page === page) el.classList.add('active');
    });
  }
};

/* ── Modal ─────────────────────────────── */
var Modal = {
  open: function(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
  },
  close: function(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
  }
};

/* ── Toast ─────────────────────────────── */
var Toast = {
  container: null,
  init: function() {
    if (!document.getElementById('toastContainer')) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toastContainer');
    }
  },
  show: function(title, msg, type) {
    if (!this.container) this.init();
    type = type || 'info';
    var icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', info:'bi-info-circle-fill' };
    var id = 'toast_' + Date.now();
    var el = document.createElement('div');
    el.className = 'toast';
    el.id = id;
    el.innerHTML =
      '<i class="bi ' + (icons[type]||icons.info) + ' toast-icon ' + type + '"></i>' +
      '<div style="flex:1"><div class="toast-title">' + title + '</div>' +
      (msg ? '<div class="toast-msg">' + msg + '</div>' : '') +
      '</div><span class="toast-close" onclick="Toast.remove(\'' + id + '\')">&times;</span>';
    this.container.appendChild(el);
    var self = this;
    setTimeout(function() { self.remove(id); }, 3500);
  },
  remove: function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.style.animation = 'toastOut .25s ease forwards';
      setTimeout(function() { el.remove(); }, 250);
    }
  },
  success: function(t, m) { this.show(t, m, 'success'); },
  error: function(t, m) { this.show(t, m, 'error'); },
  info: function(t, m) { this.show(t, m, 'info'); }
};

/* ── Confirm Dialog ────────────────────── */
function confirmAction(title, text) {
  title = title || 'Are you sure?';
  text = text || 'This action cannot be undone.';
  return new Promise(function(resolve) {
    if (window.Swal) {
      Swal.fire({
        title: title, text: text, icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'Cancel'
      }).then(function(r) { resolve(r.isConfirmed); });
    } else {
      resolve(window.confirm(title + '\n' + text));
    }
  });
}

/* ── Tabs ──────────────────────────────── */
function initTabs(containerSel, callback) {
  var container = document.querySelector(containerSel);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (callback) callback(btn.dataset.tab);
    });
  });
}

/* ── Counter Animation ─────────────────── */
function animateCounter(el, target) {
  var start = 0;
  var duration = 1000;
  function step(ts) {
    if (!start) start = ts;
    var p = Math.min((ts - start) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function initCounters() {
  document.querySelectorAll('[data-counter]').forEach(function(el) {
    animateCounter(el, parseInt(el.dataset.counter));
  });
}

/* ── Table Search ──────────────────────── */
function initTableSearch(inputId, tbodyId) {
  var input = document.getElementById(inputId);
  var tbody = document.getElementById(tbodyId);
  if (!input || !tbody) return;
  input.addEventListener('input', function() {
    var q = this.value.toLowerCase();
    tbody.querySelectorAll('tr').forEach(function(row) {
      row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none';
    });
  });
}

/* ── Init ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  ThemeManager.init();
  SidebarManager.init();
  Toast.init();
  initCounters();

  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', function() { ThemeManager.toggle(); });

  var sidebarBtn = document.getElementById('sidebarToggle');
  if (sidebarBtn) sidebarBtn.addEventListener('click', function() { SidebarManager.toggle(); });

  var mobileBtn = document.getElementById('mobileSidebarToggle');
  if (mobileBtn) mobileBtn.addEventListener('click', function() { SidebarManager.openMobile(); });

  var overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', function() { SidebarManager.closeMobile(); });

  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(function(m) {
        m.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });
});
