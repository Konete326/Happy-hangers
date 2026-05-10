const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: "happy-hanger",
        });
        return result;
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        throw err;
    }
};

module.exports = { cloudinary, uploadImage };
