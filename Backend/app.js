import 'dotenv/config';
import express from 'express';
import finikRouter from './src/routes/finikRoutes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(finikRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Finik handler на порту ${PORT}`));