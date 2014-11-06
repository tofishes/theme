/**
 * 本地存储帮助方法
 * @example
 * 1、存： storage('name', Object);
 * 2、取： storage('name');
 * 3、删： storage('name', null);
 * @return
 */
define(function () {
    return function storage(name, value) {
        if (value) {
            return localStorage.setItem(name, JSON.stringify(value));
        };

        if (value === null) {
            return localStorage.removeItem(name);
        };

        return JSON.parse(localStorage.getItem(name));
    }
});