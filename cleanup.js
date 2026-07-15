const fs = require('fs');
const path = require('path');

function cleanup() {
    const dir = process.env.VISIT_PHOTO_DIR;
    const maxAge = 60 * 60 * 1000;

    try {
        const files = fs.readdirSync(dir);
        const now = Date.now();

        files.forEach(file => {
            if (!file.startsWith('temp_')) return;

            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old temp file: ${file}`);
            }
        });
    } catch (err) {
        console.error('Error cleaning up temp visit photos:', err);
    }
}

cleanup();

setInterval(cleanup, 30 * 60 * 1000);