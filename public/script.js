async function fetchBackend(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`/.netlify/functions/${endpoint}`, options);
    return response.json();
}
