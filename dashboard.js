// PATRON-MD Admin Dashboard - Main JavaScript
// ============================================

const API_BASE = '';
let autoRefreshInterval = null;
let statsChart = null;
let isLoggedIn = false;

// ============== LOGIN FUNCTIONS ==============

function login() {
    const password = document.getElementById('passwordInput').value;
    if (!password) {
        showError('Please enter a password');
        return;
    }

    const expectedPassword = 'maximus0000';

    if (password === expectedPassword) {
        localStorage.setItem('patron_session', 'authenticated');
        document.getElementById('passwordInput').value = '';
        showDashboard();
        addLog('Admin logged in successfully', 'success');
        refreshDashboard();
        setInterval(refreshDashboard, 10000);
    } else {
        showError('Invalid password');
        document.getElementById('passwordInput').value = '';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

function showDashboard() {
    isLoggedIn = true;
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').classList.remove('dashboard-hidden');
}

function logout() {
    if (confirm('Logout from dashboard?')) {
        localStorage.removeItem('patron_session');
        isLoggedIn = false;
        document.getElementById('dashboardContainer').classList.add('dashboard-hidden');
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('passwordInput').value = '';
    }
}

// ============== API FUNCTIONS ==============

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (response.status === 401) {
            logout();
            throw new Error('Unauthorized');
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        addLog(`Failed to fetch ${endpoint}: ${error.message}`, 'error');
        return null;
    }
}

// ============== LOGGING FUNCTIONS ==============

function addLog(message, type = 'info') {
    const logArea = document.getElementById('logArea');
    const time = new Date().toLocaleTimeString();
    const logLine = document.createElement('div');
    logLine.className = `log-line log-${type}`;
    logLine.textContent = `[${time}] ${message}`;
    logArea.appendChild(logLine);
    logArea.scrollTop = logArea.scrollHeight;
}

function clearLogs() {
    document.getElementById('logArea').innerHTML = '';
    addLog('Logs cleared', 'info');
}

// ============== DASHBOARD REFRESH ==============

async function refreshDashboard() {
    addLog('Refreshing dashboard...', 'info');
    
    // Fetch overall stats
    const overallStats = await fetchAPI('/stats-overall');
    if (overallStats) {
        document.getElementById('totalActive').textContent = overallStats.totalActive || 0;
        document.getElementById('totalMessages').textContent = (overallStats.totalMessages || 0).toLocaleString();
        document.getElementById('totalCommands').textContent = (overallStats.totalCommands || 0).toLocaleString();
        document.getElementById('serverUptime').textContent = formatUptime(overallStats.serverUptime || 0);
    }

    // Fetch connections
    const connections = await fetchAPI('/active');
    if (connections) {
        displayConnections(connections.numbers || []);
    }

    // Update last refresh time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Last update: ${now.toLocaleTimeString()}`;
    addLog('Dashboard refreshed successfully', 'success');
}

async function displayConnections(numbers) {
    const list = document.getElementById('connectionsList');
    
    if (numbers.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999;">No active connections</p>';
        return;
    }

    let html = '';
    for (const number of numbers) {
        const status = await fetchAPI(`/status?number=${number}`);
        const isConnected = status?.isConnected;
        
        html += `
            <div class="connection-item ${isConnected ? 'connected' : 'disconnected'}">
                <div class="connection-item-header">
                    <div class="connection-item-number">📞 ${number}</div>
                    <span class="status-badge ${isConnected ? 'online' : 'offline'}">
                        ${isConnected ? '🟢 Online' : '🔴 Offline'}
                    </span>
                </div>
                <div class="connection-item-info">
                    <div>⏱️ Uptime: ${status?.uptime || '0'}s</div>
                    <div>📅 ${status?.connectionTime || '--'}</div>
                </div>
                <div class="connection-item-actions">
                    <button class="btn-info" onclick="showStats('${number}')">📊 Stats</button>
                    <button class="btn-info" onclick="openConfigModal('${number}')">⚙️ Config</button>
                    <button class="btn-danger" onclick="deleteBot('${number}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }
    list.innerHTML = html;
}

// ============== MODAL FUNCTIONS ==============

function openConnectModal() {
    document.getElementById('connectModal').classList.add('active');
}

function closeConnectModal() {
    document.getElementById('connectModal').classList.remove('active');
    document.getElementById('connectNumber').value = '';
}

function openConfigModal(number) {
    const modal = document.getElementById('configModal');
    const content = document.getElementById('configContent');
    
    content.innerHTML = `
        <input type="hidden" id="configNumber" value="${number}">
        <div class="form-group">
            <label>Auto Typing</label>
            <select id="configAutoTyping">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
            </select>
        </div>
        <div class="form-group">
            <label>Auto Recording</label>
            <select id="configAutoRecording">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
            </select>
        </div>
        <div class="form-group">
            <label>Auto React</label>
            <select id="configAutoReact">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
            </select>
        </div>
        <div class="form-group">
            <label>Read Messages</label>
            <select id="configReadMsg">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
            </select>
        </div>
        <div class="form-group">
            <label>Anti Call</label>
            <select id="configAntiCall">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
            </select>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeConfigModal() {
    document.getElementById('configModal').classList.remove('active');
}

// ============== BOT MANAGEMENT FUNCTIONS ==============

async function connectBot() {
    const number = document.getElementById('connectNumber').value.trim();
    if (!number) {
        addLog('Please enter a number', 'error');
        return;
    }

    addLog(`Connecting bot for ${number}...`, 'info');
    const result = await fetchAPI(`/code?number=${number}`);
    
    if (result?.code) {
        addLog(`✅ Pairing code generated: ${result.code}`, 'success');
        alert(`📱 Your Pairing Code:\n\n${result.code}\n\nUse this code to pair your WhatsApp account.`);
    } else if (result?.status === 'already_connected') {
        addLog(`⚠️ Number already connected`, 'warning');
        alert('This number is already connected!');
    } else {
        addLog(`Failed to generate pairing code`, 'error');
    }
    closeConnectModal();
}

async function connectAll() {
    if (!confirm('Connect all bots from database?')) return;
    addLog('Starting connect-all process...', 'warning');
    const result = await fetchAPI('/connect-all');
    if (result?.total) {
        addLog(`✅ Initiated connections for ${result.total} bots`, 'success');
        setTimeout(refreshDashboard, 2000);
    }
}

async function deleteBot(number) {
    if (!confirm(`⚠️ Delete bot ${number}? This cannot be undone.`)) return;
    addLog(`Deleting bot ${number}...`, 'warning');
    const result = await fetchAPI(`/disconnect?number=${number}`);
    if (result?.status === 'success') {
        addLog(`✅ Bot deleted: ${number}`, 'success');
        refreshDashboard();
    } else {
        addLog(`Failed to delete ${number}`, 'error');
    }
}

async function showStats(number) {
    addLog(`Fetching stats for ${number}...`, 'info');
    const stats = await fetchAPI(`/stats?number=${number}`);
    if (stats?.stats) {
        const msg = `📊 Stats for ${number}:\n\nMessages: ${stats.stats.messagesReceived}\nCommands: ${stats.stats.commandsUsed}\nGroups: ${stats.stats.groupsInteracted}`;
        alert(msg);
        addLog(`Stats retrieved for ${number}`, 'success');
    }
}

async function saveConfig() {
    const number = document.getElementById('configNumber').value;
    const config = {
        AUTO_TYPING: document.getElementById('configAutoTyping').value,
        AUTO_RECORDING: document.getElementById('configAutoRecording').value,
        AUTO_REACT: document.getElementById('configAutoReact').value,
        READ_MESSAGE: document.getElementById('configReadMsg').value,
        ANTI_CALL: document.getElementById('configAntiCall').value
    };

    addLog(`Updating config for ${number}...`, 'info');
    const result = await fetchAPI(`/update-config?number=${number}&config=${JSON.stringify(config)}`);
    
    if (result?.status === 'otp_sent') {
        addLog(`✅ OTP sent to ${number}`, 'success');
        const otp = prompt('Enter OTP received in WhatsApp:');
        if (otp) {
            const verify = await fetchAPI(`/verify-otp?number=${number}&otp=${otp}`);
            if (verify?.status === 'success') {
                addLog(`✅ Config updated for ${number}`, 'success');
            } else {
                addLog(`Invalid OTP`, 'error');
            }
        }
    }
    closeConfigModal();
}

// ============== UTILITY FUNCTIONS ==============

function autoRefreshToggle() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        addLog('Auto-refresh disabled', 'warning');
    } else {
        autoRefreshInterval = setInterval(refreshDashboard, 5000);
        addLog('Auto-refresh enabled (5s interval)', 'success');
    }
}

function formatUptime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
}

// ============== INITIALIZATION ==============

window.addEventListener('load', () => {
    const sessionToken = localStorage.getItem('patron_session');
    if (sessionToken) {
        showDashboard();
        addLog('Dashboard loaded', 'success');
        refreshDashboard();
        setInterval(refreshDashboard, 10000);
    }
});
