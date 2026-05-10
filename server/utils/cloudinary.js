const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true
});

const uploadImage = async (file) => {
    try {
        console.log("Current Cloudinary Cloud Name:", cloudinary.config().cloud_name);
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
