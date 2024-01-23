const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();

const accessToken = process.env.TMDB_ACCESS_TOKEN;

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
                .json({ error: 'Query parameter is required' });
        }

        const options = {
            method: 'GET',
            url: `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
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

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
