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
        `https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${apiKey}`
    );

    const genres = response.data.genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
    }, {});

    return genres;
}

async function getTrailer(id, mediaType) {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${apiKey}`
        );

        const trailerResults = response.data.results.filter(
            (result) => result.type === 'Trailer'
        );

        if (trailerResults.length > 0) {
            const lastTrailer = trailerResults[trailerResults.length - 1];

            const { key, size } = lastTrailer;

            return { key, size };
        } else {
            throw new Error('No trailers found');
        }
    } catch (error) {
        console.error('Error fetching trailer:', error.message);
        throw new Error('Failed to fetch trailer');
    }
}

app.get('/', (req, res) => {
    res.json('Welcome to Trailerix backend! 🚀');
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

        const enrichedData = await Promise.all(
            response.data.results.map(async (result) => {
                try {
                    const genreNames =
                        result.media_type === 'movie'
                            ? genreNamesMovies
                            : genreNamesTV;
                    const trailer =
                        result.media_type === 'movie'
                            ? (await getTrailer(result.id, 'movie')) || {}
                            : (await getTrailer(result.id, 'tv')) || {};
                    const genres =
                        result.genre_ids && result.genre_ids.length
                            ? result.genre_ids.map(
                                  (genreId) => genreNames[genreId]
                              )
                            : [];

                    return {
                        ...result,
                        genres,
                        trailer,
                    };
                } catch (error) {
                    console.error('Error enriching data:', error.message);
                    return result; // Return the original result if there's an error
                }
            })
        );

        res.json({ results: enrichedData });
    } catch (error) {
        console.error(
            'Error:',
            error.response ? error.response.data : error.message
        );
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running`);
});

module.exports = app;
