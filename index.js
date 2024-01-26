const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const accessToken = process.env.TMDB_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());

app.get('/', (req, res) => {
    res.json('Hello World!');
});

app.get('/data', async (req, res) => {
    try {
        const searchTerm = req.query.query;

        if (!searchTerm) {
            return res
                .status(400)
                .json({ error: 'Query parameter "query" is required' });
        }

        const options = {
            method: 'GET',
            url: `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
                searchTerm
            )}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        };

        const response = await axios.request(options);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running`);
});

module.exports = app;
