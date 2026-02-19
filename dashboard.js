// PATRON-MD Admin Dashboard - Main JavaScript
// ============================================

const API_BASE = '';
let autoRefreshInterval = null;
let statsChart = null;
let isLoggedIn = false;

// ============== LOGIN FUNCTIONS ==============

function login() {
    try {
        console.log('=== LOGIN ATTEMPT STARTED ===');
        const passwordInput = document.getElementById('passwordInput');
        console.log('Password input element:', passwordInput);
        
        if (!passwordInput) {
            console.error('❌ Password input element not found');
            showError('❌ Error: Password input element not found');
            return;
        }
        
        const passwordValue = passwordInput.value.trim();
        console.log('Password length:', passwordValue.length);
        
        if (!passwordValue) {
            console.warn('⚠️ Password field is empty');
            showError('⚠️ Please enter a password');
            passwordInput.focus();
            return;
        }

        const expectedPassword = 'maximus0000';
        console.log('Expected password:', expectedPassword);
        console.log('Entered password:', '**'.repeat(Math.max(passwordValue.length / 2, 1)));
        console.log('Password match:', passwordValue === expectedPassword);

        if (passwordValue === expectedPassword) {
            console.log('✅ Password correct!');
            localStorage.setItem('patron_session', 'authenticated');
            localStorage.setItem('loginTime', new Date().toISOString());
            passwordInput.value = '';
            showDashboard();
            console.log('Dashboard shown successfully');
            addLog('✅ Admin logged in successfully', 'success');
            refreshDashboard();
            const refreshInterval = setInterval(refreshDashboard, 10000);
            console.log('Auto-refresh started with interval:', refreshInterval);
        } else {
            console.warn('❌ Password incorrect');
            showError('❌ Invalid password');
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        console.error('Stack:', error.stack);
        showError('❌ Login error: ' + error.message);
    }
}

function showError(message) {
    try {
        console.log('📢 Showing error message:', message);
        const errorDiv = document.getElementById('errorMessage');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            console.log('✅ Error message displayed');
            
            // Remove after 4 seconds
            setTimeout(() => {
                errorDiv.classList.remove('show');
                console.log('Error message hidden');
            }, 4000);
        } else {
            console.error('❌ Error div with id "errorMessage" not found');
            // Fallback to alert
            alert(message);
        }
    } catch (error) {
        console.error('❌ Error displaying error message:', error);
        alert(message); // Final fallback
    }
}

function showDashboard() {
    try {
        console.log('🎯 Attempting to show dashboard');
        isLoggedIn = true;
        
        const loginContainer = document.getElementById('loginContainer');
        const dashboardContainer = document.getElementById('dashboardContainer');
        
        console.log('Login container found:', !!loginContainer);
        console.log('Dashboard container found:', !!dashboardContainer);
        
        if (!loginContainer || !dashboardContainer) {
            console.error('❌ Required containers not found in DOM');
            return;
        }
        
        // Hide login
        loginContainer.style.display = 'none';
        console.log('✅ Login container hidden');
        
        // Show dashboard
        dashboardContainer.classList.remove('dashboard-hidden');
        dashboardContainer.style.display = 'block';
        console.log('✅ Dashboard container displayed');
        
    } catch (error) {
        console.error('❌ Error showing dashboard:', error);
        console.error('Stack:', error.stack);
    }
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
        
        // Add timestamp to prevent caching
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${API_BASE}${endpoint}${separator}t=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        });
        
        
        if (response.status === 304) {
            console.warn('⚠️ Got 304 Not Modified - retrying without cache');
            // Retry without any cache headers
            const retryResponse = await fetch(url, { cache: 'reload' });
            if (!retryResponse.ok) throw new Error(`HTTP ${retryResponse.status}`);
            const data = await retryResponse.json();
            console.log('✅ Retry successful:', data);
            return data;
        }
        
        if (response.status === 401) {
            console.error('❌ Unauthorized (401)');
            logout();
            throw new Error('Unauthorized');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ API Error on ${endpoint}:`, error);
        addLog(`❌ Failed to fetch ${endpoint}: ${error.message}`, 'error');
        return null;
    }
}

// ============== LOGGING FUNCTIONS ==============

function addLog(message, type = 'info') {
    try {
        const logArea = document.getElementById('logArea');
        if (!logArea) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        const time = new Date().toLocaleTimeString();
        const logLine = document.createElement('div');
        logLine.className = `log-line log-${type}`;
        logLine.textContent = `[${time}] ${message}`;
        logArea.appendChild(logLine);
        logArea.scrollTop = logArea.scrollHeight;
    } catch (error) {
        console.error('Error adding log:', error);
    }
}

function clearLogs() {
    try {
        const logArea = document.getElementById('logArea');
        if (logArea) {
            logArea.innerHTML = '';
            addLog('Logs cleared', 'info');
        }
    } catch (error) {
        console.error('Error clearing logs:', error);
    }
}

// ============== DASHBOARD REFRESH ==============

async function refreshDashboard() {
    addLog('Refreshing dashboard...', 'info');
    
    // Fetch overall stats
    const overallStats = await fetchAPI('/stats-overall');
    if (overallStats) {
        const totalActive = overallStats.totalActive || 0;
        const totalMessages = overallStats.totalMessages || 0;
        const totalCommands = overallStats.totalCommands || 0;
        const serverUptime = overallStats.serverUptime || 0;
        
        
        document.getElementById('totalActive').textContent = totalActive;
        document.getElementById('totalMessages').textContent = totalMessages.toLocaleString();
        document.getElementById('totalCommands').textContent = totalCommands.toLocaleString();
        document.getElementById('serverUptime').textContent = formatUptime(serverUptime);
    } else {
        console.error('❌ Failed to fetch overall stats');
    }

    // Fetch connections
    const connections = await fetchAPI('/active');
    if (connections) {
        displayConnections(connections.numbers || []);
    } else {
        console.error('❌ Failed to fetch active connections');
    }

    // Update last refresh time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Last update: ${now.toLocaleTimeString()}`;
    addLog('✅ Dashboard refreshed successfully', 'success');
}

async function displayConnections(numbers) {
    const list = document.getElementById('connectionsList');
    
    if (numbers.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999;">No active connections</p>';
        return;
    }

    let html = '';
    for (const number of numbers) {
        try {
            let status = await fetchAPI(`/status?number=${number}`);
            
            // RETRY logic - if uptime is 0 but isConnected is true, wait and retry
            if (status && status.isConnected === true && status.uptime === 0) {
                console.warn(`⚠️ Uptime is 0 for connected bot ${number}, retrying in 500ms...`);
                await new Promise(resolve => setTimeout(resolve, 500));
                status = await fetchAPI(`/status?number=${number}`);
            }
            
            
            if (!status) {
                console.warn(`No response for ${number}, marking as offline`);
                html += `
                    <div class="connection-item disconnected">
                        <div class="connection-item-header">
                            <div class="connection-item-number">📞 ${number}</div>
                            <span class="status-badge offline">
                                ❌ Failed to fetch status
                            </span>
                        </div>
                        <div class="connection-item-info">
                            <div>⏱️ Uptime: --</div>
                            <div>📅 --</div>
                        </div>
                        <div class="connection-item-actions">
                            <button class="btn-danger" onclick="deleteBot('${number}')">🗑️ Delete</button>
                        </div>
                    </div>
                `;
                continue;
            }
            
            const isConnected = status.isConnected === true;
            const uptime = status.uptime ? formatUptime(status.uptime) : '0s';
            
            // Add alert if connected but uptime shows 0
            if (isConnected && status.uptime === 0) {
                console.error(`🔴 ERROR: Bot ${number} is connected but uptime is still 0!`);
                addLog(`⚠️ Warning: ${number} connected but uptime=0. Check server logs.`, 'warning');
            }
            
            
            html += `
                <div class="connection-item ${isConnected ? 'connected' : 'disconnected'}">
                    <div class="connection-item-header">
                        <div class="connection-item-number">📞 ${number}</div>
                        <span class="status-badge ${isConnected ? 'online' : 'offline'}">
                            ${isConnected ? '🟢 Online' : '🔴 Offline'}
                        </span>
                    </div>
                    <div class="connection-item-info">
                        <div>⏱️ Uptime: ${uptime}</div>
                        <div>📅 ${status.connectionTime || '--'}</div>
                    </div>
                    <div class="connection-item-actions">
                        <button class="btn-info" onclick="showStats('${number}')">📊 Stats</button>
                        <button class="btn-info" onclick="openConfigModal('${number}')">⚙️ Config</button>
                        <button class="btn-danger" onclick="deleteBot('${number}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(`Error fetching status for ${number}:`, error);
            html += `
                <div class="connection-item disconnected">
                    <div class="connection-item-header">
                        <div class="connection-item-number">📞 ${number}</div>
                        <span class="status-badge offline">
                            ⚠️ Error fetching
                        </span>
                    </div>
                    <div class="connection-item-info">
                        <div>⏱️ Uptime: --</div>
                        <div>📅 --</div>
                    </div>
                    <div class="connection-item-actions">
                        <button class="btn-danger" onclick="deleteBot('${number}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }
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
    try {
        console.log(`📊 Fetching stats for ${number}...`);
        addLog(`📊 Fetching stats for ${number}...`, 'info');
        
        const response = await fetchAPI(`/stats?number=${number}`);
        console.log(`📊 Stats response:`, response);
        
        if (!response) {
            console.error('No response from stats API');
            addLog(`❌ Failed to fetch stats for ${number}`, 'error');
            alert('❌ Failed to fetch stats');
            return;
        }
        
        const stats = response.stats;
        const connectionStatus = response.connectionStatus;
        const uptime = response.uptime;
        
        if (!stats) {
            console.error('Stats object missing from response');
            addLog(`❌ No stats data available for ${number}`, 'error');
            alert('❌ No stats data available');
            return;
        }
        
        const messagesReceived = stats.messagesReceived || 0;
        const commandsUsed = stats.commandsUsed || 0;
        const groupsInteracted = stats.groupsInteracted || 0;
        
        console.log('Parsed stats:', { messagesReceived, commandsUsed, groupsInteracted });
        
        const msg = `📊 STATISTICS FOR ${number}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 Messages Received: ${messagesReceived.toLocaleString()}
🎯 Commands Used: ${commandsUsed.toLocaleString()}
👥 Groups Interacted: ${groupsInteracted.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Status: ${connectionStatus}
⏱️ Uptime: ${formatUptime(uptime)}`;
        
        alert(msg);
        addLog(`✅ Stats retrieved for ${number}`, 'success');
    } catch (error) {
        console.error('❌ Error in showStats:', error);
        addLog(`❌ Error fetching stats: ${error.message}`, 'error');
        alert('❌ Error fetching stats: ' + error.message);
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard script loaded - DOMContentLoaded');
    
    // Attach login button click event
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        console.log('Login button found, attaching event listener');
        loginBtn.addEventListener('click', (e) => {
            console.log('Login button clicked via addEventListener');
            e.preventDefault();
            login();
        });
    } else {
        console.error('Login button not found in DOM');
    }
    
    // Attach Enter key listener to password input
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed in password field');
                login();
            }
        });
    }
    
    const sessionToken = localStorage.getItem('patron_session');
    if (sessionToken) {
        console.log('Session token found, showing dashboard');
        showDashboard();
        addLog('Dashboard loaded', 'success');
        refreshDashboard();
        setInterval(refreshDashboard, 10000);
    } else {
        console.log('No session token found, showing login');
    }
});

window.addEventListener('load', () => {
    console.log('Window load event fired');
    const sessionToken = localStorage.getItem('patron_session');
    if (sessionToken) {
        console.log('Session token found on window load');
        showDashboard();
        addLog('Dashboard loaded', 'success');
        refreshDashboard();
        setInterval(refreshDashboard, 10000);
    }
});
