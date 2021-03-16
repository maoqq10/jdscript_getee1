/*
京东种豆得豆互助码
此文件为Node.js专用。其他用户请忽略
支持京东N个账号
 */
//云服务器腾讯云函数等NOde.js用户在此处填写东东萌宠的好友码。
// 同一个京东账号的好友互助码用@符号隔开,不同京东账号之间用&符号或者换行隔开,下面给一个示例
// 如: 京东账号1的shareCode1@京东账号1的shareCode2&京东账号2的shareCode1@京东账号2的shareCode2
let PlantBeanShareCodes = [
  //账号一的好友shareCode,不同好友的shareCode中间用@符号隔开
  'my3ngearcibcq4sqcf3okwgs2u@tnmcphpjys5idyjdsb52tyeiqpgqc6qt72zzzei@suqg5cye47cqnoo5oyoca7s3ziuomvugimgg5fq@olmijoxgmjutz7uok2zhc7m2aw2fpl2rwpjx4pi@e7lhibzb3zek3dxfp6saapensubcz2tpgs7dbii@rj7s6mzlk7uog7liqkyg54gzdwjtvk4me6iwhli@hexohqmn2e3mdbgqbcliajb6xj57v4wxcj4nxra@w6z2l44f6qbsqtnx262ysvotme4npkonnsy7xi2yybasmlpgbh74wbafh5lx5xw4qo2cnxonxnt7raiupfkv3qxw3ie3h7wlwy7o5jii5kuvbyio45zwf7vr3nwowoqndbdj7uxubhwrqliexnurznysttplafoybql75csom',
  //账号二的好友shareCode,不同好友的shareCode中间用@符号隔开
  'my3ngearcibcq4sqcf3okwgs2u@tnmcphpjys5idyjdsb52tyeiqpgqc6qt72zzzei@suqg5cye47cqnoo5oyoca7s3ziuomvugimgg5fq@olmijoxgmjutz7uok2zhc7m2aw2fpl2rwpjx4pi@e7lhibzb3zek3dxfp6saapensubcz2tpgs7dbii@rj7s6mzlk7uog7liqkyg54gzdwjtvk4me6iwhli@hexohqmn2e3mdbgqbcliajb6xj57v4wxcj4nxra@w6z2l44f6qbsqtnx262ysvotme4npkonnsy7xi2yybasmlpgbh74wbafh5lx5xw4qo2cnxonxnt7raiupfkv3qxw3ie3h7wlwy7o5jii5kuvbyio45zwf7vr3nwowoqndbdj7uxubhwrqliexnurznysttplafoybql75csom',
]
// 判断github action里面是否有种豆得豆互助码
if (process.env.PLANT_BEAN_SHARECODES) {
  if (process.env.PLANT_BEAN_SHARECODES.indexOf('&') > -1) {
    console.log(`您的种豆互助码选择的是用&隔开\n`)
    PlantBeanShareCodes = process.env.PLANT_BEAN_SHARECODES.split('&');
  } else if (process.env.PLANT_BEAN_SHARECODES.indexOf('\n') > -1) {
    console.log(`您的种豆互助码选择的是用换行隔开\n`)
    PlantBeanShareCodes = process.env.PLANT_BEAN_SHARECODES.split('\n');
  } else {
    PlantBeanShareCodes = process.env.PLANT_BEAN_SHARECODES.split();
  }
} else if (process.env.JD_COOKIE) {
  console.log(`由于您secret里面未提供助力码，故此处运行将会给脚本内置的码进行助力，请知晓！`)
}
for (let i = 0; i < PlantBeanShareCodes.length; i++) {
  const index = (i + 1 === 1) ? '' : (i + 1);
  exports['PlantBeanShareCodes' + index] = PlantBeanShareCodes[i];
}
