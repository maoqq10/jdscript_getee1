/*
电脑数码
 */
const $ = new Env("电脑数码");
let joyRewardName = 500; //是否兑换京豆，默认开启兑换功能，其中20为兑换20京豆,500为兑换500京豆，0为不兑换京豆.数量有限先到先得
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
const notify = $.isNode() ? require("./sendNotify") : "";
const shareCodeApi = $.isNode() ? require("./share_code_api") : "";
let jdNotify = false; //是否开启静默运行，默认false关闭(即:奖品兑换成功后会发出通知提示)
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "";
var shareCodeType = "dnsm";
let inviteId = 67338;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false")
    console.log = () => {};
} else {
  let cookiesData = $.getdata("CookiesJD") || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata("CookieJD2"), $.getdata("CookieJD")]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(
    (item) => item !== "" && item !== null && item !== undefined
  );
}
const JD_API_HOST = "https://api.m.jd.com";
!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      "【京东账号一】电脑数码失败",
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/bean/signIndex.action",
      { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
    );
  }
  await shareCodesFormat();
  if ($.isNode()) {
    if (process.argv && process.argv.length > 2) {
      inviteId = process.argv[2];
      console.log("inviteId", inviteId);
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      //await TotalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
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
      //   console.log(`本地时间与京东服务器时间差(毫秒)：${await get_diff_time()}`);
      await help(67338);
      // $.msg($.name, '兑换脚本暂不能使用', `请停止使用，等待后期更新\n如果新版本兑换您有兑换机会，请抓包兑换\n再把抓包数据发送telegram用户@lxk0301`);
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function help(inviteId) {
  try {
    await isvObfuscator();
    if ($.isvObfuscatorToken) {
      await auth($.isvObfuscatorToken);
      if ($.authToken) {
        try {
          await invite(inviteId, $.authToken);
          if ($.shopId) {
            await openCard(inviteId, $.authToken, $.shopId);
          }
        } catch (error) {}
      }
    } else {
      $.log(
        "",
        `❌ ${$.name}, isvObfuscator失败! 原因: ${$.isvObfuscatorToken.message}!`,
        ""
      );
      return;
    }
  } catch (error) {
    
  }

}

function isvObfuscator() {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/client.action?functionId=isvObfuscator&clientVersion=10.0.2&build=88569&client=android&d_brand=Xiaomi&d_model=RedmiK20ProPremiumEdi&osVersion=10&screen=2296*1080&partner=xiaomi001&oaid=714ff586b4c02bcb&openudid=760da75670a64eb787f49309093673bb&eid=eidAaa7941206cl555f5a2d68196d5a4fb5d74b020218283ad2bf8f1PeY528/TtFzA1DjxPYAIXbayoJHs25NljNEG9fAjcQg4KI0FIfCwl81WSIZj&sdkVersion=29&lang=zh_CN&uuid=0e92e7b74efa958c&aid=0e92e7b74efa958c&area=20_1761_25188_59206&networkType=wifi&wifiBssid=cbc3a178b821437bba88c749b4a28bce&uts=0f31TVRjBSsqndu4%2FjgUPz6uymy50MQJqhUIRiJ7PRktK7Mz0%2B3gUknr1%2BdStO2O9%2BuS1gXc3NQbqYMhUbu%2F98PKM1O6ix4V6L1JwtKRA3SW9af1nfXL9HZYxjacqh1Vg8ikaLPu3ByPmC2yWim7UVs7ugWBtUg1Z7H7BSLj%2BkM3zb8ytGLPwNasW%2BbgqfZlFwBGizPO3CFJgqBehhyZIA%3D%3D&uemps=0-0&st=1623470473776&sign=10faba98adb7874260acc73ce4ca6231&sv=122`,
      body: "body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fxinruism618-isv.isvjcloud.com%22%7D&",
      headers: {
        Host: "api.m.jd.com",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: cookie,
        Connection: "keep-alive",
        Accept: "*/*",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.isvObfuscatorToken = null;
          //{"token":"AAFgw3GYADDWZHBrIt0KfAxpTReU_c3kImK-xemOuQsHLTn-2JP7D8uMEVMu-lNylUGuGSZbv_k","source":"01"}

          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.token) {
              console.log("获取token成功");
              $.isvObfuscatorToken = data.token;
            } else {
              console.log(`授权token失败:`, data);
            }
          } else {
            console.log(`授权token失败:${data}`);
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
function auth(token) {
  return new Promise((resolve) => {
    const option = {
      url: `https://xinruism618-isv.isvjcloud.com/api/auth`,
      body: `${JSON.stringify({ token: token, source: "01" })}`,
      headers: {
        Host: "xinruism618-isv.isvjcloud.com",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Content-Type": "application/json",
        Origin: "https://xinruism618-isv.isvjcloud.com",
        Connection: "keep-alive",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
        Referer: "https://xinruism618-isv.isvjcloud.com/logined_jd/",
        "Content-Length": "10",
        "X-Requested-With": "com.jingdong.app.mall",
        Cookie: cookie,
      },
    };
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          // {"access_token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9qZC1kaWdpdGFsLTYxOC5oNS5zaW5yZXdlYi5jb21cL2FwaVwvYXV0aCIsImlhdCI6MTYyMzQyMTMzNiwiZXhwIjoxNjIzNDY0NTM2LCJuYmYiOjE2MjM0MjEzMzYsImp0aSI6Ik1NNXdPbEN1Y3QxdWdhV1AiLCJzdWIiOjE4MDAyMywicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.GClww9qragTy384qZH0Y_6X7OQGmHznnywq8jszy18I","token_type":"bearer","expires_in":43200}

          $.authToken = {};
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.access_token) {
              console.log("获取access_token成功");
              $.authToken = data.access_token;
            } else {
              console.log(`授权access_token失败:`, data);
            }
          } else {
            console.log(`授权access_token失败:${data}`);
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

function invite(inviteId, token) {
  return new Promise((resolve, reject) => {
    const option = {
      url: `https://xinruism618-isv.isvjcloud.com/api/invite?inviter_id=${inviteId}&lng=110.017446&lat=22.683395&date=2021-${new Date().getDate()}-${new Date().getDate()}`,
      headers: {
        Host: "xinruism618-isv.isvjcloud.com",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Content-Type": "application/json",
        Origin: "https://xinruism618-isv.isvjcloud.com",
        Connection: "keep-alive",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
        Referer: `https://xinruism618-isv.isvjcloud.com/?inviterId=${inviteId}&date=2021-${new Date().getDate()}-${new Date().getDate()}&channel=share&v=100&lng=110.022096&lat=22.68058&sid=9515154257373914be89d599a1373daw&un_area=20_1761_25188_51466`,
        "Content-Length": "10",
        "X-Requested-With": "com.jingdong.app.mall",
        Cookie: cookie,
        Authorization: `Bearer ${token}`,
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          if (err.status_code == 422) {
            console.log(`您已经接受过邀请了`);
          } else {
            console.log(`invite 错误：可能已经接受过邀请了，退出邀请`, data);
          }
          reject();
        } else {
          /**
               {
                    "open_card_shop": {
                        "id": 696,
                        "name": "京东电脑-化州北岸罗江花园店",
                        "join_store": "50590611",
                        "depart_no": "100196",
                        "lat": "21.658804",
                        "lng": "110.632568",
                        "address": "广东省茂名市化州市河西街道北岸罗江花园梁忠屋首层102室",
                        "created_at": "2021-05-28 18:32:56",
                        "updated_at": "2021-05-28 18:32:56"
                    }
                }
               */
          console.log(`invite结果:${data}`);

          // $.authToken = {};
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.open_card_shop && data.open_card_shop.id) {
            }
            $.shopId = data.open_card_shop.id;
          }
          resolve();
        }
      } catch (e) {
        reject();
      } finally {
        //   resolve();
      }
    });
  });
}

function openCard(inviteId, token, shopid) {
  return new Promise((resolve, reject) => {
    const option = {
      url: `https://xinruism618-isv.isvjcloud.com/api/open_card?inviter_id=${inviteId}&shop_id=${shopid}`,
      headers: {
        Host: "xinruism618-isv.isvjcloud.com",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Content-Type": "application/json",
        Origin: "https://xinruism618-isv.isvjcloud.com",
        Connection: "keep-alive",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
        Referer: `https://xinruism618-isv.isvjcloud.com/?inviterId=${inviteId}&date=2021-${new Date().getDate()}-${new Date().getDate()}&channel=share&v=100&lng=110.022096&lat=22.68058&sid=9515154257373914be89d599a1373daw&un_area=20_1761_25188_51466`,
        "Content-Length": "10",
        "X-Requested-With": "com.jingdong.app.mall",
        Cookie: cookie,
        Authorization: `Bearer ${token}`,
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          if (err.status_code == 422) {
            console.log(`您已经接受过邀请了`);
          } else {
            console.log(`openCard 错误：${JSON.stringify(err)}`, data);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          }
          reject();
        } else {
          // 200
          console.log(`openCard结果:${data}`);
          resolve();
          // $.authToken = {};
          // if (safeGet(data)) {
          //   data = JSON.parse(data);
          //   $.authToken = data.access_token
          // }
        }
      } catch (e) {
        reject();
      } finally {
        //   resolve();
      }
    });
  });
}

function TotalBean() {
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
          : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
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
            $.nickName = data["base"].nickname;
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
function getJDServerTime() {
  return new Promise((resolve) => {
    // console.log(Date.now())
    $.get(
      {
        url: `${JD_API_HOST}/system/current/timestamp`,
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
async function get_diff_time() {
  // console.log(`本机时间戳 ${Date.now()}`)
  // console.log(`京东服务器时间戳 ${await getJDServerTime()}`)
  return Date.now() - (await getJDServerTime());
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
function safeGet(data) {
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
function shareCodesFormat() {
  return new Promise(async (resolve) => {
    const readShareCodeRes = await shareCodeApi.readShareCode(shareCodeType);

    if (
      readShareCodeRes &&
      readShareCodeRes.code === 1 &&
      readShareCodeRes.data &&
      readShareCodeRes.data.length > 0
    ) {
      inviteId = readShareCodeRes.data[0];
      console.log("inviteId", inviteId);
    }
    
    resolve();
  });
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,o)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=e&&e.timeout?e.timeout:o;const[r,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":r,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),o=JSON.stringify(this.data);s?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(e,o):this.fs.writeFileSync(t,o)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return s;return o}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),o=s?this.getval(s):"";if(o)try{const t=JSON.parse(o);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(e),r=this.getval(i),h=i?"null"===r?null:r||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,o,t),s=this.setval(JSON.stringify(e),i)}catch(e){const r={};this.lodash_set(r,o,t),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)}):this.isQuanX()?$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t)):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t)))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t))}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",o){const r=t=>{if(!t||!this.isLoon()&&this.isSurge())return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,r(o)):this.isQuanX()&&$notify(e,s,i,r(o)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
