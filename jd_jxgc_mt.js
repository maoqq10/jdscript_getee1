const { rejects } = require("assert");

/* 
#自定义商品变量
export shopid="1598"   ##你要商品ID 冰箱
export shopid1="1607"  ##你要商品ID 茅台
定时 58,59,0 18,19 * * *  可以自行设置
*/
const $ = new Env("柠檬惊喜工厂抢茅台");
const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message;
let shopid = "1598"; // ##华凌三门冰箱
let shopid1 = "1607"; //##贵州茅台酒

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false")
    console.log = () => {};
} else {
  cookiesArr = [
    $.getdata("CookieJD"),
    $.getdata("CookieJD2"),
    ...jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
const JD_API_HOST = "https://api.m.jd.com/client.action";

!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      $.name,
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/bean/signIndex.action",
      { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
    );
    return;
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      message = "";
      //   await TotalBean();
      console.log(
        `\n******开始【京东账号${$.index}】${
          $.nickName || $.UserName
        }*********\n`
      );
      if (!$.isLogin) {
        $.msg(
          $.name,
          `【提示】cookie已失效`,
          `京东账号${$.index} ${
            $.nickName || $.UserName
          }\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`,
          { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
        );

        if ($.isNode()) {
          await notify.sendNotify(
            `${$.name}cookie已失效 - ${$.UserName}`,
            `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`
          );
        }
        continue;
      }
      var delayMs = 100
      if ($.isNode()) {
        if(process.argv && process.argv.length > 2){
        //   console.log('process.argv', process.argv[2])
         if(process.argv.length >3){
            delayMs = parseInt(process.argv[3])
         }
          if($.UserName != process.argv[2])
            continue;
        }
      }
      
    //   console.log(`使用账号${$.UserName}开始抢`)
      var commodityList = ''

      var lastFixTime = 0;
      var lastTipTime = 0;
      var lastRefreshTime = 0
      while (true) {
        if (Date.now() - lastRefreshTime > 30 * 60 * 1000) {
            commodityList = await refreshCommodityList()
            lastRefreshTime = Date.now();
        }
        var delta = 0;
        if (Date.now() - lastFixTime > 5 * 60 * 1000) {
          var time1 = Date.now();
          var time = await getJDServerTime();
          var time2 = Date.now();
          console.log(
            `servertime: ${time},time1: ${time1},time2: ${time2},delta: ${
              time2 - time1
            }`
          );

          var now = time + parseInt((time2 - time1) * 0.4);
          delta = time2 - now;
          console.log(`delta: ${time2 - now}`);
          lastFixTime = Date.now();
        }
        if (commodityList && commodityList.length > 0) {
          var commodityItem = false;
          var commodityItemIndex = -1;
          for (let index = 0; index < commodityList.length; index++) {
            const element = commodityList[index];
            if (element.limitStartTime > Date.now() / 1000 - 10) {
              commodityItem = element;
              commodityItemIndex = index;
              break;
            }
          }
          if (commodityItem) {
            var now = parseInt(Date.now() / 1000 - 10);
            if (commodityItem.limitStartTime - now < 10 && lastTipTime != now) {
              lastTipTime = now;
              console.log('\033[40;33m',
                `准备抢：${commodityItem.commodityId},${
                  commodityItem.name
                }, 倒计时：${parseInt(commodityItem.limitStartTime - now)}`
                ,'\033[0m'
              );
            }
            if (
                commodityItem.limitStartTime * 1000 - (Date.now() - delta) <
              delayMs
            ) {
                try {
                    await addProduct(commodityItem.commodityId);
                    console.log('抢到产品，退出程序')
                } catch (err) {
                    console.log('没抢到', err)
                    /**
                     * 1411 别心急哦，还没到生产时间呢~
                     * 1503 您来晚了，商品被抢完了~
                     * 10004 操作太频繁，请稍后再试~
                     */
                    if(err ==  1503){
                        commodityList.splice(commodityItemIndex, 1);
                        commodityItem = null
                        continue
                    }
                }
              
            }
            if (
                (Date.now() - delta) - commodityItem.limitStartTime * 1000 >
                5000 &&
              commodityItemIndex > 0
            ) {
              commodityList.splice(commodityItemIndex, 1);
            }
            if (commodityList.length == 0) {
              console.log("暂时没有可抢产品，退出程序");
            }
          }
        }
        await $.wait(1);
      }
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

  async function refreshCommodityList(){
    console.log(
      '使用账号',
            '\033[40;33m',
            $.UserName,
            '\033[0m 开始抢'
          );
    var commodityList = await getCommodityList();
    if (commodityList) {
      var now = Date.now() / 1000;
      var list = [];
      commodityList.forEach((item, index) => {
        if (item.limitStartTime > now) {
            
         
          list.push({
            commodityId: item.commodityId,
            name: item.name,
            limitStartTime: item.limitStartTime,
            formatedTime: parseTime(item.limitStartTime)
          });
        }
      });
      
      function compare(property) {
        return function (a, b) {
          var value1 = a[property];
          var value2 = b[property];
          return value1 - value2;
        };
      }
      commodityList = list.sort(compare("limitStartTime"));
      commodityList.forEach((item, index) => {
        if(index == 0){
            console.log('\033[40;32m',
            `下一个开始抢的产品:${item.commodityId},${
              item.name
            }, 开始时间：${parseTime(item.limitStartTime)}`
            ,'\033[0m'
          );
        } else {
            console.log(
            `未开始的产品:${item.commodityId},${
              item.name
            }, 开始时间：${parseTime(item.limitStartTime)}\n`
          );
        }
      })
    //   console.log("list", commodityList);
    }
    return commodityList
  }

function addProduct(commodityDimId) {
  return new Promise(async (resolve, reject) => {
    var factoryId = "22576660";
    var deviceId = "5241450082439161";
    var time = Date.now();
    console.log('now:', time)
    let options = {
      url: `https://m.jingxi.com//dreamfactory/userinfo/AddProduction?zone=dream_factory&factoryId=${factoryId}&deviceId=${deviceId}&commodityDimId=${commodityDimId}&replaceProductionId=&_time=${time}&_stk=_time%2CcommodityDimId%2CdeviceId%2CfactoryId%2CreplaceProductionId%2Czone&_ste=1&h5st=20210609170825400;5241450082439161;10001;tk01w996b1b3ba8nejFaa2N6eDFniEFlrApCu0vxS7A58l/x4k637Wi5wdIFRUQvTUpyq9IBy5OA0p5gAPHx0RZFoIF0;ed9c9f27141a3172bb4f497007fcd822fd9d625b5bd61837e1793cc6ea4d03c5&_=1623146403580&sceneval=2&g_login_type=1&callback=&g_ty=ls`,

      // body: `functionId=HomeZeroBuy&body={"pageNum":1,"channel":"speed_app"}&appid=megatron&client=megatron&clientVersion=1.0.0`,
      headers: {
        "X-Requested-With": "com.jd.pingou",

        Referer:
          "https://st.jingxi.com/pingou/dream_factory/index.html?sceneval=2&ptag=7155.9.46",
        Host: "m.jingxi.com",
        "User-Agent":
          "jdpingou;android;4.9.0;10;7049442d7e415232;network/UNKNOWN;model/PCAM00;appBuild/16879;partner/oppo01;;session/10;aid/7049442d7e415232;oaid/;pap/JA2019_3111789;brand/OPPO;eu/7303439343432346;fv/7356431353233323;Mozilla/5.0 (Linux; Android 10; PCAM00 Build/QKQ1.190918.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.92 Mobile Safari/537.36",
        Cookie: cookie,
      },
    };

    $.get(options, async (err, resp, data) => {
      try {
        console.log("addProduct", commodityDimId, data);
        if(safeGet(data)){
            data = JSON.parse(data);
            if(data.ret == 0){
                resolve(data.ret)
                return
            }
            reject(-1)
            return reject(data.ret)
        }
        reject(-1)
        //}
      } catch (e) {
        $.logErr(e, resp);
        reject(-1)
      } finally {
        console.log('finally now:', Date.now())
      }
    });
  });
}

function getJDServerTime() {
  return new Promise((resolve) => {
    // console.log(Date.now())
    $.get(
      {
        url: `https://jdjoy.jd.com/system/current/timestamp`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88",
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} 获取京东服务器时间失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            // console.log('京东时间', data)
            $.jdTime = data["currentTime"];
            // console.log(data['serverTime']);
            // console.log(data['serverTime'] - Date.now())
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve($.jdTime);
        }
      }
    );
  });
}

function getCommodityList() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://wq.jd.com/dreamfactory/diminfo/GetCommodityList?zone=dream_factory&flag=2&_time=1623229637534&_stk=_time%2Cflag%2Czone&_ste=1&h5st=20210609170717535%3B5241450082439161%3B10001%3Btk01w996b1b3ba8nejFaa2N6eDFniEFlrApCu0vxS7A58l%2Fx4k637Wi5wdIFRUQvTUpyq9IBy5OA0p5gAPHx0RZFoIF0%3B76167d63739ed00a45e91fed6fe615da5daa47ad0891b892ae38132762808b6c&_=1623229637536&sceneval=2&g_login_type=1&callback=&g_ty=ls`,

      // body: `functionId=HomeZeroBuy&body={"pageNum":1,"channel":"speed_app"}&appid=megatron&client=megatron&clientVersion=1.0.0`,
      headers: {
        "X-Requested-With": "com.jd.pingou",

        Referer:
          "https://wqsd.jd.com/pingou/dream_factory/?ptag=138631.26.54&trace=",
        Host: "wq.jd.com",
        "User-Agent":
          "jdpingou;android;4.9.0;10;0e92e7b74efa958c;network/wifi;model/Redmi K20 Pro Premium Edition;appBuild/16879;partner/xiaomi;;session/87;aid/0e92e7b74efa958c;oaid/714ff586b4c02bcb;pap/JA2019_3111789;brand/Xiaomi;eu/0356932356732673;fv/4356661693538336;Mozilla/5.0 (Linux; Android 10; Redmi K20 Pro Premium Edition Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.101 Mobile",
        Cookie: cookie,
      },
    };
    var result = "";
    $.get(options, async (err, resp, data) => {
      try {
        // $.log("产品列表：" + data);
        if (safeGet(data)) {
          var dat = JSON.parse(data);
          if (dat && dat.data && dat.data.commodityList) {
            result = dat.data.commodityList;
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(result);
      }
    });
  });
}

function list1() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://m.jingxi.com//dreamfactory/userinfo/AddProduction?zone=dream_factory&factoryId=1099554520843&deviceId=1099554520844&commodityDimId=${shopid1}&replaceProductionId=&_time=1623146403538&_stk=_time%2CcommodityDimId%2CdeviceId%2CfactoryId%2CreplaceProductionId%2Czone&_ste=1&h5st=20210608180003579%3B6987023816710162%3B10001%3Btk01wb98b1baea8nNmdTeHBoaEIyyVt8MwWYitL210lOXs66ovEkPI%2BwUC5jAypABgM%2F76EgUhE0cmmxqg6RQDK06%2FWV%3Be4127f4722141f14e44078fde821d9d5e68b71ca248715dfc44442443612dfcb&_=1623146403580&sceneval=2&g_login_type=1&callback=jsonpCBKQQQQ&g_ty=ls`,

      // body: `functionId=HomeZeroBuy&body={"pageNum":1,"channel":"speed_app"}&appid=megatron&client=megatron&clientVersion=1.0.0`,
      headers: {
        "X-Requested-With": "com.jd.pingou",

        Referer:
          "https://st.jingxi.com/pingou/dream_factory/index.html?sceneval=2&ptag=7155.9.46",
        Host: "m.jingxi.com",
        "User-Agent":
          "jdpingou;android;4.9.0;10;7049442d7e415232;network/UNKNOWN;model/PCAM00;appBuild/16879;partner/oppo01;;session/10;aid/7049442d7e415232;oaid/;pap/JA2019_3111789;brand/OPPO;eu/7303439343432346;fv/7356431353233323;Mozilla/5.0 (Linux; Android 10; PCAM00 Build/QKQ1.190918.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.92 Mobile Safari/537.36",
        Cookie: cookie,
      },
    };

    $.get(options, async (err, resp, data) => {
      try {
        $.log("茅台：" + data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function taskPostUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}`,
    body: `functionId=${functionId}&body=${escape(
      JSON.stringify(body)
    )}&client=wh5&clientVersion=1.0.0&appid=content_ecology&uuid=6898c30638c55142969304c8e2167997fa59eb54&t=1622588448365`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Accept-Language": "zh-cn",
      "Accept-Encoding": "gzip, deflate, br",
    },
  };
}

async function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: cookie,
        Referer: "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data["retcode"] === 13) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data["retcode"] === 0) {
              $.nickName =
                (data["base"] && data["base"].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName;
            }
          } else {
            console.log(`京东服务器返回空数据`);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
async function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg(
        $.name,
        "",
        "请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie"
      );
      return [];
    }
  }
}

function parseTime(time, cFormat) {
  if (arguments.length === 0) {
    return null;
  }
  const format = cFormat || "{y}-{m}-{d} {h}:{i}:{s}";
  let date;
  if (typeof time === "object") {
    date = time;
  } else {
    if (("" + time).length === 10) time = parseInt(time) * 1000;
    date = new Date(time);
  }
  var offset = new Date("2018-08-08T00:00:00").getHours();
  if (offset !== 0) {
    date.setTime(date.getTime() - offset * 60 * 60 * 1000);
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
  };
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key];
    if (key === "a")
      return ["一", "二", "三", "四", "五", "六", "日"][value - 1];
    if (result.length > 0 && value < 10) {
      value = "0" + value;
    }
    return value || 0;
  });
  return time_str;
}
// prettier-ignore

function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
