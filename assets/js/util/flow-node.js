var Flow = require('./flow');

var flow = new Flow(), j = 0;
// flow.next(function(i, data){
//     // 以下获取数据方式是等价的
//     var a = data[i];
//     var b = this.store();

//     // 以下存储数据方式是等价的
//     this.store('hello store!');
//     return 'hello store';
// }).done(function(i, data){
//     console.info(data[0]);// 输出第一步的数据： hello store
// });
flow.start(function() {
    j++;
    console.info('j : ' + j);
}).next(function() {
    if (j > 2) {
        console.info('j = ' + j, ' 2秒后继续下一步')
        setTimeout(function(){
          flow.nextStep();
        }, 2000)
    } else {
        console.info('j = ' + j, ' 返回上一步')
        // 异步情况下：
        // setTimeout(function(){
        //   flow.prevStep();
        // }, 2000)
        this.prevStep();
    }
}).next(function () {
    console.info('j理应为3，实际 j = ' , j);
}).done();
function cons() {
    var result = ['<p>'], i = 0, l = arguments.length;
    for (; i < l; i++) {
        result.push(arguments[i]);
    }
    result.push('</p>');
    $('#run-flow-js-result').append(result.join(''));
}
// j : 1
// j = 1  返回上一步
// j : 2
// j = 2  返回上一步
// j : 3
// j = 3  2秒后继续下一步
// j理应为3，实际 j =  3