const CONFIG = require('../config');

class BaseManager {
    constructor(options) {
        const { mediator, db, io, answer, common } = options;
        
        this.answer = answer;
        this.mediator = mediator;
        this.db = db;
        this.io = io;
        this.common = common;

        this.EVENTS = this.mediator.getEventTypes();
        this.TRIGGERS = this.mediator.getTriggerTypes();
		this.SOCKETS = CONFIG.SOCKET;
    }

    async send(url, data=null, method='POST') {
		
		console.log('send to', url, data);
		
        try {
            const params = {
                method,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
            }
            if (data) {
                params.body = JSON.stringify(data);
            }
            const res = await fetch(url, params);
			
			console.log('res', res);
			
            const answer = await res.json();
			
			console.log('answer', answer);
			
            if (answer && answer.result === 'ok') {
                return answer.data;
            }
            return null;
        } catch (error) {
            console.log(error);
            return null; 
        }
    }

    sendToMushroomsEconomy(urlPart, data=null) {
        this.send(`${CONFIG.MUSHROOMS_ECONOMY.URL}${urlPart}`, data);
    }

    sendToMushroomsArmy(urlPart, data=null) {
        this.send(`${CONFIG.MUSHROOMS_ARMY.URL}${urlPart}`, data);
    }

    sendToPeopleArmy(urlPart, data=null) {
        this.send(`${CONFIG.PEOPLE_ARMY.URL}${urlPart}`, data);
    }

    sendToPeopleEconomy(urlPart, data=null) {
        this.send(`${CONFIG.PEOPLE_ECONOMY.URL}${urlPart}`, data);
    }

    sendToMap(urlPart, data=null) {
        this.send(`${CONFIG.MAP.URL}${urlPart}`, data);
    }
}

module.exports = BaseManager;