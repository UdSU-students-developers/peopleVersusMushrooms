const CONFIG = require("../../config");

class BaseManager {
    constructor({ mediator, db, common, io, answer }) {
        this.db = db;
        this.mediator = mediator;
        this.common = common;
        this.io = io;
        this.answer = answer; 
        this.EVENTS = mediator.getEventTypes();
        this.TRIGGERS = mediator.getTriggerTypes();
        this.MESSAGES = CONFIG.MESSAGES;
    }

    async send(url, data=null, method='POST') {
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
            const answer = await res.json();
            if (answer && answer.result === 'ok') {
                return answer.data;
            }
            return null;
        } catch (error) {
            console.log(error);
            return null; 
        }
    }


    sendToMap(urlPart, data=null) {
        this.send(`${CONFIG.URL.MAP}${urlPart}`, data);
    }

    sendToPeopleArmy(urlPart, data=null) {
        this.send(`${CONFIG.URL.PEOPLE_ARMY}${urlPart}`, data);
    }

    sendToMushroomsEconomy(urlPart, data=null) {
        this.send(`${CONFIG.URL.MUSHROOM_ECONOMY}${urlPart}`, data);
    }

    sendToMushroomsArmy(urlPart, data=null) {
        this.send(`${CONFIG.URL.MUSHROOM_ARMY}${urlPart}`, data);
    }

}

module.exports = BaseManager;