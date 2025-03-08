import express, { Application, Request, Response } from 'express'
const app: Application = express();

require('dotenv').config()

const PORT = process.env.PORT;

app.get('/', (req: Request, res: Response): void => {
    res.send("Hello world");
    res.end();
});

app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
})