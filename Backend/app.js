import 'dotenv/config';
import express from 'express';
import finikRouter from './src/routes/finikRoutes.js';
import ngrok from 'ngrok';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(finikRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Finik handler на порту ${PORT}`);

  try {
    const url = await ngrok.connect({
      proto: 'http',
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
      hostname: process.env.NGROK_HOST,
    });
    console.log(`ngrok tunnel доступен по адресу: ${url}`);
  } catch (err) {
    console.error('Не удалось запустить ngrok:', err);
  }
});
