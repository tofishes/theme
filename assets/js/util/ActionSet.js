;(function(global) {
	/**
	 *  @author ToFishes
	 *  @description 全局的Actions注册与执行,可以用于多个不相关的模块
     *  实现与jquery.Callbacks一样的功能，但更丰富的是，通过ban方法可以有选择的执行
     *  所需要的Action
	 *  @example
        var action = ActionSet.createNew();
        action.add('one', function(data){console.info('one....' + data);})
            .add('two', function(data){console.info('two....' + data);});
        action.add('three', function(data){console.info('three....' + data);});

        action.fire('it is data');
        action.add('four', function(d){console.info('four...' + d);})
        action.ban('one', 'two').fire('testing ban...');
        action.fire('no ban to fire...');
        action.remove('three', 'four').fire();
	 */
	global.ActionSet = {
		createNew: function() {
			return {
				'actions': {},
                // before fire, this can ban some actions
                'banedActions': {},
				/**
				 * @description 注册action方法
				 * @param {String} name 设置一个action名称
				 * @param {Function} action 需要执行的Action函数
				 */
				'add': function(name, action) {
					ActionSet.add.apply(this, arguments);
                    return this;
				},
                // 在fire执行前，可以暂时禁止指定的actions
                // 参数形式： ban(name1, name2, name3...)
                'ban': function() {
                    ActionSet.ban.apply(this, arguments);
                    return this;
                },
                // 永久移除指定的actions
                // 参数形式： remove(name1, name2, name3...)
                'remove': function() {
                    ActionSet.remove.apply(this, arguments);
                    return this;
                },
				/**
				 * @description 执行action方法
                 * 可以传递任意参数给action
				 */
				'fire': function(args) {
					ActionSet.fire.apply(this, arguments);
                    return this;
				}
			};
		},
		'add': function(name, action) {
			var _this = this;

			if (_this.actions[name]) {
				global.console && global.console.error('action ' + name + ' has exist');
				return false;
			};
			if (action) {
				_this.actions[name] = action;
				return _this;
			};
		},
        'ban': function() {
            var args = arguments;
            for (var index in args) {
                this.banedActions[args[index]] = true;
            };
        },
        'remove': function() {
            var args = arguments;
            for (var index in args) {
                delete this.actions[args[index]];
            };
        },
		'fire': function() {
			var actions = this.actions;
            for (var name in actions) {
                if (! this.banedActions[name]) {
                    actions[name].apply(this, arguments);
                } else {
                    delete this.banedActions[name];
                };
            };
		}
	};
})(window);
