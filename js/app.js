/* ============================================
   HOPE HAVEN - API Client + Core Application
   Full-Stack Integration Layer
   ============================================ */

// ==================== API CONFIGURATION ====================
let API_BASE = window.location.origin + '/api';
let SOCKET_URL = window.location.origin;

// Point to the backend server if running via file:// or a different local port (like Live Server on 5500)
if (window.location.protocol === 'file:' || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000')) {
  API_BASE = 'http://localhost:5000/api';
  SOCKET_URL = 'http://localhost:5000';
}

// ==================== API CLIENT ====================
class API {
  static getToken() {
    return localStorage.getItem('hh_token');
  }

  static setToken(token) {
    localStorage.setItem('hh_token', token);
  }

  static removeToken() {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
  }

  static getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  static async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE}${endpoint}`;
      const config = {
        headers: this.getHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  static get(endpoint) { return this.request(endpoint); }
  static post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  static put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
  static delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

// ==================== AUTH (Backend-powered) ====================
class Auth {
  static async loginDonor(email, password) {
    try {
      const data = await API.post('/auth/login', { email, password });
      if (data.success) {
        API.setToken(data.token);
        const user = { ...data.user, role: data.user.role || 'donor' };
        sessionStorage.setItem('hh_user', JSON.stringify(user));
        localStorage.setItem('hh_user', JSON.stringify(user));
      }
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  static async registerDonor(formData) {
    try {
      const data = await API.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'donor',
        phone: formData.phone,
        location: formData.location,
        preferred_type: formData.preferredType || formData.preferred_type
      });

      if (data.success) {
        API.setToken(data.token);
        const user = { ...data.user, role: 'donor' };
        sessionStorage.setItem('hh_user', JSON.stringify(user));
        localStorage.setItem('hh_user', JSON.stringify(user));
      }
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  static async loginAdmin(email, password) {
    try {
      const data = await API.post('/auth/login', { email, password });
      if (data.success && data.user.role === 'admin') {
        API.setToken(data.token);
        const user = { ...data.user, role: 'admin' };
        sessionStorage.setItem('hh_user', JSON.stringify(user));
        localStorage.setItem('hh_user', JSON.stringify(user));
        return { success: true };
      }
      if (data.success && data.user.role !== 'admin') {
        return { success: false, message: 'Not an admin account' };
      }
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  static getUser() {
    const user = sessionStorage.getItem('hh_user') || localStorage.getItem('hh_user');
    return user ? JSON.parse(user) : null;
  }

  static isLoggedIn() { return !!this.getUser() && !!API.getToken(); }
  static isDonor() { const u = this.getUser(); return u && (u.role === 'donor' || u.role === 'sponsor'); }
  static isAdmin() { const u = this.getUser(); return u && u.role === 'admin'; }

  static logout() {
    API.removeToken();
    sessionStorage.removeItem('hh_user');
  }

  static requireDonor() { if (!this.isDonor()) { window.location.href = 'donor-login.html'; return false; } return true; }
  static requireAdmin() { if (!this.isAdmin()) { window.location.href = 'admin-login.html'; return false; } return true; }
}

// ==================== DATABASE LAYER (API-backed) ====================
class HopeHavenDB {
  constructor() {
    this._cache = {};
    this._cacheTime = {};
    this._cacheTTL = 30000; // 30 seconds cache
  }

  _isCacheValid(key) {
    return this._cache[key] && (Date.now() - (this._cacheTime[key] || 0)) < this._cacheTTL;
  }

  _setCache(key, data) {
    this._cache[key] = data;
    this._cacheTime[key] = Date.now();
  }

  clearCache(key) {
    if (key) { delete this._cache[key]; delete this._cacheTime[key]; }
    else { this._cache = {}; this._cacheTime = {}; }
  }

  // ---- Homes ----
  async getHomes() {
    if (this._isCacheValid('homes')) return this._cache['homes'];
    try {
      const data = await API.get('/homes');
      const homes = data.homes || [];
      this._setCache('homes', homes);
      return homes;
    } catch { return []; }
  }

  async getHomeById(id) {
    try {
      const data = await API.get(`/homes/${id}`);
      return data.home;
    } catch { return null; }
  }

  async getChildById(id) {
    try {
      const data = await API.get(`/children/${id}`);
      return data;
    } catch { return { success: false, message: 'Child not found' }; }
  }

  // ---- Children ----
  async getChildren(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const cacheKey = 'children_' + params;
    if (this._isCacheValid(cacheKey)) return this._cache[cacheKey];
    try {
      const data = await API.get(`/children${params ? '?' + params : ''}`);
      const children = data.children || [];
      this._setCache(cacheKey, children);
      return children;
    } catch { return []; }
  }

  async addChild(childData) {
    try {
      const data = await API.post('/children', childData);
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async updateChild(id, updates) {
    try {
      const data = await API.put(`/children/${id}`, updates);
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async deleteChild(id) {
    try {
      const data = await API.delete(`/children/${id}`);
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async getAutoMatch() {
    try {
      const data = await API.get('/children/match/auto');
      return data.match;
    } catch { return null; }
  }

  // ---- Donations ----
  async getDonations(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    try {
      const data = await API.get(`/donations${params ? '?' + params : ''}`);
      return data.donations || [];
    } catch { return []; }
  }

  async makeDonation(donationData) {
    try {
      const data = await API.post('/donations', donationData);
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async getDonationHistory() {
    try {
      const data = await API.get('/donations/history');
      return data;
    } catch { return { donations: [], summary: {} }; }
  }

  async updateDonationStatus(id, status) {
    try {
      const data = await API.put(`/donations/${id}/status`, { status });
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  // ---- Sponsorships ----
  async getSponsorships(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    try {
      const data = await API.get(`/sponsorships${params ? '?' + params : ''}`);
      return data.sponsorships || [];
    } catch { return []; }
  }

  async createSponsorship(sponsorshipData) {
    try {
      const data = await API.post('/sponsorships', sponsorshipData);
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async getSponsorshipReports() {
    try {
      const data = await API.get('/sponsorships/reports');
      return data.report;
    } catch { return null; }
  }

  // ---- Welfare ----
  async getWelfareReports(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    try {
      const data = await API.get(`/welfare${params ? '?' + params : ''}`);
      return data.reports || [];
    } catch { return []; }
  }

  async addWelfareReport(reportData) {
    try {
      const data = await API.post('/welfare', reportData);
      this.clearCache();
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async getWelfareByChild(childId) {
    try {
      const data = await API.get(`/welfare/child/${childId}`);
      return data;
    } catch { return { child: null, reports: [] }; }
  }

  async getWelfareStats() {
    try {
      const data = await API.get('/welfare/stats');
      return data;
    } catch { return { stats: { green: 0, amber: 0, red: 0 }, attention_needed: [] }; }
  }

  // ---- Admin ----
  async getAdminStats() {
    try {
      const data = await API.get('/admin/stats');
      return data.stats;
    } catch { return null; }
  }

  async getUsers(role) {
    try {
      const data = await API.get(`/admin/users${role ? '?role=' + role : ''}`);
      return data.users || [];
    } catch { return []; }
  }

  async createAdmin(userData) {
    try {
      const data = await API.post('/admin/users', userData);
      return data;
    } catch (error) { return { success: false, message: error.message }; }
  }

  async getRecentActivity() {
    try {
      const data = await API.get('/admin/recent-activity');
      return data;
    } catch { return { recent_donations: [], recent_welfare: [] }; }
  }

  // ---- Legacy compatibility methods (sync wrappers) ----
  // These provide backward compat with existing frontend code
  // They use cached data when available

  getById(key, id) {
    const items = this._cache[key] || [];
    return items.find(item => item.id === id || item.home_id === parseInt(id) || item.child_id === parseInt(id));
  }

  getTotalChildren() { return (this._cache['children_'] || []).length; }
  getTotalHomes() { return (this._cache['homes'] || []).length; }

  getChildrenByWelfareStatus() {
    const children = this._cache['children_'] || [];
    const stats = { green: 0, amber: 0, red: 0 };
    children.forEach(c => { stats[c.welfare_status] = (stats[c.welfare_status] || 0) + 1; });
    return stats;
  }
}

// ==================== SOCKET.IO REAL-TIME ====================
class RealtimeManager {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (typeof io === 'undefined') {
      console.warn('Socket.io not loaded. Real-time features disabled.');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time server');
    });

    // Register event listeners
    this.socket.on('new_donation', (data) => {
      console.log('💰 New donation received:', data);
      this._trigger('new_donation', data);
      showToast('New donation received! 💰', 'success');
    });

    this.socket.on('donation_update', (data) => {
      console.log('📋 Donation updated:', data);
      this._trigger('donation_update', data);
    });

    this.socket.on('sponsorship_update', (data) => {
      console.log('💝 Sponsorship update:', data);
      this._trigger('sponsorship_update', data);
    });

    this.socket.on('welfare_alert', (data) => {
      console.log('🏥 Welfare alert:', data);
      this._trigger('welfare_alert', data);
      if (data.report && data.report.status === 'Critical') {
        showToast(`⚠️ Critical welfare alert for ${data.child?.name || 'a child'}`, 'error');
      }
    });

    this.socket.on('child_update', (data) => {
      console.log('👧🏾 Child update:', data);
      this._trigger('child_update', data);
    });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  _trigger(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  joinRoom(room) {
    if (this.socket) this.socket.emit('join_room', room);
  }
}

// ==================== UI UTILITIES ====================
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function formatCurrency(amount) {
  return 'KSh ' + Number(amount).toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getWelfareColor(status) {
  if (status === 'green') return 'green';
  if (status === 'amber') return 'amber';
  return 'red';
}

function getWelfareLabel(status) {
  if (status === 'green') return 'Good';
  if (status === 'amber') return 'Needs Attention';
  return 'Critical';
}

function getStatusBadge(status) {
  switch(status) {
    case 'Completed': return '<span class="card-badge badge-success">Completed</span>';
    case 'Pending': return '<span class="card-badge badge-warning">Pending</span>';
    case 'Rejected': return '<span class="card-badge badge-danger">Rejected</span>';
    default: return `<span class="card-badge badge-info">${status}</span>`;
  }
}

function animateCounter(element, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      element.textContent = Number(target).toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start).toLocaleString();
    }
  }, 16);
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.navbar-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }
}

function getHomeColor(homeId) {
  const colors = [
    'linear-gradient(135deg, #FCD34D, #F59E0B)',
    'linear-gradient(135deg, #FB923C, #F97316)',
    'linear-gradient(135deg, #FDA4AF, #F43F5E)',
    'linear-gradient(135deg, #86EFAC, #22C55E)',
    'linear-gradient(135deg, #93C5FD, #3B82F6)',
    'linear-gradient(135deg, #C4B5FD, #8B5CF6)',
    'linear-gradient(135deg, #FDBA74, #EA580C)',
    'linear-gradient(135deg, #FCA5A5, #EF4444)',
    'linear-gradient(135deg, #A5F3FC, #06B6D4)',
    'linear-gradient(135deg, #FDE68A, #D97706)'
  ];
  const idx = (typeof homeId === 'number' ? homeId : parseInt(String(homeId).replace(/\D/g, ''))) - 1;
  return colors[Math.abs(idx) % colors.length];
}

function getHomeEmoji(index) {
  const emojis = ['🏠', '💛', '🌟', '👼', '🙏', '🌱', '⛪', '🌈', '☮️', '🤝'];
  return emojis[index % emojis.length];
}

// ==================== CHART UTILITIES ====================
function drawBarChart(canvasId, data, labels, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const maxVal = Math.max(...data) * 1.1 || 1;
  const barWidth = chartW / data.length * 0.6;
  const barGap = chartW / data.length * 0.4;

  const gradientColors = [
    ['#FCD34D', '#F59E0B'], ['#FB923C', '#F97316'],
    ['#FDA4AF', '#F43F5E'], ['#86EFAC', '#22C55E'],
    ['#93C5FD', '#3B82F6'], ['#C4B5FD', '#8B5CF6']
  ];

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    const val = Math.round(maxVal - (maxVal / 5) * i);
    ctx.fillStyle = '#9E8E6E';
    ctx.font = '11px Quicksand, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val, padding.left - 8, y + 4);
  }

  data.forEach((val, i) => {
    const barH = (val / maxVal) * chartH;
    const x = padding.left + (i * (chartW / data.length)) + barGap / 2;
    const y = padding.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y + barH, x, y);
    const colorPair = gradientColors[i % gradientColors.length];
    grad.addColorStop(0, colorPair[0]);
    grad.addColorStop(1, colorPair[1]);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#6E5F42';
    ctx.font = '10px Quicksand, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barWidth / 2, h - padding.bottom + 16);
  });
}

function drawDoughnutChart(canvasId, data, labels, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const cx = w * 0.4;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 20;
  const innerRadius = radius * 0.55;
  const total = data.reduce((a, b) => a + b, 0) || 1;

  let startAngle = -Math.PI / 2;

  data.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    startAngle = endAngle;
  });

  ctx.fillStyle = '#332B1E';
  ctx.font = 'bold 18px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(total >= 1000 ? (total / 1000).toFixed(0) + 'K' : total, cx, cy - 4);
  ctx.font = '11px Quicksand, sans-serif';
  ctx.fillStyle = '#9E8E6E';
  ctx.fillText('Total', cx, cy + 14);

  const legendX = w * 0.7;
  let legendY = 30;
  labels.forEach((label, i) => {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, 14, 14, 3);
    ctx.fill();

    ctx.fillStyle = '#6E5F42';
    ctx.font = '12px Quicksand, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, legendX + 20, legendY + 11);

    ctx.fillStyle = '#9E8E6E';
    ctx.font = '11px Quicksand, sans-serif';
    const pct = Math.round((data[i] / total) * 100);
    ctx.fillText(`${pct}%`, legendX + 20, legendY + 26);

    legendY += 40;
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ==================== INITIALIZE ====================
const db = new HopeHavenDB();
const realtime = new RealtimeManager();

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  // Connect to real-time server if user is logged in
  if (Auth.isLoggedIn()) {
    realtime.connect();
  }
});
