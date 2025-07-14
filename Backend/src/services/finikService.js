import axios from 'axios';


/**
 * Создаёт платеж в Finik и возвращает его идентификатор и полный URL для оплаты
 * @param {string|number} orderId 
 * @param {number} sum 
 * @returns {{ PAYMENT_ID: string, PAYMENT_URL: string }}
 */
export async function createPayment(orderId, sum, finikConfig) {
  const {
    apiUrl,
    apiKey,
    accountId,
    callbackBaseUrl
  } = finikConfig;

  const query = `
    mutation CreateItem($input: CreateItemInput!) {
      createItem(input: $input) {
        id
        qrCode { url }
      }
    }
  `;

  const variables = {
    input: {
      account: { id: accountId },
      callbackUrl: `${callbackBaseUrl}`,
      fixedAmount: sum,
      name_en: `order-${orderId}`,
      requestId: `order-${orderId}`,
      status: "ENABLED",
      maxAvailableQuantity: 1
    }
  };

  const resp = await axios.post(
    apiUrl,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      }
    }
  );

  if (resp.data?.errors?.length) {
    throw new Error(`Finik API error: ${resp.data.errors[0].message}`);
  }

  const item = resp.data?.data?.createItem;
  if (!item || !item.qrCode?.url) {
    throw new Error('Не удалось получить URL оплаты');
  }

  let url = item.qrCode.url;
  if (!url.startsWith('http')) {
    url = `https://qr.finik.kg/${url.replace(/^\/+/, '')}`;
  }

  return {
    PAYMENT_ID: item.id,
    PAYMENT_URL: url
    // также есть FINIK_PAID: которая 'N' нужно будет возвратить "Y" когда сделка будет оплачена получаетья он должен тут ждать?
  };
}

