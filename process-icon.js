const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'client', 'public', 'logo.png');
const buildDir = path.join(__dirname, 'build');
const outputPath = path.join(buildDir, 'icon.png');

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

async function processIcon() {
    try {
        console.log('Processing icon...');

        const size = 512;
        const radius = 100; // soft rounded corners

        const mask = Buffer.from(
            `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white" /></svg>`
        );

        await sharp(inputPath)
            .resize(size, size, { fit: 'cover' })
            .composite([{
                input: mask,
                blend: 'dest-in'
            }])
            .png()
            .toFile(outputPath);

        console.log('Icon successfully processed and saved to build/icon.png!');
    } catch (err) {
        console.error('Error processing icon:', err);
    }
}

processIcon();
