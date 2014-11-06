/**
 * 生成全局唯一标识符
 * @author tofishes
 * @return {[Function]} guid  使用guid()可以产生一个id
 */
define(function (require, exports, module) {
    // Generate four random hex digits.
    function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    // Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
       return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    };

    module.exports = guid;
});