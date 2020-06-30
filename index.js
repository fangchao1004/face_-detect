const fs = require('fs')
const Axios = require('axios');
const { createCanvas, Image } = require('canvas')
const SecretKey = '0nUTgs2yZIQoktsxr85KqxELDollBszU';
const APIKey = 'UWuUFE9qUkOv2sPSpYLcxuyw'
const GrantType = 'client_credentials'
const url1 = `http://aip.baidubce.com/oauth/2.0/token?grant_type=${GrantType}&client_id=${APIKey}&client_secret=${SecretKey}`
async function main() {
    let result = fs.readFileSync('./测试数据.txt');///测试数据 base64数据，
    let imgBase64_origin = result.toString();
    let imgBase64 = imgBase64_origin.replace(/\r|\n/g, '').replace('data:image/jgp;base64,', '').replace('data:image/png;base64,', '').replace('data:image/jpeg;base64,', '');
    //////////////////
    let result1 = await Axios.get(url1) ///获取baidu请求的token
    let access_token = result1.data.access_token;
    let url2 = `https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=${access_token}`

    let imgURL = `https://hefeixiaomu.oss-cn-hangzhou.aliyuncs.com/xiaomu/face_s.jpg` ///大人图片地址
    // let imgURL = `https://hefeixiaomu.oss-cn-hangzhou.aliyuncs.com/xiaomu/face_two.jpg` ///大人小孩图片地址

    //// 变换 targetImg 和  imageType
    let targetImg = imgURL; ///imageURL 或者 imgBase64
    let imageType = 'URL' /// 'URL'或者 'BASE64'

    ///////////////////////
    let head = imageType === 'BASE64' ? 'data:image/jpg;base64,' : '';
    let result2 = await Axios.post(url2, { "image": targetImg, "image_type": imageType })
    console.log('百度接口识别结果:', result2.data)
    // console.log('其中face_list:', result2.data.result.face_list)
    if (result2.data.error_code === 0) {
        let data = result2.data.result.face_list[0].location
        let result = await testHandler(head + targetImg, data);
        // console.log('result:', result)
        fs.writeFileSync('人脸抠图后的结果base64.txt', result)
    }
}
main();
/**
 * image 图片资料地址 或者 base64
 * data 裁剪要求数据
 */
function testHandler(imageData, data) {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
            const canvas = createCanvas(image.width, image.height) ///创建一个和原始图片大小一致的画布 canvas
            const ctx = canvas.getContext('2d')///创建2d 上下文内容
            ctx.drawImage(image, 0, 0, image.width, image.height);/// 给上下文ctx，画上图片
            const cutImage = ctx.getImageData(data.left, data.top, data.width, data.height);///在上下文的基础上截取固定区域的图片数据
            const newImage = createNewCanvas(cutImage, data.width, data.height);///根据这个新的截取的区域数据进行绘画
            resolve(newImage);
        }
        image.src = imageData;
    })
}

function createNewCanvas(content, width, height) {
    const nCanvas = createCanvas(width, height)
    const nCtx = nCanvas.getContext('2d')
    nCanvas.width = width;
    nCanvas.height = height;
    nCtx.putImageData(content, 0, 0);// 将画布上指定矩形的像素数据，通过 putImageData() 方法将图像数据放回画布
    return nCanvas.toDataURL('image/png');
}