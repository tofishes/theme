/**
 * step by step插件
 * 期望api:
 * $container.stepDo(action).next(action).next(action)...done(finish);
 * @side-effects 对调用的容器会修改其css定位属性，可能会造成一定问题
 */
define(function (require, exports, module) {
    var $ = require('jquery')
    ,   Flow = require('util/flow')

    ,   shimClass = 'step-shim'
    ,   ACTIVE = 'active';

    require('css!modules/step/step.css');

    function prototype(_class, protos) {
        for (var proto in protos) {
            _class.prototype[proto] = protos[proto];
        }
    }
    function Step($container) {
        var _this = this;

        this.$wrap = $('<div class="step-flow-wrap"><div class="step-flow-head"/>'
            + '<div class="step-flow-foot">'
            + '<a class="step-flow-prev"><i></i>上一步</a>'
            + '<a class="step-flow-next"><i></i>下一步</a>'
            + '<a class="step-flow-done"><i></i>完成</a>'
            + '</div>'
            + '</div>');
        this.$head = this.$wrap.children('.step-flow-head');
        this.$foot = this.$wrap.children('.step-flow-foot');

        this.steps = [];

        this.flow = new Flow();
        this.effect = 'slide';

        $container.append(this.$wrap);

        // 事件处理
        this.$wrap.on('click', '.step-flow-next, .step-flow-done', function () {
            if (! _this.onnextAction) {
                _this.nextStep();
                return;
            };
            // 事件回调
            // 可以通过返回true或false控制流程是否自动下一步
            // 返回false，则需自行在回调内调用 this.nextStep()， prevStep() 控制流程
            if (_this.onnextAction.call(this) !== false) {
                _this.onnextAction = null;
                _this.nextStep();
            }

        }).on('click', '.step-flow-prev', function () {
            _this.prevStep();
        });

        // 设置$container定位规则
        // TODO 是否需要在destroy方法中重置回去，有待以后应用实践后再说
        var position = $container.css('position');
        if (position == 'static') {
            $container.css({
                'position': 'relative'
            })
        }
    }

    // 最好可以处理异步（难。。。）
    // step.next(function() {
    //      this.wait()
    //      setTimeout(funciton() {
    //          this.going();
    //      });
    // }).next()
    prototype(Step, {
        'shim': function () {
            var $shim = $('<div class="' + shimClass + '" data-index="' + this.steps.length  + '"/>');
            this.$wrap.append($shim);
            this.steps.push($shim);
            return $shim;
        },
        'start': function (action) {
            return this.next(action);
        },
        'next': function (action) {
            var step = this;
            this.flow.next(function (i, data) {
                var $shim = data[i] || step.shim();

                this.waiting();
                // 让action中必要时候可以使用step.nextStep() 或者 step.prevStep()手动控制流程
                action.call(step, $shim);

                return $shim;
            });

            return this;
        },
        'onnext': function (action) {
            // 事件回调
            // 可以通过返回true或false控制流程是否自动下一步
            // 返回false，则需自行在回调内调用 this.nextStep()， prevStep() 控制流程
            this.onnextAction = action;
        },
        'ondone': function (action) {
            this.onnext(action);
        },
        'done': function (finish) {
            this.next(finish);
            this.flow.work();

            return this;
        },
        'prevStep': function () {
            // 切换到上一步
            this.change('prev');
        },
        'nextStep': function () {
            // 切换到下一步
            this.change('next');
        },
        'change': function (dir) {
            // 执行流程
            this.flow[dir + 'Step']();

            // 获取当前显示的一步
            var $shims = this.$wrap.find('.' + shimClass)
            ,   $active = $shims.filter('.' + ACTIVE)
            ,   $follow

            ,   width = this.$wrap.width();

            if (!$active.length) {
                $active = $shims.eq(0);
            }
            // 找到待切换的下一个
            $follow = $active[dir]();
            $active.add($follow).width(width);
            // 切换动作
            this.effects[this.effect](dir, $active, $follow);
        },
        'effects': {
            'slide': function (dir, $prev, $next) {
                $prev.fadeOut();
                $next.fadeIn();
            },
            'fade': function (dir, $prev, $next) {
                $prev.fadeOut();
                $next.fadeIn();
            }
        },
        'destroy': function () {
            var $wrap = this.$wrap.fadeOut(function () {
                $wrap.remove();
            });
        },
        'waiting': function () {}
    });

    $.fn.stepDo = function (action) {
        var $this = $(this)
        ,   step = new Step($this);

        step.start(action);

        return step;
    }
});