import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = 'C:/Users/Ritesh/.gemini/antigravity/brain/39d83e12-ca3e-458a-8808-bd97c0e119f0/app_icon_1776274332102.png';

await sharp(src).resize(192, 192).png().toFile(path.join(__dirname, 'public/icon-192.png'));
console.log('✅ icon-192.png created');

await sharp(src).resize(512, 512).png().toFile(path.join(__dirname, 'public/icon-512.png'));
console.log('✅ icon-512.png created');
