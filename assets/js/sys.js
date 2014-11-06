// @tofishes  系统级别的组件功能定义
// 系统loading， 弹出提示，弹出框等
define(function (require, exports, module) {
    var $ = require('jquery')

    ,   sys = {
        'alert': function (msg) {
            alert(msg);
        },
        'warn': function (msg) {
            alert(msg);
        },
        'loading': function (msg) {
            // km.$doms.sysLoading.show();
        },
        'loaded': function () {
            // km.$doms.sysLoading.hide();
        }
    };

    module.exports = sys;
});