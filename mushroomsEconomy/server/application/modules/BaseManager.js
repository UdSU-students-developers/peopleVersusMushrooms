const CONFIG = require('../../config.js');

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
		this.SOCKETS = CONFIG.SOCKET; //Если будете смотреть код ИС, то у них это MESSAGES
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

    async sendToMushroomsArmy(urlPart, data=null) {
        await this.send(`${CONFIG.MUSHROOMS_ARMY_URL}${urlPart}`, data);
    }
}

module.exports = BaseManager;