const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const accessToken = process.env.TMDB_ACCESS_TOKEN;
const apiKey = process.env.TMDB_API_KEY;
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());

async function getGenreNames(mediaType) {
    const response = await axios.get(
        `https://api.themoviedb.org/3/genre/${mediaType}/list`,
        {
            params: {
                api_key: apiKey,
            },
        }
    );

    const genres = response.data.genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
    }, {});

    return genres;
}

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

        const genreNamesMovies = await getGenreNames('movie');
        const genreNamesTV = await getGenreNames('tv');

        const enrichedData = response.data.results.map((result) => {
            const genreNames =
                result.media_type === 'movie' ? genreNamesMovies : genreNamesTV;
            const genres = result.genre_ids.map(
                (genreId) => genreNames[genreId]
            );

            return {
                ...result,
                genres,
            };
        });

        res.json({ results: enrichedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running`);
});

module.exports = app;

module.exports = app;
