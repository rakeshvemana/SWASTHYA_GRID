// Simple script to generate valid PNG icons for PWA compliance
import fs from 'fs';
import path from 'path';

// Valid 1x1 cyan/blue PNG base64 to ensure immediate valid response for icon endpoints
const pwaPngBase64 = 
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAhSURBVHja7cEBDQAAAMKg909tDwcUAAAAAAAAAAAAAAB4NW+RAAFf/L5zAAAAAElFTkSuQmCC';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const buffer = Buffer.from(pwaPngBase64, 'base64');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), buffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
console.log('PWA icons created in public/');
