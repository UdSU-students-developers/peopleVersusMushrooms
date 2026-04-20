const Worker = require('./Worker');
const CONFIG = require("../../../../config");

const { HP, SPEED } = CONFIG.ECONOMY.WORKER;

describe("Worker", () => {
    test("Необходимо создать работника с правильным HP", () => {
        const worker = new Worker({});
        expect(worker.hp).toBe(HP);
    });

    test("Необходимо создать работника с правильным SPEED", () => {
        const worker = new Worker({});
        expect(worker.speed).toBe(123456);
    });
    //Дописать!!!!!!!!!
});