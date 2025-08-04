// netlify/functions/proxy.js

// Используем библиотеку для запросов. 
// Netlify автоматически установит ее при сборке, если она указана в package.json, 
// но для простоты можно обойтись встроенным fetch.
// Здесь мы используем node-fetch для большей совместимости.
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Получаем путь запроса. Он будет выглядеть как /proxy/api.themoviedb.org/3/search/movie...
  let apiUrl = event.path.replace('/proxy/', '');

  // Если в URL нет протокола, добавляем https://
  if (!apiUrl.startsWith('http')) {
    apiUrl = 'https://' + apiUrl;
  }
  
  // Добавляем параметры запроса (например, ?api_key=...)
  const params = new URLSearchParams(event.queryStringParameters).toString();
  if (params) {
    apiUrl += '?' + params;
  }

  try {
    const response = await fetch(apiUrl, {
      method: event.httpMethod,
      headers: {
        // Пересылаем важный заголовок для API Кинопоиска
        'X-API-KEY': event.headers['x-api-key'] || '',
        'Accept': 'application/json'
      },
      // Пересылаем тело запроса, если оно есть (для POST запросов)
      body: event.body
    });

    const data = await response.text();
    
    // Возвращаем ответ от API обратно клиенту
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: data,
    };

  } catch (error) {
    console.error('Ошибка прокси-сервера:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка на стороне прокси-сервера Netlify' }),
    };
  }
};