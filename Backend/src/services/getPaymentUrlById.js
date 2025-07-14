import axios from 'axios';


/**
 * Получает PAYMENT_URL по PAYMENT_ID из Finik
 * @param {string} paymentId - EXTERNAL_PAYMENT_ID, который Bitrix передаёт при повторном запросе
 * @returns {{ PAYMENT_ID: string, PAYMENT_URL: string }}
 */
export async function getPaymentUrlById(paymentId, finikConfig) {
  const query = `
    query GetItem($input: ServiceInput!) {
      getItem(input: $input) {
        id
        qrCode {
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      id: paymentId
    }
  };

  const response = await axios.post(
    finikConfig.apiUrl,
    {
      query,
      variables,
      operationName: 'GetItem'
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': finikConfig.apiKey,
      }
    }
  );

  if (response.data?.errors?.length) {
    throw new Error(`Finik API error: ${response.data.errors[0].message}`);
  }

  const item = response.data?.data?.getItem;
  if (!item || !item.qrCode?.url) {
    throw new Error(`Не удалось получить ссылку оплаты по PAYMENT_ID: ${paymentId}`);
  }

  let url = item.qrCode.url;
  if (!url.startsWith('http')) {
    url = `https://qr.finik.kg/${url.replace(/^\/+/, '')}`;
  }

  return {
    PAYMENT_ID: item.id,
    PAYMENT_URL: url
  };
}
