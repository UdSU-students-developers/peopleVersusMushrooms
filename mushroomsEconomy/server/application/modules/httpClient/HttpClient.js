// HttpClient.js
const axios = require('axios');

class HttpClient {
    constructor(baseURL, serviceName) {
        this.client = axios.create({
            baseURL: baseURL,
            timeout: 5000, // 5 секунд ждем ответ
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.serviceName = serviceName;
    }

    async get(path) {
        const response = await this.client.get(path);
        return response.data;
    }

    async post(path, data) {
        const response = await this.client.post(path, data);
        return response.data;
    }

    async put(path, data) {
        const response = await this.client.put(path, data);
        return response.data;
    }

    async delete(path) {
        const response = await this.client.delete(path);
        return response.data;
    }
}

module.exports = HttpClient;