import { createPayment } from '../services/finikService.js';
import { getPaymentUrlById } from '../services/getPaymentUrlById.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FINIK_API_URL = process.env.FINIK_API_URL;
export async function handleCheckout(req, res) {
  try {
    console.log(req.body);
    const { BX_SYSTEM_PARAMS, FINIK_KEY, FINIK_ACCOUNT_ID } = req.body;

    if (!BX_SYSTEM_PARAMS || !FINIK_API_URL || !FINIK_KEY || !FINIK_ACCOUNT_ID) {
      return res.status(400).json({
        PAYMENT_ERRORS: ['Недостаточно параметров для создания оплаты']
      });
    }

    const { PAYMENT_ID, SUM, EXTERNAL_PAYMENT_ID } = BX_SYSTEM_PARAMS;

    const finikConfig = {
      apiUrl: FINIK_API_URL,
      apiKey: FINIK_KEY,
      accountId: FINIK_ACCOUNT_ID,
      callbackBaseUrl: process.env.CALLBACK_BASE_URL // всё ещё можно оставить из .env
    };
    if (EXTERNAL_PAYMENT_ID) {
      const { PAYMENT_URL } = await getPaymentUrlById(EXTERNAL_PAYMENT_ID, finikConfig);
      return res.json({
        PAYMENT_ID: EXTERNAL_PAYMENT_ID,
        PAYMENT_URL
      });
    }

    const { PAYMENT_ID: id, PAYMENT_URL } = await createPayment(PAYMENT_ID, parseFloat(SUM), finikConfig);
    return res.json({ PAYMENT_ID: id, PAYMENT_URL });

  } catch (err) {
    console.error('Ошибка:', err);
    return res.status(500).json({
      PAYMENT_ERRORS: [`Ошибка создания оплаты: ${err.message}`]
    });
  }
}


export async function getQrPage(req, res) {
  const { ORDER, SUM } = req.query;
  if (!ORDER || !SUM) {
    return res.status(400).send('ORDER and SUM query parameters are required');
  }

  try {
    // createPayment отдаёт { PAYMENT_ID, PAYMENT_URL }
    const { PAYMENT_URL } = await createPayment(ORDER, parseFloat(SUM));
    return res.redirect(PAYMENT_URL);
  } catch (err) {
    console.error('QR redirect error:', err);
    return res.status(500).send('Ошибка перенаправления на страницу оплаты');
  }
}


export async function handleNotify(req, res) {
  const payment = req.body;
  console.log('Webhook от Finik:', payment);

  const accountId = payment.accountId;

  let companies = [];
  try {
    const filePath = path.join(__dirname, '..', '..', 'companies.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    companies = JSON.parse(fileContent);
  } catch (err) {
    console.error('Ошибка при чтении companies.json:', err.message);
    return res.status(500).send('Config error');
  }


  // Поиск компании по accountId
  const company = companies.find(c => c.ID === accountId);
  console.log(company);

  if (!company) {
    console.warn('Компания не найдена для accountId:', accountId);
    return res.status(404).send('Company not found');
  }

  // Проверка успешности платежа
  if (payment.status === 'SUCCEEDED') {
    const orderId = payment.item?.id?.split('_order-')[1];

    if (!orderId) {
      console.warn('Невозможно извлечь ID заказа из item.id:', payment.item?.id);
      return res.status(400).send('Invalid item ID');
    }

    // Основной вызов Bitrix24 API для пометки оплаты
    try {
      const result = await axios.post(`${company.WEBHOOK}sale.paysystem.pay.payment`, {
        PAYMENT_ID: orderId,
        PAY_SYSTEM_ID: company.PAY_SYSTEM_ID,
      });

      console.log(`Оплата за заказ #${orderId} отмечена как "Оплачено" в Bitrix24.`);
      return res.status(200).send('OK');
    } catch (err) {
      console.error('Ошибка при вызове Bitrix24 API:', err.response?.data || err.message);
      return res.status(500).send('Bitrix webhook error');
    }
  } else {
    console.warn('Платёж не прошёл (статус):', payment.status);
    return res.status(200).send('Ignored');
  }
}

