const express = require("express");     
require("dotenv").config();
const AWS = require("aws-sdk");


//config
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("./views"));
app.set("view engine", "ejs");
app.set("views", "./views");


const multer = require("multer")

const upload = multer();

// config AWS
const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
AWS.config.update(config);
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName= "product";


app.get('/', (request, response) => {
   const params = {
       TableName: tableName
   };
   docClient.scan(params, (err, data) => {
       if (err) {
           response.render("internal_error", {error: err});
       } else {
            console.log(data.Items);
           return response.render('index', {products: data.Items});
       }
   });
});


// Insert: Thêm sản phẩm mới
app.post('/insert',upload.fields([]), async (req, res) => {
    let { ma_sp, ten_sp, so_luong } = req.body; 

    if (!ma_sp) {
        return res.status(400).send('Thiếu mã sản phẩm (ma_sp)');
    }

    ma_sp = Number(ma_sp); 

    const params = {
        TableName: tableName,
        Item: {
            ma_sp: ma_sp,
            ten_sp: ten_sp,
            so_luong: so_luong
        }
    };
    docClient.put(params, (err, data) => {
        if (err) {
            res.render("internal_error", {error: err});
        } else {
            res.redirect('/');
        }
    });
});

// xóa sản phẩm
app.post('/delete',upload.fields([]), (req, res) => {
    const listProduct = Object.keys(req.body);
    console.log("Danh sách sản phẩm cần xóa:", listProduct);
    console.log("Danh sách sản phẩm cần xóa:", listProduct.length);
    if (listProduct.length === 0) {
       return res.redirect('/');
    }
    function deleteProduct(index) {
        if (index < 0) {
            return res.redirect('/'); // Khi hoàn tất, chuyển hướng về trang chính
        }
        const params = {
            TableName: tableName,
            Key: {
                ma_sp: Number(listProduct[index])
            }
        };
        console.log("Xóa sản phẩm với tham số:", params);
        docClient.delete(params, (err, data) => {
            if (err) {
                console.error("Lỗi khi xóa sản phẩm:", err);
                return res.redirect('/');
            }
            deleteProduct(index - 1);
        });
    }
    deleteProduct(listProduct.length-1);

});

app.listen(3000, () => {
    console.log('Server is running on port 3000!');
});