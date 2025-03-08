const express = require('express');
const app = express();
require('dotenv').config()

const PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.send("Hello world");
    res.end();
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})