/**
 * Медиатор — шина для обмена сообщениями между модулями без прямой связи.
 * Поддерживает события (много подписчиков, без возврата значения) и триггеры (один обработчик, с возвратом).
 */
class Mediator {
    /**
     * @param {object} options
     * @param {object} options.EVENTS — объект с именами событий (ключ: константа, значение: строка).
     * @param {object} options.TRIGGERS — объект с именами триггеров (ключ: константа, значение: строка).
     */
    constructor({ EVENTS, TRIGGERS }) {
        this.events = {};
        this.triggers = {};
        this.EVENTS = EVENTS;
        this.TRIGGERS = TRIGGERS;
        // Для каждого события — массив подписчиков (функций).
        Object.keys(this.EVENTS).forEach(key => this.events[this.EVENTS[key]] = []);
        // Для каждого триггера — заглушка, возвращающая null (пока никто не вызвал set).
        Object.keys(this.TRIGGERS).forEach(key => this.triggers[this.TRIGGERS[key]] = () => { return null; });
    }

    /** Возвращает объект с именами событий (EVENTS из конфига). */
    getEventTypes() {
        return this.EVENTS;
    }

    /**
     * Подписаться на событие. При call(name, data) функция func будет вызвана с data.
     * @param {string} name — имя события (из EVENTS).
     * @param {Function} func — обработчик, получит один аргумент data при вызове call.
     */
    subscribe(name, func) {
        if (this.events[name] && func instanceof Function) {
            this.events[name].push(func);
        }
    }

    /**
     * Отписаться от события: удалить одну ранее подписанную функцию.
     * @param {string} name — имя события.
     * @param {Function} _func — та же функция, что передавали в subscribe.
     */
    unsubscribe(name, _func) {
        if (!(this.events[name] && _func instanceof Function)) {
            return;
        }
        const handlerEntry = this.events[name]
            .map((func, i) => ([func, i]))
            .filter(([func]) => func === _func)[0];
        if (handlerEntry) {
            this.events[name].splice(handlerEntry[1], 1);
        }
    }

    /** Удалить всех подписчиков события (очистить массив обработчиков). */
    unsubscribeAll(name) {
        if (name && this.events[name]) {
            this.events[name] = [];
        }
    }

    /**
     * Вызвать событие: всем подписчикам передать data. Ничего не возвращает.
     * @param {string} name — имя события.
     * @param {*} data — данные, которые получат обработчики.
     */
    call(name, data) {
        if (this.events[name]) {
            this.events[name].forEach(event => {
                if (event instanceof Function) {
                    event(data);
                }
            });
        }
    }

    /** Возвращает объект с именами триггеров (TRIGGERS из конфига). */
    getTriggerTypes() {
        return this.TRIGGERS;
    }

    /**
     * Зарегистрировать обработчик триггера (на одно имя — один обработчик; при повторном set предыдущий заменяется).
     * @param {string} name — имя триггера (из TRIGGERS).
     * @param {Function} func — функция (data) => result; её возвращаемое значение вернётся из get(name, data).
     */
    set(name, func) {
        if (name && func instanceof Function) {
            this.triggers[name] = func;
        }
    }

    /**
     * Вызвать триггер: передать data зарегистрированному обработчику и вернуть его результат.
     * @param {string} name — имя триггера.
     * @param {*} data — данные для обработчика.
     * @returns {*} — то, что вернул обработчик, или null, если обработчик не задан.
     */
    get(name, data) {
        return (this.triggers[name] && this.triggers[name] instanceof Function) ? this.triggers[name](data) : null;
    }
}
module.exports = Mediator;