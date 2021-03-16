/*
东东农场互助码
此文件为Node.js专用。其他用户请忽略
支持京东N个账号
 */
//云服务器腾讯云函数等NOde.js用户在此处填写京东东农场的好友码。
// 同一个京东账号的好友互助码用@符号隔开,不同京东账号之间用&符号或者换行隔开,下面给一个示例
// 如: 京东账号1的shareCode1@京东账号1的shareCode2&京东账号2的shareCode1@京东账号2的shareCode2
let FruitShareCodes = [
   //账号一的好友shareCode,不同好友的shareCode中间用@符号隔开
  '363302c018d241df923eeef1d9faecf9@99c857d2906c4ad8af0527efc367d4de@8393c56cadcd4639bb65095132f3bab7@ea47d7cb7a0c4751bc10927f3a49985a@e0d312aae7694c8393feb74c8a4955dc@d94c0955209a45fd9e6849a6d338a821@adbf7430fa0e48ff90302b12cf7b85a2@0c680e4936c7448d870e30690780aa9d231ecb1079174a00851e57f7b187ad9f',
  //账号二的好友shareCode,不同好友的shareCode中间用@符号隔开
  '363302c018d241df923eeef1d9faecf9@99c857d2906c4ad8af0527efc367d4de@8393c56cadcd4639bb65095132f3bab7@ea47d7cb7a0c4751bc10927f3a49985a@e0d312aae7694c8393feb74c8a4955dc@d94c0955209a45fd9e6849a6d338a821@adbf7430fa0e48ff90302b12cf7b85a2@0c680e4936c7448d870e30690780aa9d231ecb1079174a00851e57f7b187ad9f',
 ]
// 判断github action里面是否有水果互助码
if (process.env.FRUITSHARECODES) {
  if (process.env.FRUITSHARECODES.indexOf('&') > -1) {
    console.log(`您的东东农场互助码选择的是用&隔开\n`)
    FruitShareCodes = process.env.FRUITSHARECODES.split('&');
  } else if (process.env.FRUITSHARECODES.indexOf('\n') > -1) {
    console.log(`您的东东农场互助码选择的是用换行隔开\n`)
    FruitShareCodes = process.env.FRUITSHARECODES.split('\n');
  } else {
    FruitShareCodes = process.env.FRUITSHARECODES.split();
  }
} else if (process.env.JD_COOKIE) {
  console.log(`由于您secret里面未提供助力码，故此处运行将会给脚本内置的码进行助力，请知晓！`)
}
for (let i = 0; i < FruitShareCodes.length; i++) {
  const index = (i + 1 === 1) ? '' : (i + 1);
  exports['FruitShareCode' + index] = FruitShareCodes[i];
}
