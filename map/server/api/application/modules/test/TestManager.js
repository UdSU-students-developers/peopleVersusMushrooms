class TestManager {
    constructor({ mediator, db }) { 
        this.db = db;
        this.mediator = mediator;

        const events = mediator.getEventTypes();
        const triggers = mediator.getTriggerTypes();

        // Устанавливаем обработчики для триггеров
        mediator.set(triggers.TEST, (params) => this.test(params));
        mediator.set(triggers.TESTDB, (params) => this.testDB(params));
    }

    async test(params) {
        const { data1, data2 } = params;

        return `вы ввели: ${data1} и ${data2}`;;
    }

    async testDB(params) {
        const { userId } = params;

        const user = await this.db.getUserById(userId);
    
        if (!user) {
            return {error: 1001};
        }

        return user.name;
    }

    /*test.db:
    1 - Oleg
    2 - Max
    3 - Petr
    */

}

module.exports = TestManager;