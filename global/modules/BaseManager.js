const GLOBAL_CONFIG = require('../globalConfig');

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
		this.SOCKET = GLOBAL_CONFIG.SOCKET;
    }

    _log(data) {
        let str = JSON.stringify(data, null, 2);
        if (str.length > 200) str = str.substring(0, 200) + '...';
        return str;
    }

    async send(url, data=null, method='POST') {
		
        console.log('========================================');
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
			
			//console.log('res', res);
			
            const answer = await res.json();
			
			//console.log('\nanswer', this._log(answer));
            console.log('========================================');
			
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
        return this.send(`${GLOBAL_CONFIG.MUSHROOMS_ECONOMY.URL}${urlPart}`, data);
    }

    sendToMushroomsArmy(urlPart, data=null) {
        return this.send(`${GLOBAL_CONFIG.MUSHROOMS_ARMY.URL}${urlPart}`, data);
    }

    sendToPeopleArmy(urlPart, data=null) {
        return this.send(`${GLOBAL_CONFIG.PEOPLE_ARMY.URL}${urlPart}`, data);
    }

    sendToPeopleEconomy(urlPart, data=null) {
        return this.send(`${GLOBAL_CONFIG.PEOPLE_ECONOMY.URL}${urlPart}`, data);
    }

    sendToMap(urlPart, data=null) {
        return this.send(`${GLOBAL_CONFIG.MAP.URL}${urlPart}`, data);
    }
}

module.exports = BaseManager;