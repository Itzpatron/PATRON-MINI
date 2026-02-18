# 🤖 PATRON-MD Admin Dashboard Guide

## 📋 Overview

The Admin Dashboard is a comprehensive control panel for managing your WhatsApp bots. It provides real-time monitoring, statistics, and configuration management through a web interface.

## 🚀 Quick Start

### Access the Dashboard

1. **Start your server** (in index.js or main file)
2. **Navigate to**: `http://localhost:3000/dashboard`
3. **Enter API Key** when prompted (default: from config.js)

### Set Your API Key

In your `.env` file or `config.js`:

```env
API_KEY=your-super-secure-key-here
```

**⚠️ IMPORTANT**: Change the default API key to something secure!

---

## 📊 Dashboard Features

### 1. **Real-Time Statistics**
- **Active Connections**: Number of currently online bots
- **Total Messages**: Cumulative messages processed
- **Commands Used**: Total command executions
- **Server Uptime**: How long the server has been running

### 2. **Active Connections Panel**
View all connected bots with:
- ✅ Connection status (Online/Offline)
- ⏱️ Uptime for each bot
- 📅 Connection timestamp
- 🎯 Individual actions:
  - **📊 Stats**: View bot statistics
  - **⚙️ Config**: Update bot configuration
  - **❌ Disconnect**: Disconnect a bot

### 3. **Bot Connection**
- **+ Connect Bot**: Generate pairing code for new bot
- **🔗 Connect All**: Connect all previously registered bots from MongoDB

### 4. **Configuration Management**
Update individual bot settings:
- Auto Typing (Show "typing" indicator)
- Auto Recording (Show "recording" indicator)
- Auto React (Auto-react to messages)
- Read Messages (Auto mark as read)
- Anti Call (Reject incoming calls)

**Process**:
1. Click ⚙️ Config on a bot
2. Adjust settings
3. Click "Save Config"
4. Enter OTP sent to WhatsApp
5. Configuration updated in MongoDB

### 5. **System Logs**
- Real-time system activity logging
- Filter by log type: Info, Success, Warning, Error
- Auto-scroll to latest entries
- **Clear Logs**: Remove all log entries
- **Auto Refresh**: Toggle automatic updates (5-second intervals)

---

## 🔌 API Endpoints

All endpoints require `?apiKey=YOUR_API_KEY` or `X-API-Key` header.

### Public Endpoints (No Auth)
```
GET /code?number=2348133729715
GET /ping
```

### Protected Endpoints (Require API Key)
```
GET /dashboard
GET /active
GET /status?number=2348133729715
GET /stats?number=2348133729715
GET /stats-overall
GET /disconnect?number=2348133729715
GET /connect-all
GET /update-config?number=2348133729715&config={...}
GET /verify-otp?number=2348133729715&otp=123456
```

---

## 🔐 Security

### Best Practices

1. **Change Default API Key**
   ```javascript
   // config.js
   API_KEY: process.env.API_KEY || 'CHANGE-THIS-VALUE'
   ```

2. **Use Environment Variables**
   ```env
   # .env file
   API_KEY=your-secure-random-key-here
   MONGODB_URI=your-mongo-connection
   ```

3. **Restrict Dashboard Access**
   - Only share dashboard URLs with trusted administrators
   - Change API key periodically
   - Monitor access logs

4. **HTTPS in Production**
   - Use HTTPS for dashboard in production
   - Add reverse proxy (nginx) with SSL

---

## 📈 Monitoring Tips

### Real-Time Monitoring
1. Enable "Auto Refresh" for live updates
2. Monitor "System Logs" for errors
3. Track "Active Connections" count
4. Watch "Commands Used" metric

### Troubleshooting

**Dashboard shows 0 active connections?**
- Check if bots are actually started
- Verify MongoDB connection
- Check server logs for errors

**API Key rejected?**
- Clear browser cache/localStorage
- Enter correct API key
- Check config.js for API_KEY setting

**Bots disconnect frequently?**
- Check internet connection
- Monitor error logs
- Verify WhatsApp account settings

---

## 📱 Bot Actions

### Connecting a New Bot
1. Click "+ Connect Bot"
2. Enter WhatsApp number (with country code)
3. Copy generated pairing code
4. Open WhatsApp → Settings → Linked Devices
5. Click "Link a device" and scan QR
6. Bot connects automatically

### Disconnecting a Bot
1. Click "❌ Disconnect" on the bot
2. Confirm action
3. Bot session deleted from MongoDB
4. Local session files cleaned up

### Updating Configuration
1. Click "⚙️ Config" on the bot
2. Modify desired settings
3. Click "Save Config"
4. Enter OTP from WhatsApp (5-minute validity)
5. Settings saved to MongoDB

---

## 🛠️ API Usage Examples

### Get Overall Stats
```bash
curl "http://localhost:3000/stats-overall?apiKey=YOUR_KEY"
```

Response:
```json
{
  "totalActive": 3,
  "totalMessages": 1250,
  "totalCommands": 380,
  "totalGroups": 45,
  "serverUptime": 86400
}
```

### Connect a Bot
```bash
curl "http://localhost:3000/code?number=2348133729715"
```

### Get Active Bots
```bash
curl "http://localhost:3000/active?apiKey=YOUR_KEY"
```

Response:
```json
{
  "count": 3,
  "numbers": ["2348133729715", "2347012345678", "2348076543210"]
}
```

---

## 📊 Statistics Explained

| Metric | Description |
|--------|-------------|
| **Active Connections** | Bots currently online and connected |
| **Total Messages** | All messages received across all bots |
| **Commands Used** | Total user commands executed |
| **Groups Interacted** | Total groups bot has interacted with |
| **Server Uptime** | Time since server started (format: Xh Ym Zs) |

---

## 🔄 Auto-Refresh Settings

- **Dashboard Auto-Refresh**: 10 seconds (default)
- **Logs Auto-Refresh**: 5 seconds (when enabled)
- **Stats Update**: On demand or auto

---

## 📝 Notes

- **MongoDB Required**: All bot data stored in MongoDB
- **Session Persistence**: Bots auto-reconnect after restart
- **OTP Expiry**: 5 minutes for configuration updates
- **Max Connections**: Limited by `MAX_CONNECTIONS` in popkid.js

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Dashboard blank | Check browser console for errors |
| API Key invalid | Clear localStorage and re-enter |
| Bots not showing | Restart server and check MongoDB |
| Cannot update config | Verify bot is connected and OTP valid |
| Connection keeps dropping | Check internet, update config, restart |

---

## 📞 Support

For issues or feature requests, check:
- Server logs for detailed error messages
- Browser console for frontend errors
- MongoDB connection status

---

**Happy botting! 🚀**
