/* ===========================================
   api.js — Admin Portfolio
   Service Layer + DOM Controller (Vanilla JS)
   =========================================== */

(function() {
  'use strict';

  var API_BASE_URL = window.location.origin;
  var toastTimer = null;
  var projects = [];
  var messages = [];
  var activeProjectFilter = 'all';
  var currentEditProjectId = null;
  var selectedMessageId = null;

  function showToast(message, type) {
    var oldToast = document.getElementById('api-toast');
    if (oldToast) oldToast.remove();
    if (toastTimer) clearTimeout(toastTimer);

    var isSuccess = type === 'success';
    var backgroundColor = isSuccess ? '#0d4429' : '#a61b1b';
    var icon = isSuccess ? 'bi-check-circle-fill' : 'bi-x-circle-fill';

    var toast = document.createElement('div');
    toast.id = 'api-toast';
    toast.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'padding:13px 18px',
      'border-radius:10px',
      'color:#fff',
      'font-size:14px',
      'font-weight:500',
      'background:' + backgroundColor,
      'box-shadow:0 10px 24px rgba(0,0,0,.2)',
      'opacity:0',
      'transform:translateY(-8px)',
      'transition:opacity .2s ease, transform .2s ease'
    ].join(';');
    toast.innerHTML = '<i class="bi ' + icon + '" style="font-size:15px"></i><span>' + escapeHtml(message) + '</span>';
    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    toastTimer = setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(function() { toast.remove(); }, 220);
    }, 3200);
  }

  window.Notify = {
    success: function(message) { showToast(message, 'success'); },
    error: function(message) { showToast(message, 'error'); }
  };

  async function request(method, path, payload) {
    var options = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (payload) options.body = JSON.stringify(payload);

    var response = await fetch(API_BASE_URL + path, options);
    var raw = await response.text();
    var data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (error) {
        data = { message: raw };
      }
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || ('Server error ' + response.status));
    }

    return data;
  }

  function normalizeId(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function pickCollection(result, fallbackKey) {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return [];
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result[fallbackKey])) return result[fallbackKey];
    return [];
  }

  window.ProjectService = {
    getAll: function() {
      return request('GET', '/api/projects');
    },
    create: function(projectData) {
      return request('POST', '/api/projects', projectData);
    },
    update: function(id, projectData) {
      return request('PUT', '/api/projects?id=' + encodeURIComponent(normalizeId(id)), projectData);
    },
    remove: function(id) {
      return request('DELETE', '/api/projects?id=' + encodeURIComponent(normalizeId(id)));
    }
  };

  window.MessageService = {
    getAll: function() {
      return request('GET', '/api/messages');
    },
    remove: function(id) {
      return request('DELETE', '/api/messages?id=' + encodeURIComponent(normalizeId(id)));
    }
  };

  function initProjectsPage() {
    if (!document.getElementById('project-table-body')) return;

    loadProjects();

    var form = document.getElementById('project-form');
    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitProjectForm();
      });
    }

    var tabWrapper = document.getElementById('projectTabs');
    if (tabWrapper) {
      tabWrapper.querySelectorAll('.tab-btn').forEach(function(button) {
        button.addEventListener('click', function() {
          tabWrapper.querySelectorAll('.tab-btn').forEach(function(tab) { tab.classList.remove('active'); });
          button.classList.add('active');
          activeProjectFilter = button.dataset.tab || 'all';
          renderProjectRows();
        });
      });
    }
  }

  async function loadProjects() {
    var tableBody = document.getElementById('project-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--text-muted)"><i class="bi bi-arrow-repeat spin"></i> Memuat data proyek...</td></tr>';

    try {
      var result = await ProjectService.getAll();
      projects = pickCollection(result, 'projects');
      renderProjectRows();
    } catch (error) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--text-muted)"><i class="bi bi-exclamation-triangle"></i> Gagal memuat data.<br><button class="btn btn-sm btn-secondary" style="margin-top:10px" onclick="window._retryProjects()">Coba Lagi</button></td></tr>';
      Notify.error('Gagal memuat data proyek.');
    }
  }

  function renderProjectRows() {
    var tableBody = document.getElementById('project-table-body');
    if (!tableBody) return;

    var filtered = projects;
    if (activeProjectFilter !== 'all') {
      filtered = projects.filter(function(project) {
        return (project.status || 'draft').toLowerCase() === activeProjectFilter;
      });
    }

    updateProjectCounters();

    if (filtered.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--text-muted)"><i class="bi bi-folder2-open"></i> Belum ada proyek.</td></tr>';
      return;
    }

    tableBody.innerHTML = filtered.map(function(project) {
      var id = normalizeId(project._id || project.id);
      var status = (project.status || 'draft').toLowerCase();
      var statusBadge = status === 'published'
        ? '<span class="tag tag-green">Published</span>'
        : '<span class="tag tag-amber">Draft</span>';
      var projectDate = project.createdAt ? formatDate(project.createdAt) : (project.date || '-');
      var techText = Array.isArray(project.techStack) ? project.techStack.join(', ') : (project.tech || project.techStack || '');
      var thumbnail = project.image
        ? '<img src="' + escapeHtml(project.image) + '" class="thumb-wide" alt="">'
        : '<div class="thumb-wide" style="display:flex;align-items:center;justify-content:center;border:1px solid var(--border)"><i class="bi bi-image" style="color:var(--text-muted)"></i></div>';

      return '<tr data-id="' + escapeHtml(id) + '">' +
        '<td><div style="display:flex;align-items:center;gap:14px">' + thumbnail +
          '<div><div class="cell-title">' + escapeHtml(project.title || '-') + '</div>' +
          '<div class="cell-sub">' + escapeHtml(techText) + '</div></div></div></td>' +
        '<td><span class="tag ' + projectCategoryTag(project.category) + '">' + escapeHtml(project.category || '-') + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="font-size:13px;color:var(--text-muted)">' + escapeHtml(projectDate) + '</td>' +
        '<td><div class="actions">' +
          '<button class="btn btn-sm btn-secondary btn-icon" data-edit="' + escapeHtml(id) + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
          '<button class="btn btn-sm btn-danger btn-icon" data-delete="' + escapeHtml(id) + '" title="Hapus"><i class="bi bi-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    tableBody.querySelectorAll('[data-edit]').forEach(function(button) {
      button.addEventListener('click', function() { openProjectModalForEdit(button.dataset.edit); });
    });
    tableBody.querySelectorAll('[data-delete]').forEach(function(button) {
      button.addEventListener('click', function() { handleDeleteProject(button.dataset.delete); });
    });
  }

  function updateProjectCounters() {
    var all = projects.length;
    var published = projects.filter(function(project) {
      return (project.status || '').toLowerCase() === 'published';
    }).length;
    var draft = projects.filter(function(project) {
      return (project.status || 'draft').toLowerCase() === 'draft';
    }).length;

    var countAll = document.getElementById('countAll');
    var countPublished = document.getElementById('countPublished');
    var countDraft = document.getElementById('countDraft');
    if (countAll) countAll.textContent = String(all);
    if (countPublished) countPublished.textContent = String(published);
    if (countDraft) countDraft.textContent = String(draft);
  }

  function openProjectModalForAdd() {
    currentEditProjectId = null;

    var title = document.getElementById('modal-title');
    if (title) title.textContent = 'Tambah Proyek Baru';

    var form = document.getElementById('project-form');
    if (form) form.reset();

    if (window.Modal) Modal.open('projectModal');
  }

  function openProjectModalForEdit(projectId) {
    var targetId = normalizeId(projectId);
    var project = projects.find(function(item) {
      return normalizeId(item._id || item.id) === targetId;
    });
    if (!project) {
      Notify.error('Data proyek tidak ditemukan.');
      return;
    }

    currentEditProjectId = targetId;

    var title = document.getElementById('modal-title');
    if (title) title.textContent = 'Edit Proyek';

    var form = document.getElementById('project-form');
    if (!form) return;

    setFormValue(form, 'title', project.title || '');
    setFormValue(form, 'category', project.category || '');
    setFormValue(form, 'description', project.description || '');
    setFormValue(form, 'github', project.github || '');
    setFormValue(form, 'demo', project.demo || project.liveDemo || '');
    setFormValue(form, 'status', project.status || 'draft');

    var techInput = form.querySelector('[name="tech"]');
    if (techInput) {
      techInput.value = Array.isArray(project.techStack)
        ? project.techStack.join(', ')
        : (project.tech || project.techStack || '');
    }

    if (window.Modal) Modal.open('projectModal');
  }

  async function submitProjectForm() {
    var form = document.getElementById('project-form');
    if (!form) return;

    var modal = form.closest('.modal-box');
    var primaryButton = modal ? modal.querySelector('.modal-foot .btn-primary') : null;
    var originalButtonLabel = primaryButton ? primaryButton.innerHTML : '';

    if (primaryButton) {
      primaryButton.disabled = true;
      primaryButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';
    }

    var payload = {
      title: getFormValue(form, 'title'),
      category: getFormValue(form, 'category'),
      description: getFormValue(form, 'description'),
      github: getFormValue(form, 'github'),
      demo: getFormValue(form, 'demo'),
      liveDemo: getFormValue(form, 'demo'),
      status: getFormValue(form, 'status') || 'draft'
    };

    var techInput = form.querySelector('[name="tech"]');
    if (techInput && techInput.value.trim()) {
      payload.techStack = techInput.value.split(',').map(function(value) { return value.trim(); }).filter(Boolean);
    }

    try {
      if (currentEditProjectId) {
        await ProjectService.update(currentEditProjectId, payload);
        Notify.success('Proyek berhasil diperbarui.');
      } else {
        await ProjectService.create(payload);
        Notify.success('Proyek baru berhasil ditambahkan.');
      }

      if (window.Modal) Modal.close('projectModal');
      currentEditProjectId = null;
      await loadProjects();
    } catch (error) {
      Notify.error('Gagal menyimpan proyek: ' + error.message);
    } finally {
      if (primaryButton) {
        primaryButton.disabled = false;
        primaryButton.innerHTML = originalButtonLabel || 'Simpan';
      }
    }
  }

  function handleDeleteProject(projectId) {
    confirmAction('Hapus Proyek?', 'Proyek ini akan dihapus permanen.').then(async function(confirmed) {
      if (!confirmed) return;
      try {
        await ProjectService.remove(projectId);
        Notify.success('Proyek berhasil dihapus.');
        await loadProjects();
      } catch (error) {
        Notify.error('Gagal menghapus proyek: ' + error.message);
      }
    });
  }

  function initMessagesPage() {
    if (!document.getElementById('message-list-container')) return;
    resetReadingPane();
    loadMessages();
  }

  async function loadMessages() {
    var listContainer = document.getElementById('message-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)"><i class="bi bi-arrow-repeat spin"></i> Memuat pesan...</div>';

    try {
      var result = await MessageService.getAll();
      messages = pickCollection(result, 'messages');
      renderMessageList();
    } catch (error) {
      listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)"><i class="bi bi-exclamation-triangle"></i> Gagal memuat pesan.<br><button class="btn btn-sm btn-secondary" style="margin-top:10px" onclick="window._retryMessages()">Coba Lagi</button></div>';
      Notify.error('Gagal memuat pesan.');
    }
  }

  function renderMessageList() {
    var listContainer = document.getElementById('message-list-container');
    if (!listContainer) return;

    var counter = document.getElementById('msgCount');
    if (counter) counter.textContent = String(messages.length);

    if (messages.length === 0) {
      listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted)"><i class="bi bi-envelope-open"></i> Tidak ada pesan.</div>';
      resetReadingPane();
      return;
    }

    listContainer.innerHTML = messages.map(function(message) {
      var id = normalizeId(message._id || message.id);
      var isUnread = message.read === false || message.isRead === false;
      var isActive = selectedMessageId === id;
      var sender = message.name || message.from || 'Anonim';
      var subject = message.subject || '(Tanpa subjek)';
      var timeText = message.createdAt ? relativeTime(message.createdAt) : (message.date || '');

      return '<div class="inbox-item' + (isUnread ? ' unread' : '') + (isActive ? ' active' : '') + '" data-msg-id="' + escapeHtml(id) + '">' +
        '<div class="inbox-sender">' + escapeHtml(sender) + '</div>' +
        '<div class="inbox-subject">' + escapeHtml(subject) + '</div>' +
        '<div class="inbox-time">' + escapeHtml(timeText) + '</div>' +
      '</div>';
    }).join('');

    listContainer.querySelectorAll('.inbox-item').forEach(function(item) {
      item.addEventListener('click', function() {
        openReadingPane(item.dataset.msgId);
      });
    });
  }

  function openReadingPane(messageId) {
    var targetId = normalizeId(messageId);
    var message = messages.find(function(item) {
      return normalizeId(item._id || item.id) === targetId;
    });
    if (!message) {
      Notify.error('Pesan tidak ditemukan.');
      return;
    }

    selectedMessageId = targetId;
    highlightSelectedMessage(targetId);

    var pane = document.getElementById('reading-pane-content');
    if (!pane) return;

    var sender = message.name || message.from || 'Anonim';
    var subject = message.subject || '(Tanpa subjek)';
    var body = message.message || message.body || '';
    var email = message.email || '';
    var sentAt = message.createdAt ? formatDateTime(message.createdAt) : (message.date || '-');
    var replyLink = email
      ? '<a href="mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('Re: ' + subject) + '" class="btn btn-primary btn-sm"><i class="bi bi-reply"></i> Balas</a>'
      : '';

    pane.innerHTML = '<div class="reader-header">' +
      '<div class="reader-subject">' + escapeHtml(subject) + '</div>' +
      '<div class="reader-meta"><strong>Dari:</strong> ' + escapeHtml(sender) + (email ? ' &lt;' + escapeHtml(email) + '&gt;' : '') +
      '<br><strong>Tanggal:</strong> ' + escapeHtml(sentAt) + '</div>' +
      '</div>' +
      '<div class="reader-body" style="white-space:pre-wrap">' + escapeHtml(body) + '</div>' +
      '<div class="reader-actions">' + replyLink +
      '<button class="btn btn-danger btn-sm" id="deleteMsgBtn"><i class="bi bi-trash"></i> Hapus</button>' +
      '</div>';

    var deleteButton = document.getElementById('deleteMsgBtn');
    if (deleteButton) {
      deleteButton.addEventListener('click', function() {
        handleDeleteMessage(targetId);
      });
    }

    var reader = pane.closest('.inbox-reader');
    if (reader) reader.classList.add('mobile-active');
  }

  function highlightSelectedMessage(targetId) {
    document.querySelectorAll('#message-list-container .inbox-item').forEach(function(item) {
      var isTarget = item.dataset.msgId === targetId;
      item.classList.toggle('active', isTarget);
      if (isTarget) item.classList.remove('unread');
    });
  }

  function handleDeleteMessage(messageId) {
    confirmAction('Hapus Pesan?', 'Pesan ini akan dihapus permanen.').then(async function(confirmed) {
      if (!confirmed) return;
      try {
        await MessageService.remove(messageId);
        selectedMessageId = null;
        Notify.success('Pesan berhasil dihapus.');
        resetReadingPane();
        await loadMessages();
      } catch (error) {
        Notify.error('Gagal menghapus pesan: ' + error.message);
      }
    });
  }

  function resetReadingPane() {
    var pane = document.getElementById('reading-pane-content');
    if (!pane) return;

    pane.innerHTML = '<div class="reader-header"><div class="reader-subject" style="color:var(--text-muted)">Pilih pesan untuk dibaca</div></div>' +
      '<div class="reader-body" style="color:var(--text-muted);font-style:italic">Klik pesan di sebelah kiri untuk membaca isi pesan.</div>';

    var reader = pane.closest('.inbox-reader');
    if (reader) reader.classList.remove('mobile-active');
  }

  window.openProjectModal = openProjectModalForAdd;
  window.closeReader = function() {
    var reader = document.querySelector('.inbox-reader');
    if (reader) reader.classList.remove('mobile-active');
  };
  window._retryProjects = loadProjects;
  window._retryMessages = loadMessages;

  function getFormValue(form, fieldName) {
    var field = form.querySelector('[name="' + fieldName + '"]');
    return field ? field.value.trim() : '';
  }

  function setFormValue(form, fieldName, value) {
    var field = form.querySelector('[name="' + fieldName + '"]');
    if (field) field.value = value;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    var node = document.createElement('div');
    node.textContent = String(value);
    return node.innerHTML;
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (error) {
      return String(value);
    }
  }

  function formatDateTime(value) {
    try {
      var date = new Date(value);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' +
        date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return String(value);
    }
  }

  function relativeTime(value) {
    var target = new Date(value).getTime();
    if (!target || Number.isNaN(target)) return '';
    var diffInSeconds = Math.floor((Date.now() - target) / 1000);
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' menit lalu';
    if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' jam lalu';
    if (diffInSeconds < 604800) return Math.floor(diffInSeconds / 86400) + ' hari lalu';
    return Math.floor(diffInSeconds / 604800) + ' minggu lalu';
  }

  function projectCategoryTag(category) {
    if (!category) return 'tag-gray';
    var value = String(category).toLowerCase();
    if (value === 'web app' || value === 'backend') return 'tag-blue';
    if (value === 'mobile') return 'tag-purple';
    if (value === 'iot') return 'tag-teal';
    return 'tag-gray';
  }

  document.addEventListener('DOMContentLoaded', function() {
    initProjectsPage();
    initMessagesPage();
  });
})();
