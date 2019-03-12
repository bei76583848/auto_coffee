
var appData = {
	orderShow: false,//false首页 | true订单页
	randomNum: 1,//详情页banner随机数
	phoneVal: '76583848',
	orderCondition: '',//筛选订单列表条件 admin管理员
	admin: '',//管理员账号
	
	qrcodeImg: '',
	paytimer: null,
	preDt: null,//获取二维码参数
	payStatus: false,//付款状态
	
	tabList: [],
	tabNum: '',//桌号
	
	latteList: [],//拉花列表
	pullIdx: -1,//拉花下标
	
	orderList: [],//订单列表
	orderListIdx: -1,
	
	indexList: [],//咖啡列表
	detailItem: null,//详情页显示内容
	
    // 加载页面
    loading: true,
    // 请求加载弹窗
    ajaxLoading: false,
    //页面
    page: {
        index: true,
		details: false,
		chioseTab: false,
		paymentPg: false
    },
    //弹窗
    pop: {
        phonePop: false,
		againMake: false,
		payinfo: false
    },
	//弹窗黑色背景
	popupBg: false,

    // 淡入淡出信息
    fAlert: {
        show: false,
        text: "提示"
    },
};

var app = new Vue({
    el: '#app',
    data: appData,
    methods: {
        /*
         * 页面切换
         * app.pageShow('index')
         */
        pageShow: function (id) {
            for (var i in this.page) {
                this.page[i] = i == id ? true : false;
            }
        },
        /*
         * 弹窗切换
         * app.poeShow('rule')
         */
        popShow: function (id) {
            for (var i in this.pop) {
                this.pop[i] = i == id ? true : false;
            }
			this.popupBg = id ? true : false;
        },

        /*
         * 关闭弹窗
         * app.close()
         */
        close: function () {
            this.popShow();
        },
        
        popShowOnly: function (id) {
        	if(!id) return;
            this.pop[id] = true;
            this.popupBg = true;
        },
        closeOnly: function(id) {
        	if(!id) return;
            this.pop[id] = false;
            this.popupBg = false;
        },

        /*
         * 错误提示淡入淡出
         * app.fadeAlert("hellow world",2000)
         */
        fadeAlert: function (text, time) {
            if (this.fadeAlertSetTime) {
                clearTimeout(this.fadeAlertSetTime)
            }
            this.fAlert.show = true;
            this.fAlert.text = text;
            this.fadeAlertSetTime = setTimeout(function () {
                app.fAlert.show = false;
            }, time ? time : 1500);
        },
		
		init: function() {
			this.phoneVal = '';
			this.pullIdx = -1;
			this.orderListIdx = -1;
			detailItem = null;
		},
		
		//打开选择桌号页
		chioseTabShow: function() {
			this.page.chioseTab = true;
		},
		//关闭选择桌号页
		setTabNum: function(id) {
			this.tabNum = id;
			this.page.chioseTab = false;
		},
		//打开详情页
		showDetails: function(item) {
			this.detailItem = item;
			this.pageShow('details');
			this.randomNum = Math.ceil(Math.random() * 10);
		},
		//选择拉花
		setPullIdx: function(idx) {
			this.pullIdx = idx;
		},
		//订单页
		toOrder: function() {
			if(this.phoneVal != this.admin) {
				if(!this.phoneVal) {
					this.fadeAlert('请输入手机号码');
					return false;
				}
				if(!/^0?1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(this.phoneVal)) {
					this.fadeAlert('手机格式错误');
					return false;
				}
			}
			this.orderCondition = this.phoneVal;
			app.ajaxLoading = true;
			axios('/api/v1/orders')
				.then(function(res) {
					for(var i = 0, len = res.data.length; i < len; i++) {
						res.data[i].priceStr = (Number(res.data[i].totalFee) / 100).toFixed(2);
						//time
						var payTime = parseInt(res.data[i].payTime);
						var timeStr = new Date(payTime).getFullYear() + '.' + 
									  (new Date(payTime).getMonth() + 1) + '.' + 
									  new Date(payTime).getDate() + ' ' + 
									  (new Date(payTime).getHours() > 9 ? new Date(payTime).getHours() : '0' + new Date(payTime).getHours()) + ':' + 
									  (new Date(payTime).getMinutes() > 9 ? new Date(payTime).getMinutes() : '0' + new Date(payTime).getMinutes());
						res.data[i].timeStr = timeStr;
					}
					app.orderList = res.data;
					app.ajaxLoading = false;
					app.toIndex(true);
				})
				.catch(function(res) {
					app.ajaxLoading = false;
					app.fadeAlert('网络开小差了');
				})
		},
		refreshOrder: function() {
			this.phoneVal = this.orderCondition;
			this.toOrder();
		},
		
		//首页
		toIndex: function(bool) {
			this.init();
			this.close();
			this.orderShow = bool;
			window.scrollTo(0,0);
			this.pageShow();
		},
		//再次制作弹窗
		idxLTxBtn: function(idx) {
			this.orderListIdx = idx;
			this.popShow('againMake');
		},
		//再次制作
		setAgain: function() {
			this.orderList[this.orderListIdx].type = 1;
			this.addOrder(this.orderList[this.orderListIdx], function() {
				app.fadeAlert('开始制作', 3000);
				app.close();
			})
		},
		//支付下单
		paymentPgShow: function() {
			if(!this.phoneVal) {
				this.fadeAlert('请输入手机号码');
				return false;
			}
			if(!/^0?1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(this.phoneVal)) {
				this.fadeAlert('手机格式错误');
				return false;
			}
			if(!this.tabNum && this.tabNum !== 0) {
				this.fadeAlert('请选择桌号');
				return false;
			}
			this.orderCondition = this.phoneVal;
			this.phoneVal = '';
			this.page.paymentPg = true;
		},
		//付款页返回首页
		paytoIndex: function() {
			//清除二维码 & 定时器
			if(this.qrcodeImg) {
				this.qrcodeImg = '';
				clearInterval(app.paytimer);
				app.paytimer = null;
				//取消美团订单
			}
			this.toIndex();
		},
		//付款成功，查看订单
		seeOrder: function() {
			this.paytoIndex();
			this.phoneVal = this.orderCondition;
			this.toOrder();
		},
		//选择支付方式生成支付二维码
		chiosePay: function(str) {
			//生成美团支付必要信息
			this.preDt = this.setPreDt(str);
			if(!this.preDt) return;
			//请求成功返回
			var code = {
				status: 'SUCCESS',//SUCCESS成功；FAIL失败
				errMsg: '请求失败显示文本',//错误消息描述（status 为失败的时候有）
				qrCode: 'img/qrcode.png'
			};
			if(code.status == 'SUCCESS') {
				//请求成功
				app.qrcodeImg = 'img/qrcode.png';
				app.queryOrder();
			}else if(code.status == 'FAIL') {
				app.fadeAlert(code.errMsg);
			}
		},
		setPreDt: function(str) {
			function S4() {return (((1+Math.random())*0x10000)|0).toString(16).substring(1);}
			function guid() {return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());}
			var dt = {
				outTradeNo: "youibot" + new Date().getTime() + guid(),//接入方订单号，由接入方生成，不能重复
				totalFee: 1,//订单金额，单位为分
				subject: 'coffee',//订单主题
				body: '美式咖啡',//订单内容,不超过64个字符
				channel: str,//支付渠道
				tradeType: 'NATIVE',//交易类型
				merchantId: 30205,//开放平台分配的商户id, 目前是 美团POI ID
				appId: 30000,//接入方标识，由美团开放平台分配
				sign: 123456,//验证签名
				random: "youibot" + parseInt(Math.random() * 1000000),//随机数
			}
			return dt;
		},
		//生成二维码成功，等待付款
		queryOrder: function() {
			//请求的参数
			var data = {
				outTradeNo: app.preDt.outTradeNo,
				merchantId: app.preDt.merchantId,
				appId: app.preDt.appId,
				sign: app.preDt.sign,
				random: app.preDt.random,
			}
			this.paytimer = setInterval(request, 1000);
			
			function request() {
				//返回的参数
				var code = {
					status: 'SUCCESS',//SUCCESS成功；FAIL失败
					orderStatus: 'ORDER_SUCCESS',
				}
				if(code.status == 'FAIL') {
					app.fadeAlert(code.errMsg);
					return false;
				}
				/*
				订单状态
				'ORDER_NEW' ： 交易新建
				'ORDER_FAILED'：交易失败
				'ORDER_REVERSALING'：交易冲正中
				'ORDER_REVERSAL'：交易冲正
				'ORDER_SUCCESS': 交易成功
				'ORDER_PART_REFUND'：交易半退
				'ORDER_ALL_REFUND'： 交易全退
				'ORDER_REFUNDING'：退款中
				'ORDER_CLOSE'：交易失败
				*/
				switch (code.orderStatus) {
					//交易成功，订单下发
					case 'ORDER_SUCCESS':
						app.addOrder({
							outTradeNo: app.preDt.outTradeNo,
							type: 0,
							coffeeId: 1,//咖啡种类ID
							flowId: 1,//拉花种类ID
							tableNumber: 1,//桌号ID
							userPhone: 13164761010,
							createTime: new Date().getTime().toString(),
							payStatus: code.orderStatus,
							payTime: new Date().getTime().toString(),
							totalFee: 0.0100,//支付金额
							channel: app.preDt.channel,//支付渠道
						})
						
						app.payStatus = true;
						app.popShow('payinfo');
						clearInterval(app.paytimer);
						app.paytimer = null;
						break
					//交易失败
					case 'ORDER_FAILED':
						app.payStatus = false;
						app.popShow('payinfo');
						clearInterval(app.paytimer);
						app.paytimer = null;
						break
					//交易失败
					case 'ORDER_CLOSE':
						app.payStatus = false;
						app.popShow('payinfo');
						clearInterval(app.paytimer);
						app.paytimer = null;
						break
				}
			}
		},
		//通知后台订单下发
		addOrder: function(data, cb) {
			axios.post('/api/v1/order', data)
				.then(function (res) {
					if(res.status == 201) {
						cb && cb();
					}else {
						app.fadeAlert('下单失败，重新下单中');
						app.addOrder(data, cb);
					}
				})
				.catch(function (error) {
					app.fadeAlert('下单失败，请联系工作人员');
				});
		},
		
		getIndex: function() {
			axios({
				method: 'get',
				baseURL: './',
				url: 'conf.json',
			}).then(function(res) {
				app.indexList = res.data.coffeeList;
				app.tabList = res.data.table;
				app.latteList = res.data.latte;
				app.admin = res.data.admin;
			})
		},
    },
    mounted: function () {
		this.$nextTick(function() {
			FastClick.attach(document.body);
			this.getIndex();
		})
    },
});
