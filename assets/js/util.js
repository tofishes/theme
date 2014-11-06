;(function(global) {
    function isType(type) {
      return function(obj) {
        return {}.toString.call(obj) == "[object " + type + "]"
      }
    };
    global.isType = isType;
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

    var DATE = {};
    DATE.format = function(date, format) {
        if (!date) return '';
        date = date.getTime ? date : new Date(date);
        var _date = "", now = km.standardTime ? new Date(km.standardTime) : new Date();

        if (format) {
            var o = {
                "M+": date.getMonth() + 1,  //month
                "d+": date.getDate(),   //day
                "h+": date.getHours(),  //hour
                "m+": date.getMinutes(),    //minute
                "s+": date.getSeconds(),    //second
                //quarter
                "q+": Math.floor((date.getMonth() + 3) / 3),
                "S": date.getMilliseconds() //millisecond
            };
            if (/(y+)/.test(format)) {
                format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
            };
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(format)) {
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
                };
            };

            _date = format;
        } else {
            // +1000, 用来忽略掉小于1秒的情况
            var differ = (now - date + 1000) / 1000;
            if (differ < 0) {
                // @tofishes 改变小于0的策略，返回0秒前
                //return DATE.format(date, now.getFullYear() === date.getFullYear() ? 'MM-dd hh:mm' : 'yyyy-MM-dd hh:mm');
                _date = '0秒前';
            };
            if (differ < 60) {
                _date = parseInt(differ, 10) + '秒前';
            } else if (differ < 60 * 60) {
                _date = parseInt(differ / 60, 10) + '分钟前';
            } else {
                var formater;
                if (differ < 24 * 60 * 60 && now.getDate() == date.getDate()) {
                    formater = '今天 hh:mm';
                } else {
                    formater = now.getFullYear() === date.getFullYear() ? 'MM-dd hh:mm' : 'yyyy-MM-dd hh:mm';
                };
                _date = DATE.format(date, formater);
            };
        };

        return _date;
    };
    global.DATE = DATE;
})(window);

define(function (require, exports, module) {
    var platform = 'sina';
    var util = {
        postFormatter: {
            formatTxt: function(txt, subsize) {
                var tx = (subsize && util.byteLen(txt) / 2 > subsize) ? util.byteCut(txt, subsize * 2, '…') : txt;
                tx =  tx.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/(HTTP[S]?|http[s]?|tel|ftp):(\/\/)?([\[\]:\+\-\w\.]+)?[&=;:@#%!~'\/\w\+\-\,\.\$\?\*\(\)]*/ig, function(m) {
                    return '<a class="out-link" href="' + m + '" target="_blank">' + m + '</a>';
                }).replace(/@([\u4e00-\u9fa5\-\w]+)([ \.\:])?/g, function(m, s, t) {
                    if(s) {
                        var platformAT = {
                            sina: 'http://weibo.com/n/',
                            tencent: 'http://t.qq.com/'
                        };
                        if (t === '.') {
                            return m;
                        } else if (t === ':') {
                            return '<a class="multi-panel" data-route="/user/@' + s +
                                '" href="' + platformAT[platform] + s + '" data-usercard="' + s + '" target="_blank">@' + s + '</a>:';
                        } else {
                            return '<a class="multi-panel" data-route="/user/@' + s +
                                '" href="' + platformAT[platform] + s + '" data-usercard="' + s + '" target="_blank">@' + s + '</a>';
                        }
                    } else {
                        return m;
                    }
                }).replace(/#([^<>#]+)#/g, function(m, s) {
                    if(s && s.replace(/^\s*|\s*$/, '')) {
                        return '<a href="http://weibo.com/k/' + s + '" target="_blank">' + m + '</a>';
                    } else {
                        return m;
                    }
                }).replace(/\[[\u4e00-\u9fa5a-z]+\]/g, function(w) {
                    var emotion = w;
                    if(km.emotions && km.emotions.length) {
                        for(var i = 0, len = km.emotions.length; i < len; i++) {
                            if(w == km.emotions[i].phrase) {
                                var etxt = km.emotions[i].phrase.replace(/\[/, '').replace(/\]/, '');
                                emotion = '<img src="' + km.emotions[i].url + '" alt="' + etxt + '" title="' + etxt + '" />';
                                break;
                            }
                        }
                    }
                    return emotion;
                }).replace(/[\uE001-\uE05A]|[\uE101-\uE537]/g, function(w) {
                    var emoji = escape(w).replace('%u', '').toLowerCase();
                    return $.trim(emoji) ? '<img src="http://www.kmsocial.cn/images/emoji/' + emoji + '.png" />' : w;
                });
                return jEmoji.unifiedToHTML(tx);
            },
            _blankLink: function(link, subsize) {
                if (!link) {
                    return '';
                };
                if (link.indexOf('<a') == -1) {
                    return link;
                };
                //@xiaohai 2013.7.11 截字符
                var $link = jQuery(link),
                    text = $link.text();
                text = (subsize && util.byteLen(text) / 2 > subsize) ? util.byteCut(text, subsize * 2, '…') : text;

                return $link.text(text).attr("target","_blank")[0].outerHTML;
            }
        },
        /**
         *  返回占用字节长度（一个字两个字节）
         * @param {String} text
         * @return {Number}
         */
        byteLen: function(text) {
            var len = text.length;
            var matcher = text.match(/[^\x00-\xff]/g);
            if(matcher) len += matcher.length;
            return len;
        },
        /**
         *  返回UTF8编码的字节长度
         * @param {String} string
         * @return {Number}
         */
        getUTF8Length: function (string) {
            if (typeof string !== 'string') return 0;
            var i = 0,
                j = 0,
                codePoint,
                codePointsArr = [],
                utf8Length = 0;
            while (!isNaN(codePoint = string.charCodeAt(i))) {
                codePointsArr.push(codePoint);
                i++;
            }
            for (; j < codePointsArr.length;) {
                if (codePointsArr[j] < 128) {
                    utf8Length += 1;
                    j++;
                } else if (codePointsArr[j] >= 128 && codePointsArr[j] < 2048) {
                    utf8Length += 2;
                    j++;
                } else if ((codePointsArr[j] >= 2048 && codePointsArr[j] < 55296) || (codePointsArr[j] >= 57344 && codePointsArr[j] <= 65535)) {
                    utf8Length += 3;
                    j++;
                } else {
                    utf8Length += 4;
                    j += 2;
                }
            }
            return utf8Length;
        },

        byteCut : function(str, length, suffix) {
            var wlen = kmcommon.checking.byteLen(str), suffix = suffix == undefined ? '' : suffix;
            if(wlen>length){
              // 所有宽字用&&代替
              var c = str.replace(/&/g, " ")
                         .replace(/[^\x00-\xff]/g, "&&");
              // c.slice(0, length)返回截短字符串位
              str = str.slice(0, c.slice(0, length)
                        // 由位宽转为JS char宽
                        .replace(/&&/g, " ")
                        // 除去截了半个的宽位
                        .replace(/&/g, "").length
                    );
              str += suffix;
            }
            return str;
        },

        /* 表情解析 */
        getEmotions: function(callback) {
            $.ajax({
                callbackParameter: 'callback',
                cache: true,
                url: '/data/emotions.json',
                success: function(data) {
                    km.emotions = data;
                }
            });
        }
    };

    module.exports = util;
    return util;
});