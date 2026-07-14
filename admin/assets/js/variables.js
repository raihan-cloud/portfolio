// assets/js/variables.js

// Fungsi untuk mengatur tema secara global
function initTheme() {
    const savedTheme = localStorage.getItem('admin_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Jalankan fungsi saat script dimuat
initTheme();

// Fungsi pembantu jika ingin mengubah tema dari dashboard nanti
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('admin_theme', newTheme);
}