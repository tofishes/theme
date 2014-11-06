/**
 *  @author tofishes
 *  @description 全局的侧边面板
 *  @exports API
 *   // 载入中
 *   MultiPanel.loading()
 *   // 载入后
 *   MultiPanel.loaded()
 *   // 面板显示
 *   MultiPanel.on(callback)
 *   // 面板隐藏
 *   MultiPanel.off(callback)
 *   // 添加行为, action中的this指向面板对象$panel,通过this可以操作面板内容
 *   MultiPanel.addAction(route, name, action)
 *   // 初始化
 *   MultiPanel.init()
 *   // 跳到某条历史索引
 *   MultiPanel.go(index)
 *   // 后退
 *   MultiPanel.prev()
 *   // 前进
 *   MultiPanel.next()
 *  @requires
 *  css: multi-panel.less, interactiveHistory.less
 *  html: multi-panel.html
 *  js: backbone.js, multi-panel.js (自己写的addAction())
 *  @example
 *  首先需要添加自己的处理行为(ajax载入内容可选 MultiPanel.loading()和MultiPanel.loaded()):
 *  MultiPanel.addAction(route, name, action)
 *  其次分默认调用和手工调用
    // 全局的默认调用
    // 用法1： 
    // <a class="multi-panel" data-route="user/1203212321" href="...">
    // 必选：class是作为默认监听选择器， data-route是一个路径, 该路径应该匹配addAction的一个route规则
    // a点击后会被阻止默认行为
    // 
    // 用法2： 
    // <a href="#/name/1/id/212312" >
    // 不用添加class，href完全是hash写法，可以直接触发所匹配的一个Action
    // 不会阻止默认行为
    //
    // 手工调用:  已经添加了一个route为  weibo/:id 的行为，调用方式如下：
    // MultiPanel.navigate('weibo/123123');
    //
    // init方法已经统一放到ready.js，所以无需再去执行
 */
 /**
   冲突： 与全局弹出框（fix in base.js and botstrap.min.js）
 */
;
(function(window, $, undefined) {
	var document = window.document,
		$body = $('body'),
		isIE = ! - [1, ],
		X = Xwb,
		MB = X.use('msgbox'),
		Util = Xwb.util,
		getText = Xwb.lang.getText;

	var $multiPanelOverlay = $('#multi-panel-overlay');
	var $multiPanelWrap = $('#multi-panel-wrap');
	var $multiPanel = $('#multi-panel');
	var $multiPanelHeader = $('#multi-panel-head');
	var $multiPanelTitle = $('#multi-panel-title');
	var loading = 'panel-loading';

	var MultiPanel = {
		'$scrollHook': $multiPanel,
		'loading': function() {
			$multiPanelHeader.addClass(loading);
				var $forwardInput = $('.emotion-box textarea.emotion-inputor');
				$forwardInput.focus();
				//km.util.domOperate.focusEnd($forwardInput[0], 0);
			
			return this;
		},
		'loaded': function() {
			$multiPanelHeader.removeClass(loading);
			return this;
		},
		'history': []
	};
	// init backbone routes
	var Router = {
		routes: {
			"multi-panel": "openPanel"
		},
		'openPanel': function() {
			MultiPanel.on();
		}
	}
	var AppRouter = Backbone.Router.extend(Router);
	// Instantiate the router
	var app_router = new AppRouter;

	// 显示面板
	MultiPanel.on = function(callback) {
		if (!$body.data('multi-panel-on')) {
			$body.data('multi-panel-on', 1).data('multipanel-scroll-position', $(window).scrollTop());
			$body.addClass('panel-on');

			var transition = isIE ? {}: {
				'opacity': 1
			};
			var delay = isIE ? 0: 300;
			$multiPanelOverlay.show().animate(transition, delay, function() {
				$multiPanelWrap.animate({
					'width': 600
				},
				delay, function() {
					callback && callback($multiPanel);
				});
			});
            // 记录打开时候的所属平台信息
            MultiPanel.metaInfo('platform', km.active.platform)
		} else {
			callback && callback($multiPanel);
		};
		MultiPanel.$scrollHook.scrollTop(0);

		return $multiPanel;
	};
	MultiPanel.isOn = function () {
		return $body.data('multi-panel-on');
	};
	// 设置侧面板的标题
	MultiPanel.setTitle = function (title) {
		$multiPanelTitle.html(title);
	};
	MultiPanel.clearTitle = function () {
		$multiPanelTitle.html('');
	};
    // 设置或获取侧面板的元信息
    MultiPanel.metaInfo = function(name, value) {
        if (value) {
            $multiPanel.data(name, value);
        } else {
            return $multiPanel.data(name);
        };
    };
	// 关闭面板
	var offActions = $.Callbacks();
	// 添加一个在面板关闭时候执行的Action
	MultiPanel.addOffAction = function(action) {
		offActions.add(action);
	};
	MultiPanel.off = function(callback) {
		var transition = isIE ? {}: {
			'opacity': 0
		};
		var delay = isIE ? 0: 300;

		$multiPanelWrap.animate({
			'width': 0
		},
		delay, function() {
			$multiPanelOverlay.animate(transition, delay, function() {
				$(this).hide();
				$body.removeClass('panel-on');
				$body.removeData('multi-panel-on');

				var origin_hash = $multiPanel.data('origin-hash');
                if (!origin_hash || origin_hash.indexOf('user') !== -1 || origin_hash.indexOf('weibo') !== -1) {
                    origin_hash = 'multi-panel-off';
                };
				location.hash = origin_hash;
                $multiPanel.empty().removeData('origin-hash');
                $multiPanel.removeData('action-info');

				var position = $body.data('multipanel-scroll-position');
				position && $(window).scrollTop(position);

				callback && callback($multiPanel);
				offActions.fire($multiPanel);
			});
		});

		MultiPanel.loaded();
		return $multiPanel;
	};
	// 记录历史
	var history_index = 0;
	var $panelPrev = $multiPanelHeader.find('.multi-panel-nav-prev');
	var $panelNext = $multiPanelHeader.find('.multi-panel-nav-next');
	var $panelNavItems = $panelPrev.add($panelNext);
	function refresh_nav() {
		$panelPrev.toggle(history_index != 0);
		$panelNext.toggle(history_index != MultiPanel.history.length - 1);
	};
	$panelNavItems.on('click.panel-nav', function(e) {
		var $this = $(this),
		action = $this.data('action');
		MultiPanel[action]();
		refresh_nav();
	});

	var recordHistory = function() {
		if ($multiPanel.data('ignore-history')) {
			$multiPanel.removeData('ignore-history');
			return;
		};

		var hash = location.hash,
        // 模仿浏览器历史模式，新的历史会抹掉旧的历史，参考opera浏览器
        history = MultiPanel.history.slice(0, history_index + 1);
        var length = history.length;
        if (hash != history[length - 1]) {
            history.push(hash);
            // 每次记录更新索引为最新
            history_index = length;
        } else {
            history_index = length - 1;
        };
        MultiPanel.history = history;

		// 刷新前进后退
		refresh_nav();
	};

	// 手动触发面板行为
	// navigate('route/2');
	// 参数为String，一个完整的路径，比如: module/hello/username
	MultiPanel.navigate = function(route) {
		//MultiPanel.on();
		// @TODO @care 
		// 因为使用了这样的记忆打开面板前原始hash，
		// 所以使用 a hre="#one-hash"的时候，会导致死循环
		if (!$multiPanel.data('origin-hash')) $multiPanel.data('origin-hash', location.hash || 'multi-panel-off');
		app_router.navigate(route, {
			trigger: true
		});
	};

	// 开启MultiPanel自动功能必须的
	// Start Backbone history a necessary step for bookmarkable URL's
	MultiPanel.init = function() {
		// 暂无需求
		return MultiPanel;
	};
	// 添加面板行为
	// Manually bind a single named route to a action. For example:
	// .addAction('search/:query/p:num', 'search', function(query, num) {
	// ...
	// });
	MultiPanel.addAction = function(route, name, action) {
		// 注入action，添加记录
		var _action = function() {
			var _arguments = arguments;
			MultiPanel.on(function($multiPanel) {
				recordHistory();
				// 每次创建一个新的容器
				// 如果网络延迟，那么在两次不同的action执行期间，可能会出现
				// 前ajax返回比后ajax返回晚的情况，从而出现内容不对的情况。
				// 每次都创建新的容器可以简单避免这种潜在bug。
				// 弊端就是不同的action之间不能复用一个container
				var $container = $('<div class="multi-inner-container"/>');
				$multiPanel.html($container);

				MultiPanel.clearTitle();
				// this指向$multiPanel下的容器
				action.apply($container, _arguments);
                // 记录当前的action信息，用于刷新
                $multiPanel.data('action-info', {
                    'action': action,
                    'container': $container,
                    'arguments': _arguments
                });
			});
		};
		app_router.route(route, name, _action);
		return MultiPanel;
	};

	// TODO 移除面板行为(backbone没提供此方法)
	MultiPanel.removeAction = function(route_name) {
		return MultiPanel;
	};
    // 刷新当前内容
    MultiPanel.refresh = function() {
        var actionInfo = $multiPanel.data('action-info');
        if (actionInfo) {
            actionInfo.action.apply(actionInfo.container, actionInfo.arguments);
        };
    };

	// 面板的历史管理
	// prevEnd = function(){}
	// nextEnd = function(){}
	MultiPanel.go = function(index) {
		var _hash = location.hash,
		__hash = MultiPanel.history[index];
		// 确保真的是需要执行
		if (__hash && _hash !== __hash) {
			$multiPanel.data('ignore-history', 1);
            MultiPanel.navigate(__hash);
		};
	};
	// 历史回退
	MultiPanel.prev = function() {
		history_index -= 1;
		if (history_index < 0) {
			history_index = 0;
			// 如果这里不return阻止，
			// 就会执行go方法，go中设置ignore成立
			// 但是index总为0的时候hash是不变的，没有执行action
			// 所以本次action中的recordHistory未执行
			// 所以会出现： ignore = 1，影响下一次recordHistory的记录
			return;
		};
		this.go(history_index);

		return history_index === 0;
	};
	// 历史前进
	MultiPanel.next = function() {
		var length = MultiPanel.history.length - 1;
		history_index += 1;
		if (history_index > length) {
			history_index = length;
			return;
		};
		this.go(history_index);

		return history_index === length;
	};

	// 为了和主页面的弹出层滚动兼容，需要增加 释放和屏蔽主页面滚动条的方法
	// 释放滚动条
	MultiPanel.releaseMainScroll = function () {
		MultiPanel.isOn() && $body.removeClass('panel-on');
	};
	// 锁定滚动条
	MultiPanel.lockMainScroll = function () {
		MultiPanel.isOn() && $body.addClass('panel-on');
	};

	// 全局的默认调用
	// 用法1： 
	// <a class="multi-panel" data-route="user/1203212321" href="...">
	// 必选：class是作为默认监听选择器， data-route是一个路径, 该路径应该匹配addAction的一个route规则
	// a点击后会被阻止默认行为
	// 
	// 用法2： 
	// <a href="#hash/name/1/id/212312" >
	// 不用添加class，href完全是hash写法，可以直接触发所匹配的一个Action
	// 不会阻止默认行为
	$(document).on('click.multi-panel', '.multi-panel', function(e) {
		var fragment = $(this).data('route');
		MultiPanel.navigate(fragment);
		e.preventDefault();
	}).on('click.multi-panel-off', '.multi-panel-off', function(e) {
		// clean the hash ?!
		MultiPanel.off();
	});
	$multiPanelOverlay.on('click.multi-panel-off', function(e) {
		if ($(e.target).is('#multi-panel-overlay')) {
			MultiPanel.off();
		};
	});
	// 对面板内定位元素的修正
	MultiPanel.$scrollHook.off('.fix-hide').on('scroll.fix-hide', function() {
		// atwho 层页面不唯一，只能做影藏处理
		$('div.atwho').addClass('hidden'); // 微博评论或转发的@who修订
		window.operateTipHide(); // 二次确认框的修订

		$('#ui-datepicker-div').hide(); // 收集微博列表的日期选择
		$('input.datepicker-input').blur(); // 收集微博列表的日期选择
	});

	// 提供给全局使用
	window.MultiPanel = MultiPanel;

	// 检测输入框的文字数，并提示
	// 用法：$('textarea').checkText();
	// 用法2：$('div.textarea-parent').checkText();
	// 用法2是用于父级下多个textarea的情况
	$.fn.checkText = function(options) {
		options = $.extend({
			'max': 140,
			// 最大字数限制
			'banInput': false,
			// 超出字数，阻止继续输入，和提示信息是反向
			'$tip': null,
			// 设置提示文字显示在哪个元素中，比如$('#comment-text-warn')
			'warnClass': 'out-text-max',
			// 超出字数限制后，提示文字元素的类名
			'autoH': true // 是否自适应内容高度
		},
		options);

		var Util = Xwb.util,
		getText = Xwb.lang.getText,
		isTextarea = this.is('textarea');
		return this.on('input keyup paste cut checktexthandller', isTextarea ? null: 'textarea', function(e) {
			var $this = $(this);

			var val = $this.val();
			var left = Util.calWbText(val, options.max);

			var jqWarn = $this.data('text-tip') || options.$tip;
			if (!jqWarn && ! options.banInput) {
				jqWarn = $('<p class="inputor-text-warn tips"></p>');
				if($(this).addClass("panel-main-inputor")){
					jqWarn = $('<p class="inputor-text-warn tips"></p>');
				}
				$this.before(jqWarn);

				$this.data('text-tip', jqWarn);
			};
			if (options.banInput) {
				// 按字节截取，字数需要*2
				$this.val(Util.byteCut(val, options.max * 2));
			} else {
				var $submitBtn = $(this).next("section").children("button");
				if (left >= 0) {
					jqWarn.html(getText('您还可以输入<em>{0}</em>字', left)).removeClass('out-count-limit');
					$submitBtn.removeAttr("disabled").removeClass("disabled");
				} else {
					jqWarn.html(getText('已超出<em>{0}</em>字', Math.abs(left))).addClass('out-count-limit');
					$submitBtn.attr("disabled","disabled").addClass("disabled");
				};
				$this.data('overfill', left);
			};
		}).trigger('checktexthandller');
	};

	// 添加面板行为的默认例子
	MultiPanel.addAction('weibo/:id', 'weibo', function(id) {
		var $panel = this;
		loadWeibo($panel, id);
	});
	// 合并了转发和评论，用type区分，同时也能扩展更多类型出来
	MultiPanel.addAction('weibo-:type/:id', 'weibo', function(type, id) {
		var $panel = this;
		loadWeibo($panel, id, function() {
			$('#multi-panel-tweet-tab-' + type).trigger('click');
		});
	});
	//MultiPanel.addAction('weibo-comment/:id', 'weibo', function(id) {
	//var $panel = this;
	//loadWeibo($panel, id);
	//});
	MultiPanel.addAction('user/:id', 'weibo', function(id) {
		var $panel = this;
		loadUser($panel, id);
	});
	// 直接跳转到用户交互历史或其他指定tab 
	MultiPanel.addAction('user/tabs/:type/:id', 'weibo', function(type, id) {
		var $panel = this;
		loadUser($panel, id, function() {
			$('#peopleNavList .multi-panel-user-' + type).click();
		});
	});
	// 发布相关列表
	MultiPanel.addAction('publish/:action/:page', 'publish', function(action, page) {
		var $panel = this;
		var actions = {
			'audit': loadAuditList,
			'draft': loadReserveList,
			'collection': loadCollectionList
		}

		actions[action] && actions[action]($panel, page);
	});

	// 以下的内容，需要谨慎 避免事件被多次绑定
	// 载入用户详情
	function loadUser($container, id, loaded_callback) {

		var $userDetailTmpl = $('#user-detail-tmpl').template();

		MultiPanel.loading();
		var params = {};
		if (id.indexOf('@') === - 1) {
			params.userId = id;
		} else {
			// 昵称是汉字，刷新页面从地址栏获取昵称，需要解码
			params.nick = decodeURIComponent(id.replace('@', ''));
		}
		// TODO 去掉假数据地址
		$.ajax({
			url:'phony-data/user-detail.json' && 'p/interHistory/getUserDetail/',
			data:params,
			customErr:true,
			success:function(data){
				//start
				MultiPanel.loaded();
				if(data.errno === 11005 || data.errno === 20000){
                    var notice_info = '抱歉，该昵称目前不存在哦~';
                    if (km.active.platform !== MultiPanel.metaInfo('platform')) {
                        notice_info = '已切换平台，无法获取正确数据。';
                    };
                    $container.html($('#panel-notice-tmpl').tmpl({
                        'info': notice_info
                    }));
					return;
                };
				
				if (data.rst) {
					id = data.rst.userDetail.id;
					var userDetail = data.rst.userDetail;
					
					/*	
					km.util.pageInfoByNum({
						$elem:("#follow").data("num",userDetail.follows),
					});
					*/

					

					var groupList = data.rst; //该用户的小组列表
					//userDetail.following = 1;
					//userDetail.followme = 1;
					$container.data('uid', id).html($.tmpl($userDetailTmpl, userDetail, {
						id: id
					}));
					var $peopleNavList = $("#peopleNavList");
					$peopleNavList.find("#follow").data("num",userDetail.follows);
					$peopleNavList.find("#fans").data("num",userDetail.fans);

					var interactiveHistory = {
						pageNum: 20,
						mutualUserId: id,
						//jQuery元素
						$myWeiboList: $("#myWeiboList"),
						$notWeiboList: $("#notMyWeiboList"),
						$followList: $("#followList"),
						$fansList: $("#fansList"),
						$historyList: $("#historyList"),
						$historyInput: $("#historyInput"),
						$addHistoryMod: $("#addHistoryMod"),
						$groupMod: $("#groupMod"),
						$groupContainer: $("#groupContainer"),
						$groupInput: $("#groupInput"),
						$createGroupNav: $("#createGroupNav"),
						init: function() {
							var self = this;
							self.$groupContainer.html($("#groupTmpl").tmpl(groupList,{
		                        kmtagshow:function(groupList){
		                            var str='';
		                            for(var i=0;i<groupList.length;i++){
		                                if(i==0){
		                                    str += groupList[i].name;
		                                }else{
		                                    str += '，'+ groupList[i].name;
		                                }                                       
		                            }
		                            return str;
		                        },
		                        kmtagdataId:function(groupList){
		                            var dataId = [];
		                            for(var i=0;i<groupList.length;i++){
		                                dataId[i]=groupList[i].id;                                      
		                            }
		                            return JSON.stringify(dataId);
		                        }
	                        }));
							self.getKmtagList();
							self.myWeiboList();
							self.getFollowList();
							self.getFansList();
							//self.getFowardList();
							//self.getCommentList();
							self.bind();
							loaded_callback && loaded_callback.apply($container);
						},
						bind: function() {
							var self = this;

							//删除微博
							self.$myWeiboList.on("click", ".delWeibo", function() {
								var $weiboLi = $(this).parents("li");
								var mid = $weiboLi.data("id");
								window.operateTip({
									obj: $(this),
									tipContent: '确定删除该微博?',
									triggleClass: "delWeibo",
									offsetX: - 10,
									func: function() {
										km.delWeiboById({
											mid: mid,
											$weiboLi: $weiboLi
										});
									}
								});

							})
                            $container.off('click').on('click.tab', ".tab li", function() {
								var elemId = $(this).addClass("active").attr("id");
								$(this).siblings().removeClass("active");
								$("#" + elemId + "Mod").show().siblings("section").hide();

							}).on("click", ".filter-list li", function() {
								$(this).addClass("active").siblings().removeClass("active");
							});
							$("#history").one("click", function() {
								self.getHistoryList();
							})
							/*微博面板*/
							// 绑定自定义事件，添加额外需求
							$(".groupNav").click(function(e) {
								if(!km.chkAccess('RELATION_GROUP')){
		                            return;
		                        };
								if(!$('#addKmtag').is(':hidden') && $('#addKmtag').data('operateType') == 'sidebar'){
				                    $('#addKmtag').hide();
				                }else{
				                    var list= $(this).parent().parent().data("id"),
				                        t = $(this).data('id');
				                    $('#kmtagList input[type="checkbox"]').each(function(idx, elm) {
				                        elm.checked=false;
				                        var v=$(elm).val();
				                        if(t){
				                            for(var i=0;i<t.length;i++){
				                                if (t[i]==v) {
				                                    elm.checked=true;
				                                }
				                            }
				                        }
				                    });
				                    var option = {
				                        target:$(this),
				                        dir:'rightBottom',
				                        event:e,
				                        x:0,
				                        y:10,
				                        list:list
				                    }
				                    window.operateKmtag(option,$.proxy(self.manageKmtag, self));
				                } 
							});
							$("#addHistoryNav").click(function() {
								if(!km.chkAccess("RELATION_CUSTOMER")){
				                    return false;
				                }
								self.$addHistoryMod.show();
								$(this).hide();
								if ($(this).data("first")) { //不是第一次点击
									$(this).removeData("first");
								} else {
									$(this).data("first", true);
									self.$historyInput.autoHeight();
								}

							})
							self.$addHistoryMod.on("click", "button", function() {
								var id = $(this).attr("id");
								if (id == "saveHistory") { //添加交互历史
									var content = self.$historyInput.val();
									if (content) {
										var sendData = {
											content: content,
											mutualUserId: self.mutualUserId,
											$elem:$(this)
										}
										$(this).attr("disabled","disabled");
										self.addHistory(sendData);
									} else {
										window.console && console.log("请输入交互内容");
									};
								} else {
									self.$historyInput.val("");
									self.$addHistoryMod.hide();
									$("#addHistoryNav").show();
								}

							})
							$("#weiboContent>.feed-info").click(function(event) {
								
								$(this).addClass("active").siblings().removeClass("active");
								if ($(event.target).hasClass("foward")) {
									$("#fowardMod").show().next().hide();
								} else if ($(event.target).hasClass("comment")) {
									$("#commentMod").show().prev().hide();
								}
								event.preventDefault();

							})
							$("#multi-panel #filter-list li").click(function() {
								$(this).addClass("active").siblings().removeClass("active");
								var val = $(this).data("val"); //代表筛选的参数
								var data = {
									filter: val
								}
								self.myWeiboList(data);
							})
							$("#followFilterList").on("click", "li", function() {
								var filterVal = $(this).data("val");
								var reqData = {
									filter: filterVal
								}
								self.getFollowList(reqData);
							});
							/*
	                    //不同关注状态的点击事件
	                    $(document).on("click",".addfollow-btn,.cancelFollow",function(){
	                        var $contentR = $(this).parents(".content-r");
	                        var $li = $(this).closest("li");
	                        var userid = $li.data("userid");
	                        if(!userid){
	                            userid = id;

	                        }
	                        var reqData = {
	                            list:userid,
	                            $contentR:$contentR
	                        }
	                        // if ($(this).closest('ul.scrmuserList')) {
	                        //     reqData.source = recommend;
	                        // }
	                        if($(this).hasClass("cancelFollow")){ //取消关注
	                            window.operateTip({
	                                obj: $(this),
	                                tipContent: '确定取消关注?',
	                                triggleClass:"cancelFollow",
	                                offsetX: -10,
	                                func: function(){
	                                    self.cancelFollowByWeibo(reqData);
	                                    
	                                }
	                            }); 
	                          
	                        }else if($(this).hasClass("addfollow-btn")){ //添加关注
	                            self.addFollowByWeibo(reqData);
	                           
	                            
	                        }
	                    });
	                    */
						},
				        //  获取分组列表
				        getKmtagList: function(){
				            var self = this;
				            $.ajax({
				                //url:"/report-relation-data/kmtaglist.json",
				                url:"p/kmtag/list/",
				                dataType:"json",
				                success:function(data){
				                    if(data){
				                        if(data.errno==0){
				                        	if(data.rst.list.length===0){
			                                    $('.no-kmtag').show();
			                                    $('#kmtagList').empty();
			                                }else{
			                                    $('.no-kmtag').hide();
			                                    $('#kmtagList').empty();
			                                    $("#kmtaglistTemplate").tmpl(data.rst.list,km.util.postFormatter).each(function(idx,ele){
			                                    }).appendTo($('#kmtagList'));
			                                }                       
				                        }
				                    }
				                }
				            });
				        },
				        //  管理分组
				        manageKmtag: function(type,param){
				            var self = this;
				            switch (type){
				                case "create":
				                    var kmtagName = $('.kmtagInput').val();
				                    self.createKmtag(kmtagName,param);  
				                    break;
				                case "add":
				                    self.addKmtag(param);
				                    break;
				                case "edit":
				                    self.editKmtag(param);
				                    break;
				                case "delete":
				                    self.deleteKmtag(param);
				                    break;
				            }
				            window.kmtagInfoChangeState=1;
				        },
				        //  创建分组
				        createKmtag: function(paramData,list){
				            var self = this;
				            var reqData = {
				                kmtagName:paramData
				            };
				            $.ajax({
				                //url:"/report-relation-data/createKmtag.json",
				                url:"p/kmtag/create/",
				                data:reqData,
				                dataType:"json",
				                success:function(data){
				                    if(data){
				                        if(data.errno==0){
				                            //self.showActionNote('createTag');
				                            $('<li><p><label><input type="checkbox" name= '+paramData+' value= '+data.rst.id+' /><span class="text-name">'+paramData+'</span></label><input class="text-input" type="text" name="" value="" maxlength="16"><i class="kmtag-edit-group"></i><i class="kmtag-save-group"></i><i class="kmtag-delete-group"></i></p><p class="kmtag-edit-error"></p></li>').appendTo("#kmtagList");
				                            $('#kmtagList input[type="checkbox"]').each(function(idx, elm) {
				                                var n=$(elm).attr("name");
				                                if (n==paramData) {
				                                    elm.checked=true;
				                                }
				                            });
				                            $('.no-kmtag').hide();
				                            window.addKmtagid = data.rst.id;
				                            self.addKmtag(list);  
				                            $("#dAddTag").show();
								            $("#dAddForm").hide();
								            $('#dAddError').hide();
								            $('.kmtagInput').val("");                         
				                        }
				                    }
				                }
				            });
				        },
				        //  添加分组
				        addKmtag: function(paramData){
				            var self = this,
				                type = "add",
				                changeID = window.addKmtagid;
				            if(window.removeKmtagid){
				                type = "remove";
				                changeID = window.removeKmtagid;
				            }
				            var reqData = {
				                list:paramData,
				                type:type,
				                changeID:changeID
				            };
				            window.addKmtagid ='';
				            window.removeKmtagid ='';
				            $.ajax({
				                //url:"/report-relation-data/addkmtag.json",
				                url:"p/kmtag/add/",
				                data:reqData,
				                customErr: true,
				                dataType:"json",
				                success:function(data){
				                    if(data.errno==0){  
				                        var tempParamData = String(paramData);              
				                        var tempData=tempParamData.split(",");                          
				                        if(reqData.type=='add'){
				                            //self.showActionNote('addTag',data.rst.msg);
			                                var $temp = $('.groupNav');
			                                var t = [];

		                                    t[0] = parseInt(reqData.changeID);
		                                    for(var j=0;j<$temp.data('id').length;j++){
		                                        t[j+1]=$temp.data('id')[j];                                      
		                                    }
		                                    $temp.data('id', t);
		                                    var str='';
		                                    for(var k=0;k<t.length;k++){
		                                        $('#kmtagList input[type="checkbox"]').each(function(idx, elm) {
		                                            var v=$(elm).attr("value");
		                                            if (v==t[k]) {
		                                                if(k==0){
		                                                    str += $(elm).attr("name");
		                                                }else{
		                                                    str += '，'+ $(elm).attr("name");
		                                                }
		                                            }
		                                        });                                 
		                                    }
		                                    $temp.attr('title', str);
		                                    $temp.text((Xwb.util.byteLen(str) / 2 > 5) ? (Xwb.util.byteCut(str, 4 * 2) + '…') : (str));
				                        }else{
				                            //elf.showActionNote('removeTag',data.rst.msg);
			                                var $temp = $('.groupNav');
			                                var t = [],
			                                    remove = parseInt(reqData.changeID);
			                                for(var j=0;j<$temp.data('id').length;j++){
			                                    if($temp.data('id')[j] == remove){
			                                        remove= j;
			                                        break;
			                                    }                                   
			                                }
			                                $temp.data('id').splice(remove,1);
			                                t=$temp.data('id');
			                                if(t[0]){
			                                    $temp.data('id', t);
			                                    var str='';
			                                    for(var k=0;k<t.length;k++){
			                                        $('#kmtagList input[type="checkbox"]').each(function(idx, elm) {
			                                            var v=$(elm).attr("value");
			                                            if (v==t[k]) {
			                                                if(k==0){
			                                                    str += $(elm).attr("name");
			                                                }else{
			                                                    str += '，'+ $(elm).attr("name");
			                                                }
			                                            }
			                                        });                                 
			                                    }
			                                    $temp.attr('title', str);
			                                    $temp.text((Xwb.util.byteLen(str) / 2 > 5) ? (Xwb.util.byteCut(str, 4 * 2) + '…') : (str));
			                                }else{
			                                    $temp.data('id', t);
			                                    $temp.attr('title', '选择分组');
			                                    $temp.text('选择分组');
			                                }                             
				                        }
				                    }else{
				                        $('#kmtagList input[type="checkbox"]').each(function(idx, elm) {
				                            var v=$(elm).attr("value");
				                            if (v==changeID) {
				                                if(elm.checked){
				                                    elm.checked=false;
				                                }else{
				                                    elm.checked=true;
				                                }                              
				                            }
				                        }); 
				                        km.MB.error('', data.err);
				                    }                          
				                }
				            });
				        },
				        //  编辑分组名称
				        editKmtag: function(param){
				            var self = this,
				                changeID = window.editKmtagid;
				            var reqData = {
				                changeID:changeID,
				                kmtagName:param.parent().find('.text-input').attr('value')
				            };
				            window.editKmtagid ='';
				            $.ajax({
				                //url:"/report-relation-data/addkmtag.json",
				                url:"p/kmtag/change/",
				                data:reqData,
				                dataType:"json",
				                success:function(data){
				                    if(data.errno==0){
				                        param.parent().find('label input').attr('name',param.parent().find('.text-input').attr('value'));
				                        param.parent().find('.text-name').html(param.parent().find('.text-input').attr('value'));
				                        //self.showActionNote('editTag');
				                        var $temp = $('.groupNav');
	                      
			                            if ($temp.data('id')) {
			                                var t = $temp.data('id');
			                                var haveTag= _.indexOf(t,parseInt(changeID));
			                                if(haveTag != -1){
			                                    var str='';
			                                    for(var k=0;k<t.length;k++){
			                                        $('#kmtagList input[type="checkbox"]').each(function(ide, ele) {
			                                            var v=$(ele).attr("value");
			                                            if (v==t[k]) {
			                                                if(k==0){
			                                                    str += $(ele).attr("name");
			                                                }else{
			                                                    str += '，'+ $(ele).attr("name");
			                                                }
			                                            }
			                                        });                                 
			                                    }
			                                    $temp.attr('title', str);
			                                    $temp.text((Xwb.util.byteLen(str) / 2 > 5) ? (Xwb.util.byteCut(str, 4 * 2) + '…') : (str));
			                                }
			                            }
				                    }                   
				                }
				            });
				        },
				        //  删除分组
				        deleteKmtag: function(param){
				            var self = this,
				                changeID = window.deleteKmtagid;
				            var reqData = {
				                changeID:changeID
				            };
				            window.deleteKmtagid ='';
				            $.ajax({
				                //url:"/report-relation-data/addkmtag.json",
				                url:"p/kmtag/delete/",
				                data:reqData,
				                dataType:"json",
				                success:function(data){
				                    if(data.errno==0){
				                        param.parent().parent().remove();
				                        //self.showActionNote('deleteTag');
	                       				if($('#kmtagList input[type="checkbox"]').length===0){
				                            $('.no-kmtag').show();
				                        }else{
				                            $('.no-kmtag').hide();
				                        }
				                        
	                       				var $temp = $('.groupNav');
			                            if ($temp.data('id')) {
			                                var t = $temp.data('id');
			                                var haveTag= _.indexOf(t,parseInt(changeID));
			                                if(haveTag != -1){
			                                    var str='';
			                                    t.splice(haveTag,1);
			                                    if(t[0]){
			                                        for(var k=0;k<t.length;k++){
			                                            $('#kmtagList input[type="checkbox"]').each(function(ide, ele) {
			                                                var v=$(ele).attr("value");
			                                                if (v==t[k]) {
			                                                    if(k==0){
			                                                        str += $(ele).attr("name");
			                                                    }else{
			                                                        str += '，'+ $(ele).attr("name");
			                                                    }
			                                                }
			                                            });                                 
			                                        }
			                                        $temp.attr('title', str);
			                                        $temp.text((Xwb.util.byteLen(str) / 2 > 5) ? (Xwb.util.byteCut(str, 4 * 2) + '…') : (str));
			                                    }else{
			                                        $temp.data('id', t);
			                                        $temp.attr('title', '选择分组');
			                                        $temp.text('选择分组');
			                                    }
			                                }
			                            }
				                    }                   
				                }
				            });
				        },
						/*
	                 *获取我的微博列表
	                 */
						myWeiboList: function(paramData) {
							var self = this;
							var reqData = {
								filter: 0,
								mutualUserId: id,
								page:1,
								pageNum:20

							};
							MultiPanel.loading();
							//sysTip.show("微博列表正在加载中!");
							$.extend(reqData,paramData);
							$.ajax({
								url: "p/statuses/user_timeline/",
								data: reqData,
								dataType: "json",
								success: function(data) {
									self.$myWeiboList.empty();
									//sysTip.hide();
									MultiPanel.loaded();
									if (data.errno == 0) {
										km.util.validatePrevNext({
										  	$pagingElem:$("#barWeiboListPaging"),
										  	pageInfo:data.rst.pageInfo,
										  	func: function(pageObj){
										  		
										  		reqData.page = pageObj.page;
										  		var $firstli = self.$myWeiboList.children("li:first");
										  		var $lastLi = self.$myWeiboList.children("li:last");
										  		if(km.active.platform==="tencent"){
													if(pageObj.beforePage<pageObj.page){ //点击的是"下一页"
														reqData.pageFlag  = 1;
														reqData.sinceId = parseInt($lastLi.data("cr")/1000);
													}else{
														reqData.pageFlag = 2;
														reqData.sinceId = parseInt($firstli.data("cr")/1000);
													}
												}else if(km.active.platform==="sina"){ //新浪
													//self.sinceId = weiboData.mid/1000; //赋值sinceId
													if(pageObj.beforePage<pageObj.page){ //点击的是"下一页"
														//reqData.sinceId = $lastLi.data("id");
														reqData.pageFlag  = 1;
													}else{
														//reqData.sinceId = $firstli.data("id");
														reqData.pageFlag = 2;
													}
												}
										  		self.myWeiboList(reqData);;
										  	}
										});
									if (data.rst.list.length) {
										self.$notWeiboList.hide();
										$("#myWeiboTmpl").tmpl(data.rst.list, km.util.postFormatter).appendTo(self.$myWeiboList);
									} else {
										self.$notWeiboList.show();
									}
									MultiPanel.$scrollHook.scrollTop(0);
									//$("#multi-panel-overlay").scrollTop(0);
									}
								}
							});
						},
						/*
	                 *获取关注列表
	                 */
						getFollowList: function(paramData) {
							var self = this;
							var reqData = $.extend({
								page: 1,
								pageNum: 20,
								mutualUserId: id
							},
							paramData);

							$.getJSON("p/interHistory/attentionList/", reqData, function(data) {
								self.$followList.empty();
								if (data.errno == 0) {
									var pageInfo = km.util.pageInfoByNum({
										$elem:$("#follow"),
										page:data.rst.pageInfo.page
									});
									MultiPanel.$scrollHook.scrollTop(0);
									if (data.rst.list.length) {
										
										self.$followList.html(
										$("#contactTmpl").tmpl(data.rst.list)).children("li:even").addClass("evenLi");
										// 分页
										var pageInfo = data.rst.pageInfo;
	                                    // 侧面板的分页需要阻止主页面往页首跳
	                                    pageInfo.preventTop = 1;
										km.util.pageBar(pageInfo, $('#panel-follow-pager').show(), function(pageNum) {
											
											// TODO reqData可能存在数据不一致性问题,需要真实数据测试
											reqData.filter = $('#followFilterList .active').data('val') || 0;
											reqData.page = pageNum;
											self.getFollowList(reqData);
										});
									}

								}
							});
						},
						/*
	                 *获得粉丝列表
	                 */
						getFansList: function(paramData) {
							var self = this;
							var reqData = $.extend({
								page: 1,
								pageNum: 20,
								mutualUserId: id
							},
							paramData);

							$.ajax({
								url: "p/interHistory/fansList/",
								data: reqData,
								dataType: "json",
								success: function(data) {
									self.$fansList.empty();
									if (data.errno == 0) {
										MultiPanel.$scrollHook.scrollTop(0);
										self.$fansList.html($("#contactTmpl").tmpl(data.rst.list)).children("li:even").addClass("evenLi");
										// 分页
										//var pageInfo = data.rst.pageInfo;
										var pageInfo = km.util.pageInfoByNum({
											$elem:$("#fans"),
											page:data.rst.pageInfo.page
										});
	                                    // 侧面板的分页需要阻止主页面往页首跳
	                                    pageInfo.preventTop = 1;
										km.util.pageBar(pageInfo, $('#panel-fans-pager').show(), function(pageNum) {
											$multiPanelOverlay.scrollTop(0);
											reqData.page = pageNum;
											self.getFansList(reqData);
										});
									}
								}
							})
						},
						/*
		                 *得到交互历史列表
		                 */
						getHistoryList: function(paramData) {
							//假数据地址名:/phony-data/history.json
							MultiPanel.loading();
							var date = new Date(),
							timestamp = date.getTime();
							//sysTip.show("交互历史列表正在加载中!");
							var reqData = {
								"pageNum": 20,
								"mutualUserId": id,
								//交互用户的id.
								"timestamp": timestamp //最后一条微博的创建时间
							}
							$.getJSON('p/interHistory/historyList/', reqData, function(data) {
								MultiPanel.loaded();
								//sysTip.hide();
								if (data.errno == 0 && data.rst.list.length) {
									//data.rst.list[0].date = "2013年2月";
									for(var i =0;i<data.rst.list.length;i++){
										var monthHistory = data.rst.list[i],
										$monthHistory = $("<div class='dateMod'></div>"),
										//$monthHistory = $("<div class='date'></div>"),
										$ul = $("<ul></ul>");
											
										$("<strong class='date'>" + monthHistory.date + "</strong>").appendTo($monthHistory);
										$("#historyTmpl").tmpl(monthHistory.list, data.rst.u).appendTo($ul);
										$ul.appendTo($monthHistory);
										//$monthHistory.appendTo("#historyMod");
										$monthHistory.appendTo("#historyList");
									}
									
								}

							});
						},
						/*
		                 * 添加交互历史
		                 */
						addHistory: function(paramData) {
							var self = this;
							var reqData = {
								content: paramData.content,
								mutualUserId: paramData.mutualUserId
							}

							$.ajax({
								url: "p/interHistory/addInteractive/",
								data: reqData,
								success: function(data) {
									paramData.$elem.removeAttr("disabled");
									if (data.errno == 0) {
										//当之前已经有交互历史的时候
										var $dateMod = $("#historyList").find(".dateMod");
										var $monthHistory = $("<div class='dateMod'></div>");

										data.rst.type = "interaction";
										data.rst.action = "add";
										data.rst.meInitiative = true;
										var $firstDateMod = $dateMod.first();
										var firstMonthValue = $firstDateMod.find(".date").html(); 
										if ($dateMod.length>0&&firstMonthValue==data.rst.date) { //已经有历史交互了
											

											//if (data.rst.date == firstMonthValue) { //已经有该月份的历史交互了.
												$("#historyTmpl").tmpl(data.rst, data.rst.u).prependTo($firstDateMod.children("ul"));
											//} else { //没有该月份的历史交互
												/*
												var $ul = $("<ul></ul>");
												$("<strong class='date'>" + data.rst.date + "</strong>").appendTo($monthHistory);
												$("#historyTmpl").tmpl(data.rst, data.rst.u).appendTo($ul);
												$ul.appendTo($monthHistory);
												$monthHistory.appendTo("#historyList");
											}
											*/
										} else { //还没有历史交互或者是没有当前月的交互历史
											var $ul = $("<ul></ul>");
											$("<strong class='date'>" + data.rst.date + "</strong>").appendTo($monthHistory);
											$("#historyTmpl").tmpl(data.rst, data.rst.u).appendTo($ul);
											$ul.appendTo($monthHistory);
											$monthHistory.prependTo("#historyList");
										}
										/*
	                                var $ul = $("<ul></ul>");
	                                $("<strong class='date'>"+data.rst.date+"</strong>").appendTo($monthHistory);
	                                $("#historyTmpl").tmpl(data.rst,data.rst.u).appendTo($ul);
	                                
	                                $ul.appendTo($monthHistory);
	                                $monthHistory.appendTo("#historyList");
	                                */
										//self.$historyList.prepend($("#historyTmpl",data.rst.u).tmpl(data.rst));
										self.$addHistoryMod.hide();
										self.$historyInput.val("");
										$("#addHistoryNav").show();
									}
								}
							})

						}
					};
					interactiveHistory.init();
				} else {
                    $container.html($('#panel-notice-tmpl').tmpl({
                        'info': '查询不到该账号信息。'
                    }));
                };
				//end
			}
		})
		
	};

	MultiPanel.addOffAction(function() {
		$multiPanelWrap.find(".notTip, .notice").hide();
        $('div.atwho').hide();
	})

	// 载入微博详情
	// 对侧面板的表情框位置修正，修改为去offset + fixed
	function fixedEmotion($container, $target) {
		var $emotionBox = $('div.win-emotion');
		if (!$emotionBox.closest($container).length) {
			var offset = $target.offset(),
			height = $target.height(),
			width = $target.width();
			$emotionBox.css({
				'top': offset.top + height - 7,
				'left': offset.left - 24
			});
		};
	};
	
	function loadWeibo($container, id, loaded_callback) {
		var $detailTmpl = $('#weibo-detail-tmpl').template();
		var $commentTmpl = $("#commentFowardTmpl").template();
		var quick_form_tmpl = $('#retweet-comment-form-tmpl').template();
		MultiPanel.loading();
		$.ajax({
			url:'/p/interHistory/getWeiboDetail/',
			customErr:true,
			data:{
				'weiboId': id
			},
			success:function(data) { //'/phony-data/weibo-detail.json' ||'
				MultiPanel.loaded();

				if(data.errno === 11001 || data.errno === 20000){
                    var notice_info = '抱歉，该微博貌似已经被删除啦~';
                    if (km.active.platform !== MultiPanel.metaInfo('platform')) {
                        notice_info = '已切换平台，无法获取正确数据。';
                    };
                    $container.html($('#panel-notice-tmpl').tmpl({
                        'info': notice_info
                    }));
					return;
                };
                //start
				if (data.rst) {
					// 保存微博数据上来
                    var weiboData = data.rst;
					$container.html($.tmpl($detailTmpl, data.rst, km.util.postFormatter)).data('weibo-detail', weiboData);
					var $fowardList = $("#fowardList"),
					$commentList = $("#commentList");
					//网转发的输入框里填充进转发微博的完整内容
					var getForwardContent = function(data){ //data:后台穿过来的data.rst对象
						var fowardContent = "//@"+data.u.sn+":"+data.tx;
						var $forwardInput = $('#fowardMod textarea.emotion-inputor');
						$forwardInput.val(fowardContent);
						 // 字数限制与自适应高度, ctrl+enter提交
						//$forwardInput.checkText({
							//'banInput': 0
						//}).autoHeight();
						//km.util.domOperate.focusEnd($forwardInput[0], 0);
					}
					//if$$("#weiboContent .feed-info>span")
					if(weiboData.rt){
						getForwardContent(weiboData);
					}
					
					/*
	                 * 得到转发列表
	                 */
					var getFowardList = function(params) {
						// TODO
						$fowardList.empty();
						MultiPanel.loading();
						$.getJSON('/phony-data/retweet-list.json' && '/p/statuses/repost_timeline/', params, function(data) {
							MultiPanel.loaded();
							if (data.rst && data.rst.list) {
								$fowardList.html($.tmpl($commentTmpl, data.rst.list, {
									'listType': 'retweet'
								}));

								//分页
								var pageInfo = data.rst.pageInfo;
	                            // 侧面板的分页需要阻止主页面往页首跳
	                            pageInfo.preventTop = 1;
								km.util.pageBar(pageInfo, $('#retweet-list-pager').show(), function(pageNum) {
									params.page = pageNum;
									getFowardList(params);
								});
							};
						});
					};
					/*
	                 * 得到评论列表
	                 */
					var getCommentList = function(params) {
						// TODO
						$commentList.empty();
						MultiPanel.loading();
						$.getJSON('/phony-data/comment-list.json' && '/p/comments/show/', params, function(data) {
							MultiPanel.loaded();
							if (data.rst && data.rst.list) {
                                for (var i = 0; i < data.rst.list.length; i++ ) {
                                    data.rst.list[i].rt = weiboData;
                                }
								$commentList.html($.tmpl($commentTmpl, data.rst.list, {
									'listType': 'comment'
								}));

								//分页
								var pageInfo = data.rst.pageInfo;
	                            // 侧面板的分页需要阻止主页面往页首跳
	                            pageInfo.preventTop = 1;
								km.util.pageBar(pageInfo, $('#comment-list-pager').show(), function(pageNum) {
									params.page = pageNum;
									getCommentList(params);
								});
							};
						});
					};

					getCommentList({
						'mid': id,
						'pageNum': 1
					});
					getFowardList({
						'mid': id,
						'pageNum': 1
					});

					var $listWrap = $('#feed-list-wrap');

	                var $inputorMain = $container.find('textarea.emotion-inputor');
					$inputorMain.checkText({
						'banInput': false
					}).each(function() {
	                    if ($(this).is(':visible') && ! $(this).data('autoHeight')) {
	                        $(this).focus().autoHeight().data('autoHeight', 1);
	                    };
	                });
	                // @atwho 处理
	                $inputorMain.each(function() {
						var atWho = Xwb.use('atWho', {
							appendTo: document.body,
	                        Inputor: $(this),
							autoRender: true
						});
	                });

					// handle the toggle and submit
					var $forwardMod = $('#fowardMod'),
					$commentMod = $('#commentMod');
					var $syncOptions = $('input.retweet-comment-sync');
					var toggleHandler = {
						'common': function(event, type) {
                            $inputorMain.focus().each(function() {
	                            var isVisible = $(this).is(':visible');
	                            if (isVisible && ! $(this).data('autoHeight')) {
	                                $(this).autoHeight().data('autoHeight', 1);
	                            };
	                            isVisible && $(this).trigger('autoheighthandller');
	                        });
							$syncOptions.removeAttr('checked');
						},
						'retweet': function(event) {
	                        $forwardMod.show();
							$commentMod.hide();
							toggleHandler.common.call(this, event, 'retweet');
						},
						'comment': function(event) {
							$commentMod.show();
							$forwardMod.hide();
							toggleHandler.common.call(this, event, 'comment');
						}
					};

					$("#weiboContent").off('click').on('click', '.type-toggle', function(event) {
						$(this).addClass("active").siblings().removeClass("active");
						toggleHandler[$(this).data('type')].call(this, event);
						event.preventDefault();
					});
					// handle the form submit
					var submitHandler = function(listType) {
						var $weiboForm = $(this).closest('form');
						var $listWrap = $commentList;

						var $textarea = $(this).closest('.emotion-box').find('textarea.emotion-inputor');
						var content = $.trim($textarea.val());
						if (!content) {
							return;
						};
                        var extra_value = $textarea.data('extra-value');
                        if (extra_value) {
                            content = content.replace(extra_value, '');
                        };
                        content += $textarea.data('append') || '';
                        $textarea.val(content);

						// 转发和评论相同的部分
						var $retweetAppend = $weiboForm.find('input.retweet-append');
						var $originAppend = $weiboForm.find('input.retweet-to-origin');
						var $currAppend = $weiboForm.find('input.retweet-to-curr');
						var rt = ~~$currAppend[0].checked && 1; // 评论给作者 0 或 1
						var ort = 0;
                        // 当前就是原创微博，那么 $originAppend是不存在的
                        if ($originAppend.length) ort = ~~$originAppend[0].checked && 2; // 评论给原作者 0 或 2
						$retweetAppend.val(rt + ort); // 相加

						if (listType === 'retweet') {
							$listWrap = $fowardList;
						};
						// TODO
						var url = '/phony-data/retweet-list.json' && '/p/timing/timingInteract/';
						// TODO
						// serialize之后的数据不能自动带km.commonParam了，需要小心
                        // 评论转发微博或回复，勾选了转发到我的微博，需要完整的拼接内容
                        var $rt = $weiboForm.find('.retweet-content');
                        if ($rt.length) {
                            $rt.val(content + $rt.val());
                        };

						var params = $weiboForm.serialize();
						params += ('&' + $.param(km.commonParam));

						if ($weiboForm.is('.main-form')) {
							toggleHandler.common();
						} else {
							$weiboForm.hide();
						};

						$.post(url, params, function(data) {
							if (data.rst) {
								data.rst.mid = data.rst.id;
								data.rst.u = km.active;
								data.rst.cr = new Date() || data.timestamp;
								data.rst.repostsCount = 0;
								data.rst.rt = $container.data('weibo-detail').rt || $container.data('weibo-detail');
								$listWrap.prepend($.tmpl($commentTmpl, data.rst, {
									'listType': listType
								}));

								var msg = '发布成功！';
								if (data.errno === 0) {
									MB.tipOk(msg);
									$textarea.val("");
									return;
								};
								switch (data.errno) {
								case 20012:
									msg = '转发文本超过140个字';
									break;
								case 20016:
									msg = '发布内容过于频繁';
									break;
								case 20017:
									msg = '不能发布相似内容';
									break;
								case 20018:
									msg = '内容中包含非法网址';
									break;
								case 20019:
									msg = '不能发布相同内容';
									break;
								case 20101:
									msg = '此微博不存在';
									break;
								case 20111:
									msg = '不能发布相同的微博';
									break;
								case 20206:
									msg = '只有被关注者可以评论';
									break;
								case 20207:
									msg = '只有可信用户可以评论';
									break;
								default:
									msg = '发布失败，请重试';
								}
								MB.error('', msg);
							};
						},
						'json');
					};

					// $container event lisenter
                    $container.off('click').off('keyup');
                    $container.on('click', '.delete-tweet', function(e) {
                        var mid = $(this).data('mid');
                        window.operateTip({
                            obj: $(this),
                            tipContent: '确定删除该微博?',
                            offsetX: - 10,
                            func: function() {
                                km.delWeiboById({
                                    mid: mid,
                                    callback: function(data) {
                                        if(data.errno === 0) {
                                            MultiPanel.off();
                                        }
                                    }
                                });
                            }
                        });
                    }).on('click', '.delete-comment', function(e) {
                    var mid = $(this).data('mid'), type = $(this).data('type'), $item = $(this).closest('li');
                        window.operateTip({
                            obj: $(this),
                            tipContent: '确定删除该' + (type === 'retweet' ? '转发' : '评论') + '?',
                            offsetX: - 10,
                            func: function() {
                                km.delWeiboById({
                                    mid: mid,
                                    type: type === 'retweet' ? null : 'direct_' + type,
                                    $weiboLi: $item
                                });
                            }
                        });
                    }).on('click', '.retweet-comment-submit', function(event) {
						event.preventDefault();
                        if (km.chkAccess('MESSAGE_CMT')) {
                            submitHandler.call(this, $(this).data('type'));
                        };
					}).on('click.quick', '.retweet-comment-quick', function() {
                        if (!km.chkAccess('MESSAGE_CMT')) {
                            return;
                        };
						// 评论转发列表中的快速转发或回复
						var $this = $(this),
						$item = $this.closest('li');
						var $quickForm = $item.find('form');
						var itemData = $item.tmplItem().data;
						var listType = $this.data('type');
						if (!$quickForm.length) {
							itemData.listType = listType;
							itemData.inputor = 1;
							itemData.defalutContent = itemData.tx;
							itemData.main_mid = (itemData.rt && itemData.rt.mid) || itemData.mid;
                            itemData.originUser = itemData.rt && itemData.rt.u;
                            // 如果是回复，则需要一个reply_mid，replyid代表微博主体, main_mid是评论主体id
                            if (listType === 'comment') {
                                itemData.main_mid = itemData.mid;
                                itemData.reply_mid =  itemData.rt && itemData.rt.mid;
                            };

							$item.append($.tmpl(quick_form_tmpl, itemData));
						} else {
							$quickForm.toggle();
						};
						// 隐藏了就啥也不做
						if ($quickForm.is(':hidden')) {
							return;
						};
	                    var $conInputor = $item.find('textarea.tweet-content');
						var value, cursorNum = 0;
						if (listType === 'retweet') {
							value = '//@' + itemData.u.sn + ': ' + itemData.tx;
						} else {
							value = '回复@' + itemData.u.sn + ':';
							cursorNum = undefined;
                            // 回复内容在提交时候需要去掉value前缀，后端会自动加，这里做个标记
                            $conInputor.data('extra-value', value);
						};
                        $conInputor.val(value);
						// 定位光标
						km.util.domOperate.focusEnd($conInputor[0], cursorNum);
						// @联想 atwho
						var atWho = Xwb.use('atWho', {
							appendTo: document.body,
							Inputor: $conInputor,
							autoRender: true
						});
	                    // 字数限制与自适应高度, ctrl+enter提交
	                    $conInputor.checkText({
							'banInput': false
						}).autoHeight();
                    });

					$(function() {
						var X = Xwb,
						emotionTrigger = 'a.emotion-trigger';
						//window.emotionContainer = $container;
						$container.on('click', emotionTrigger, function() {
							var $this = $(this);
							var selectionHolder = X.use('SelectionHolder', {
								elem: $this.closest('.emotion-box').find('textarea.emotion-inputor')[0]
							});
							X.use('emotion').setSelectionHolder(selectionHolder, function() {
								return true;
							},
							null).showAt($this[0]);

							MultiPanel.$scrollHook.off('.emotion').on('scroll.emotion', function() {
								fixedEmotion($container, $this);
							});
                            // 简单解决最后几条，表情层被遮盖的问题
                            $('#weiboPanel').css({
                                'padding-bottom': 310
                            });
                            // 解决表情层不在侧面板中，而导致在表情层无法鼠标滚动的问题
                            var mousewheel = 'DOMMouseScroll mousewheel';
                            $('div.win-emotion').css('z-index', 90).off(mousewheel).on(mousewheel, function(e) {
                            	// FF 和 chrome ie opera的正负方向想反
                            	var delta = e.originalEvent.detail || - e.originalEvent.wheelDelta;
                            	var up = delta < 0;
                            	var scrolltop = MultiPanel.$scrollHook.scrollTop();
								MultiPanel.$scrollHook.scrollTop(up ? scrolltop - 40 : scrolltop + 40);
					            e.preventDefault();
					        });
						}).on('keyup.submit-quick', 'textarea', function(e) {
	                        // 提交
	                        if(e.ctrlKey && (e.which === 13 || e.which === 10)) {
	                            $(this).closest('form').find('.retweet-comment-submit').trigger('click');
	                        };
	                    });

					});

					loaded_callback && loaded_callback();
				} else {
                    $container.html($('#panel-notice-tmpl').tmpl({
                        'info': '查询不到这条微博信息。'
                    }));
                };
			}
		})
	};

	// 载入审核任务列表
	var rejectReasons = {
		'content': '文案内容不佳',
		'image': '微博配图不佳',
		'time': '时间选择不当',
		'account': '发送账号不当',
		'other': '其他'
	};
	function loadAuditList ($container, page) {
		// 准备模板
		var templates = {
			'auditFrame': $('#audit-frame-tmpl').template(),
			'pendingList': $('#audit-pending-list-tmpl').template(),
			'emptyTip': $('#common-empty-tip-tmpl').template(),
			'rejectForm': $('#audit-reject-form-tmpl').template(),
			'panelTitle': $.template(null, '审核任务列表{{if count > 0}}(${count}){{/if}}')
		};
		var tip = {
			'pending': '暂无需审核任务，您可以前往发布页面<a class="new-audit-mission"><em>新建审核任务</em></a>',
			'reject': '目前还没有被驳回的任务'
		};
		var totalCount = 0;
		var refreshNum = function (totalCount) {
			MultiPanel.setTitle($.tmpl(templates.panelTitle, {'count': totalCount}));
		};

		// 渲染基本框架
		refreshNum(totalCount);
		$container.html($.tmpl(templates.auditFrame));

		// 获取对象
		var $auditFrame = $container.find('#panel-audit-frame');
		var $listWrap = $auditFrame.find('#panel-audit-list');
		var $pager = $auditFrame.find('div.page');
		var $initFilter = $('#init-active-filter');

		// 获取数据并渲染，分页
		function getAuditList (type, page) {
			type = type || 'pending';
			params = {
				page: page || 1,
				pageNum: 10,
				status: type
			};

			var url = 'p/audit/show/';
			MultiPanel.loading();
			MultiPanel.$scrollHook.scrollTop(0);
			$.getJSON(url, params, function (data) {
				MultiPanel.loaded();

				var rst = data.rst;
				if (!rst || !rst.list.length) {
					$listWrap.trigger('emptyTip', [type]);
					return;
				};

				var listData = rst.list, pageInfo = rst.pageInfo;
				// $.each(listData, function (i, v) {
				// 	v.reasons = '["content", "time"]';
				// 	v.comment = '出错了，重新发'
				// })
				totalCount = pageInfo.totalNum;
				refreshNum(totalCount);
				$listWrap.html($.tmpl(templates.pendingList, listData, {'rejectReasons': rejectReasons}));

				km.util.pageBar(pageInfo, $pager.show(), function(pageNum) {
					getAuditList(type, pageNum);
				});
			});
		}
		
		// 事件解绑定
		$listWrap.on('emptyTip', function (e, type) {
			$listWrap.html($.tmpl(templates.emptyTip, {'emptyTip': tip[type]}));
			$pager.hide()
		});
		$auditFrame.on('click', '.audit-type', function () {
			var $this = $(this), type = $this.data('type');
			if ($this.hasClass('active')) {
				return;
			}
			$this.addClass('active').siblings().removeClass('active');
			$auditFrame.data('actived-type', type);
			getAuditList(type);

		}).on('destroy.action', '.audit-item', function (e) {
			refreshNum(--totalCount);
			$(this).slideUp(function(){
				var type = $auditFrame.data('actived-type') || 'pending';

				if (! $(this).siblings().length) {
					getAuditList(type);
				};

                $(this).remove();

                km.publishApp && km.publishApp.getPanelNum();
            });
		}).on('delete.action', '.audit-item-action', function (e, $item, itemData) {
			// 删除审核
			window.operateTip({
                obj: $(this),
                tipContent: '您确定删除吗？',
                offsetX: - 60,
                func: function() {
                    $item.trigger('delete-direct', [itemData]);
                }
            });

		}).on('delete-direct.action', '.audit-item', function (e, itemData) {
			// 删除审核
			var $item = $(this);
            $.getJSON('/p/audit/delete/', {'missionId': itemData.id}, function (data) {
            	$item.trigger('destroy');
            });
		}).on('pass.action', '.audit-item-action', function (e, $item, itemData) {
			// 不显示弹窗，直接触发提交, direct
			itemData.isDirectPass = true;
			$(this).trigger('edit', [$item, itemData]);

		}).on('reject.action', '.audit-item-action', function (e, $item, itemData) {
			// 驳回
			var $rejectForm = $.tmpl(templates.rejectForm, {'missionId': itemData.id, 'reasons': rejectReasons});
			$rejectForm.modal('show');
			var $comment = $rejectForm.find('textarea'), $tip = $rejectForm.find('.tips');
			$comment.checkText({
				'$tip': $tip,
				'max': 50
			});
			$rejectForm.on('click', '.reject-reason-submit', function () {
				var overfill = $comment.data('overfill') || 1;
				// 超出了字数
				if (overfill < 0) {
					return false;
				};
				// 提交
				var $checked = $rejectForm.find(':checked');
				var reasons = $checked.map(function() {
	  				return $(this).val();
	    		}).get();

	    		var params = {
	    			'status': 'reject',
	    			'comment': $.trim($comment.val()),
	    			'reasons': JSON.stringify(reasons),
	    			'missionId': itemData.id
	    		};
	    		var url = '/p/audit/deal/';
	    		$.post(url, params, function (data) {
	    			$item.trigger('destroy');
	    			$rejectForm.modal('hide');
                	MB.tipOk('驳回审核成功!');
	    		}, 'json');

				return false;
			});

		}).on('edit.action', '.audit-item-action', function (e, $item, itemData, type) {
			var postbox = X.use('postBox'), type = type || (itemData.type === 'timing' ? 'sch' : 'normal');
			postbox.edit(type, $.extend({auditID: itemData.id}, itemData), function(){
				if (type.indexOf('-abort') !== -1) {
					$item.trigger('delete-direct', [itemData]);
					return;
				};
                $item.trigger('destroy');
            }, '审核任务');

		}).on('re-audit.action', '.audit-item-action', function (e, $item, itemData) {
			// 重新审核
			// TODO 原始的做法是 新建任务+删除此任务来完成 重新审核
			var type = itemData.type === 'timing' ? 'sch-abort' : 'normal-abort';
			$(this).trigger('edit', [$item, itemData, type]);

		}).on('click', '.audit-item-action', function () {
			if (km.isTrial()) {
                MB.error('提示',X.lang.ERRORMAP[12]);
                return;
            };
            if (!km.chkAccess('UPDATE_STATUS')) {
            	return;
            };

			// 通过审核 驳回 编辑并通过审核
			var $this = $(this), action = $this.data('action');
			var $item = $this.closest('li'), itemData = $item.data('tmplItem').data;
			$this.trigger(action, [$item, itemData]);
		}).on('click', '.new-audit-mission', function () {
			var postbox = X.use('postBox');
			postbox.edit('normal', { customType : 'audit'}, function(e) {
				refreshNum(++totalCount);
				km.publishApp && km.publishApp.getPanelNum();
				getAuditList();
			}, '新建审核任务')
		});

		// 初始化
		// 若等待审核为0，驳回任务不为0,则打开之后默认页面为“驳回任务list”
		$.getJSON("p/draft/number/", {isPanel: 1}, function (data) {
			var auditCount = data.rst || {};
			var $default = $initFilter;
			if (! auditCount.pending && auditCount.reject) {
				$default = $initFilter.next();
			}

			$default.trigger('click');
		});
	}

	// 草稿箱（draft） 和 收集微博列表（collection）
	// $containaer = 侧面板容器, page = 列表页码，reserve_type = 类型
	function loadReserveList ($container, page, reserve_type) {
		// 准备基本数据
		reserve_type = reserve_type || 'draft';
		var templates = {
			'reserveFrame': $('#reserve-frame-tmpl').template(),
			'reserveList': $('#reserve-list-tmpl').template(),
			'emptyTip': $('#common-empty-tip-tmpl').template(),
			'panelTitle': {
				'draft': $.template(null, '草稿箱{{if count > 0}}(${count}){{/if}}'),
				'collection': $.template(null, '收集微博列表{{if count > 0}}(${count}){{/if}}')
			} 
		};
		
		var urlMap = {
			'list': '/p/draft/show/',
			'deleteDraft': '/p/draft/delete/',
			'batchSend': '/p/timing/timingLisUpdate/'
		};
		var tip = {
			'draft': '您当前没有草稿，您可以前往内容发布页<a class="reserve-new-draft"><em>新建草稿</em></a>。',
			'collection': '您当前没有收集，您可以前往<a href="/collect.html"><em>内容收集</em></a>页收集微博。'
		};
		//  资源总数
		var count = 0;

		// 渲染基本框架
		var now = new Date();
		$container.html($.tmpl(templates.reserveFrame, {
			'reserve_type': reserve_type,
			'now': now.getTime(),
			'now_date': DATE.format(now, 'yyyy-MM-dd'),
			'now_hour': now.getHours(),
			'now_minute': now.getMinutes()
		}));
		// 获取对象
		var $reserveFrame = $('#panel-reserve-frame');
		var $contentWrap = $reserveFrame.find('div.reserve-content-wrap');
		var $emptyWrap = $reserveFrame.find('div.empty-content-wrap');
		var $listWrap = $('#panel-reserve-list');
		var $pager = $reserveFrame.find('div.page');
		var $batchSendingDate = $('#batch-sending-date'), $batchSedingInterval = $('#batch-sending-interval');
		var $batchSedingHours = $('#batch-sending-hour'), $batchSendingMunites = $('#batch-sending-minute');


		MultiPanel.setTitle($.tmpl(templates.panelTitle[reserve_type], {'count': 0}));

		// 获取数据并渲染，分页
		function getReserveList (type, page) {
			type = type || 'draft';
			params = {
				page: page || 1,
				pageNum: 10,
				draftType: type
			};

			MultiPanel.loading();
			MultiPanel.$scrollHook.scrollTop(0);
			$.getJSON(urlMap['list'], params, function (data) {
				MultiPanel.loaded();
				var rst = data.rst;
				if (!rst.list || !rst.list.length) {
					$reserveFrame.trigger('emptyTip');
					return;
				};
				$reserveFrame.trigger('emptyTip', [false]);

				var listData = rst.list, pageInfo = rst.pageInfo;
				$listWrap.html($.tmpl(templates.reserveList, listData));

				count = pageInfo.totalNum || 0;
				MultiPanel.setTitle($.tmpl(templates.panelTitle[reserve_type], {'count': count}));
			
				km.util.pageBar(pageInfo, $pager, function(pageNum) {
					getReserveList(type, pageNum);
				});
			});
		};

		$reserveFrame.on('emptyTip', function (e, isEmpty) {
			isEmpty = isEmpty === undefined ? true : false;
			$contentWrap.toggle(!isEmpty);
			$emptyWrap.html($.tmpl(templates.emptyTip, {'emptyTip': tip[reserve_type]})).toggle(isEmpty);
		}).on('edit.action', '.reserve-action', function (e, $item, itemData, type) {
			var boxTypeMap = {
				'draft': 'draft',
				'collection': 'draft'
			}, boxTitle = {
				'draft': '编辑草稿',
				'collection': '编辑收集内容'
			}
			var postbox = X.use('postBox'), type = type || itemData.draftType;
			
			postbox.edit(boxTypeMap[type], $.extend(itemData, {saveDraft: ''}), function(data1, data2, data3){
            	itemData.tx = data2.tx;
            	if(data2.tp){	//网络图片
            		itemData.tp = data2.tp;
                	itemData.op = data2.op;
                	itemData.pic_urls = [];	//@xioahai 2014.2.14 如不清空，多图插件默认会展示pic_urls
            	}else{	//本地图片
            		var imgMap = JSON.parse(data2.imgMap),
            			pic = imgMap.sina || imgMap.tencent || imgMap.renren;
            		itemData.pic_urls = pic;
            	}

                $item.trigger('update-item', [itemData]);

            }, boxTitle[type]);

		}).on('send.action', '.reserve-item', function (e, $item, itemData, type) {
			var postbox = X.use('postBox'),
			boxTitle = {
				'draft': '发送草稿',
				'collection': '发送收集微博'
			},
			type = type || itemData.draftType;
			postbox.edit('normal-pop-audit', $.extend(itemData, {saveDraft: type}), function(t, data){
				if (data.saveDraft) {
					$item.addClass('reserve-used');
					return;
				};

                $item.trigger('destroy');
            }, boxTitle[type]);

		}).on('update-item.action', '.reserve-item', function (e, itemData) {
			$(this).replaceWith($.tmpl(templates.reserveList, itemData));
		}).on('destroy.action', '.reserve-item', function () {
			MultiPanel.setTitle($.tmpl(templates.panelTitle[reserve_type], {'count': --count}));

			// 篮子数字的处理
           	reserve_type === 'collection' && km.basket('number', {
                count: count
            });
            
			$(this).slideUp(function(){
                if (! $(this).siblings().length) {
					getReserveList(reserve_type);
                }
                $(this).remove();

               	km.publishApp && km.publishApp.getPanelNum();
            });
		}).on('delete.action', '.reserve-action', function (e, $item, itemData) {
			// 删除审核
			window.operateTip({
                obj: $(this),
                tipContent: '您确定删除吗？',
                offsetX: - 60,
                func: function() {
                    $.getJSON(urlMap.deleteDraft, {'draftId': itemData.id}, function (data) {
                    	$item.trigger('destroy');
                    })
                }
            });

		}).on('click', '.reserve-action', function () {
            if (!km.chkAccess('UPDATE_STATUS')) {
            	return;
            };
			// 编辑， 删除， 发送(草稿，收集)
			var $this = $(this), action = $this.data('action');
			var $item = $this.closest('li'), itemData = $item.data('tmplItem').data;

			$this.trigger(action, [$item, itemData]);
		}).on('click.batch-send', '#btn-batch-sending', function () {
            if (!km.chkAccess('UPDATE_STATUS')) {
            	return;
            };
			var $this = $(this);
			if ($this.isLocked()) {
				return;
			};
			var $itemList = $('#panel-reserve-list > li');
			var itemCount = +$('#batch-sending-count').val() // 微博条数
				,	interval = +$batchSedingInterval.val() // 间隔时间
				,	date = $batchSendingDate.datepicker("getDate") // 日期
				,	hours = $batchSedingHours.val() // 小时
				,	minutes = $batchSendingMunites.val(); // 分钟

			var datetime = new Date(date), now = new Date().getTime();
			datetime.setHours(hours);
			datetime.setMinutes(minutes);

			datetime = datetime.getTime();
			// 时间转换为毫秒
			interval = interval * 60 * 1000;
			// 修正
			if (datetime < now) datetime = now + interval;
			// 根据微博条数取得当前列表的相应数据
			var tweets = [], length = Math.min(itemCount, $itemList.length);
			var $usedItem = $(), lastDealTime;
			for (var i = 0; i < length; i ++ ) {
				var $item = $itemList.eq(i);
				var tweet = $item.data('tmplItem').data;
				$usedItem = $usedItem.add($item);
				var dealTime = datetime + interval * i;
				tweets.push({
					'draftID': tweet.id,
					'tx': tweet.tx || '',
					'tp': tweet.tp || '',
					'op': tweet.op || '',
					'dealTime': dealTime
				});
				lastDealTime = dealTime;
			};

			var socialAccountIDs = [{
				'platform': km.active.platform,
				'socialAccountID': km.active.id
			}];

			MultiPanel.loading();
			$this.lock();
			$.post(urlMap.batchSend, {
				'socialAccountIDs': JSON.stringify(socialAccountIDs),
				'statuses': JSON.stringify(tweets),
				'depID': km.activeGroup.depId
			}, function (data) {
				MultiPanel.loaded();
				$this.unLock();
				MB.tipOk("批量任务添加成功！");
				$usedItem.trigger('destroy');

				// 为连续点击批量发送按钮做一个开始时间容错
				lastDealTime = new Date(lastDealTime + interval);
				var lastHours = lastDealTime.getHours(), lastMunites = lastDealTime.getMinutes();
				$batchSendingDate.datepicker("setDate", lastDealTime);
				$batchSedingHours.val(lastHours);
				$batchSendingMunites.val(lastMunites);

			}, 'json');

		}).on('click', '.reserve-new-draft', function () {
			var postbox = X.use('postBox');
			postbox.edit('draft', {}, function() {
				getReserveList(reserve_type);
				km.publishApp && km.publishApp.getPanelNum();
 			}, '新建草稿');
		});

		// 特例的事件处理
		if ($batchSendingDate.length) {
			$batchSendingDate.datepicker({
                dateFormat: 'yy-mm-dd',
                minDate: now,
                onSelect: function(dateText, inst) {
                    var date = $batchSendingDate.datepicker("getDate");
                    $batchSendingDate.data('datetime', date);
                },
                beforeShow: function(input, inst) {
                    inst.dpDiv.removeClass().addClass('calendar input-calendar');
                }
            }).datepicker("setDate", now);

            $batchSedingInterval.on('keyup paste', function () {
            	$(this).val($(this).val().replace(/\D/g,''));
            });
		};
		// 拖拽排序
		'collection' === reserve_type && $('#panel-reserve-list').dragsort({
			dragSelector: 'span.move-handle'
		});

		// init
		getReserveList(reserve_type);
	};
	// 载入内容收集
	function loadCollectionList($container, page) {
		loadReserveList($container, page, 'collection');
	};

	// 在基本数据获取后，再执行
	km.onGetProfile.add(function() {
		// 因为使用了backbone，所以只能初始化一次，否则会抛出异常
		Backbone.history.start();
	});
	km.onProfileChange.add(function() {
		MultiPanel.refresh();
	});
	// 返回一个指定起点和终点数字的数组
	// 第一次用于收集微博的批量发送功能，用于输出option
	window.getNumOptions = function (start, end) {
		end = end || 0, start = start || 0;
		var nums = [];
		for (; start <= end; start++) {
			nums.push(start);
		};
		return nums;
	};
})(window, jQuery);

