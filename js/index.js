
var appData = {
	orderShow: false,//false首页 | true订单页
	randomNum: 1,//详情页banner随机数
	phoneVal: '',//筛选订单列表条件 admin管理员
	admin: '',//管理员账号
	adaptation: false,
	paymentPgTx1: false,//下单失败文本显示
	
	qrcodeSrc: '',
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
			this.phoneVal = this.orderShow ? this.phoneVal : '';
			this.pullIdx = -1;
			this.orderListIdx = -1;
			this.detailItem = null;
			this.paymentPgTx1 = false;
			//清除二维码 & 定时器
			if(this.qrcodeSrc) {
				this.qrcodeSrc = '';
				clearInterval(app.paytimer);
				app.paytimer = null;
				//取消美团订单
			}
		},
		
		//打开选择桌号页
		chioseTabShow: function() {
			this.page.chioseTab = true;
		},
		//关闭选择桌号页
		setTabNum: function(id) {
			this.tabNum = id;
			setTimeout(function() {
				app.page.chioseTab = false;
			}, 200)
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
			app.ajaxLoading = true;
			axios('/api/v1/orders')
				.then(function(res) {
					for(var i = 0, len = res.data.length; i < len; i++) {
						if(res.data[i].productionStatus == 'CREATE') {
							res.data[i].productionStatusTx = '等待中';
						}else if(res.data[i].productionStatus == 'COFFEEING') {
							res.data[i].productionStatusTx = '制作中';
						}else if(res.data[i].productionStatus == 'FLOWING') {
							res.data[i].productionStatusTx = '拉花中';
						}else if(res.data[i].productionStatus == 'DELIVERYING') {
							res.data[i].productionStatusTx = '配送中';
						}else if(res.data[i].productionStatus == 'COMPLETE') {
							res.data[i].productionStatusTx = '完成';
						}
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
					
					setTimeout(function() {
						app.ajaxLoading = false;
					}, 500);
					app.toIndex(true);
				})
				.catch(function(res) {
					app.ajaxLoading = false;
					app.fadeAlert('网络开小差了');
				})
		},
		//刷新列表
		refreshOrder: function() {
			this.toOrder();
		},
		
		//首页
		toIndex: function(bool) {
			this.orderShow = bool;
			this.init();
			this.close();
			window.scrollTo(0,0);
			this.pageShow();
		},
		showPhonePop: function() {
			if(this.orderShow) {
				this.toOrder();
			}else {
				this.popShow('phonePop');
			}
		},
		//再次制作弹窗
		idxLTxBtn: function(idx) {
			this.orderListIdx = idx;
			this.popShow('againMake');
		},
		//再次制作
		setAgain: function() {
			var order = this.orderList[this.orderListIdx];
			this.addcoffee({
				type: 1,
				coffeeId: order.coffeeId,
				flowId: order.flowId,
				tableNumber: order.tableNumber,
				userPhone: order.userPhone,
				status: "CREATE",
				orderId: order.id
			}, function() {
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
			this.page.paymentPg = true;
		},
		//选择支付方式生成支付二维码
		chiosePay: function(str) {
			this.qrcodeSrc = str;
			this.preDt = {
				type: 0,
				coffeeId: Number(app.detailItem.id),//咖啡种类ID
				flowId: app.latteList[app.pullIdx] ? app.latteList[app.pullIdx].id : '99',//拉花种类ID，不拉花99
				tableNumber: app.tabNum,//桌号ID
				userPhone: app.phoneVal,
				createTime: new Date().getTime().toString(),
				payStatus: 'ORDER_SUCCESS',
				payTime: new Date().getTime().toString(),
				totalFee: app.detailItem.mon.toFixed(4),//支付金额
				channel: app.qrcodeSrc,
			};
		},
		//付款成功
		paySucc: function() {
			app.ajaxLoading = true;
			//订单下发
			axios.post('/api/v1/orders', this.preDt)
				.then(function (res) {
					if(res.status === 201) {
						app.addcoffee({
							type: app.preDt.type,
							coffeeId: app.preDt.coffeeId,
							flowId: app.preDt.flowId,
							tableNumber: app.preDt.tableNumber,
							userPhone: app.preDt.userPhone,
							status: "CREATE",
							orderId: res.data.id
						}, function() {
							app.payStatus = true;
							app.popShow('payinfo');
						});
					}else {
						app.ajaxLoading = false;
						app.paymentPgTx1 = true;
					}
				})
				.catch(function () {
					app.ajaxLoading = false;
					app.paymentPgTx1 = true;
				});
		},
		//通知后台订单下发
		addcoffee: function(data, cb) {
			app.ajaxLoading = true;
			axios.post('/api/v1/coffeeProductions', data)
				.then(function (res) {
					app.ajaxLoading = false;
					res.status === 201 && cb && cb();
				})
				.catch(function () {
					app.ajaxLoading = false;
					app.paymentPgTx1 = true;
				});
		},
		
		setAdaptation: function() {
			app.adaptation = (window.innerHeight / window.innerWidth) < (580 / 640) ? true : false;
		},
		
		getIndex: function() {
			axios.defaults.baseURL = '//' + window.location.hostname + ':8080';
			axios({
				method: 'get',
				baseURL: './',
				url: 'conf.json',
			}).then(function(res) {
				app.indexList = res.data.coffeeList;
				app.tabList = res.data.table;
				app.latteList = res.data.latte;
				app.admin = res.data.admin;
				
			});
			this.setAdaptation();
			document.getElementById('phoneInput').onfocus = function(e) {
				setTimeout(function() {
					e.target.scrollIntoView(true);
				}, 200)
			}
		},
    },
    mounted: function () {
		this.$nextTick(function() {
			FastClick.attach(document.body);
			this.getIndex();
		});
		window.onresize = this.setAdaptation;
    }
});
