import mitt from 'mitt'

export const eventBus = {
    events: {},
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    },
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
};

export default mitt() //该函数返回一个emitter对象，也就是全局事件总线对象