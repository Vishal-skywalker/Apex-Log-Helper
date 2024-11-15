export default class SFConnection {

    #sid = null;

    constructor() {
        this.hostName = this.#getUrlSearchParam('host');
        this.host = `https://${this.hostName}`;
    }

    #getUrlSearchParam(name) {
        const search = new URLSearchParams(window.location.search);
        return search.get(name) ?? '';
    }

    async init() {
        let message = await new Promise(resolve =>
            chrome.runtime.sendMessage({ message: "getSession", sfHost: this.hostName }, resolve)
        );
        this.#sid = message.key;
        return this;
    }

    async post(endpoint, body = {}) {
        return await this.#sendRequest(endpoint, 'POST', body);
    }

    async get(endpoint) {
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
            this.#userInfo = await this.get('/services/oauth2/userinfo');
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