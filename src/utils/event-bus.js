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
    },
    off(event, callback) {
        if (!this.events[event]) return;
        // 不传 callback 时移除该事件的全部监听
        this.events[event] = callback
            ? this.events[event].filter(cb => cb !== callback)
            : [];
    }
};

export default mitt() // 该函数返回一个 emitter 对象，也就是全局事件总线对象
