export default class SFConnection {

    #sid = null;

    constructor(host, sid) {
        this.#sid = sid;
        this.host = `https://${host}`;
        this.getUserInfo();
    }

    async #post(endpoint, body = {}) {
        return await this.#sendRequest(endpoint, 'POST', body);
    }

    async #get(endpoint) {
        return await this.#sendRequest(endpoint, 'GET');
    }

    async #sendRequest(endpoint, method, body = null) {
        const url = `${this.host}${endpoint}`;

        const headers = {
            'Authorization': `Bearer ${this.#sid}`,
            'Content-Type': 'application/json'
        };

        const options = {
            method,
            headers,
        };

        if (body && method === 'POST') {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error in ${method} request:`, error);
            throw error;
        }
    }

    #userInfo = null;
    async getUserInfo() {
        if (!this.#userInfo) {
            this.#userInfo = await this.#get('/services/oauth2/userinfo');
        }
        return this.#perpUserInfo(this.#userInfo);
    }

    #perpUserInfo(info) {
        return {
            name: info.name,
            username: info.preferred_username
        }
    }

}