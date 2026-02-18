const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3015;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pairRouter = require('./popkid');
app.use('/', pairRouter);

app.listen(port, '0.0.0.0', async () => {
    try {
        const ipRes = await axios.get('https://api.ipify.org?format=json');
        const ip = ipRes.data.ip;

        console.log(`🚀 Server running!`);
        console.log(`Local:  http://localhost:${port}`);
        console.log(`Public: http://${ip}:${port}`);
    } catch (error) {
        console.log(`🚀 Server running on port ${port}`);
        console.log('⚠️ Could not fetch public IP');
    }
});

module.exports = app;