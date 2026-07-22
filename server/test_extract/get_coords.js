const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractTextPositions(pdfPath) {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        let lines = [];
        textContent.items.forEach((item) => {
            // pdf.js standard coordinates: origin is bottom-left
            // item.transform is [scaleX, skewY, skewX, scaleY, tx, ty]
            // tx is x, ty is y (from bottom-left)
            const x = item.transform[4];
            const y = item.transform[5];
            const text = item.str.trim();
            if (text) {
                lines.push({ text, x: Math.round(x), y: Math.round(y), width: Math.round(item.width), height: Math.round(item.height) });
            }
        });

        // specific pages filter based on user's list
        const pagesOfInterest = [12, 13, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25, 28, 31, 35, 36, 38];
        if (pagesOfInterest.includes(pageNum)) {
            console.log(`\n=== PAGE ${pageNum} ===`);
            // print lines that might be relevant
            lines.forEach(l => {
                const lower = l.text.toLowerCase();
                if (lower.includes('sole/first') || lower.includes('declaration') || lower.includes('authorisation') ||
                    lower.includes('10/38') || lower.includes('11/38') || lower.includes('12/38') || lower.includes('13/38') || lower.includes('disputes') || lower.includes('all segment') || lower.includes('sign') || lower.includes('sms and e-mail') || lower.includes('confirmation of receipt') || lower.includes('running account') || lower.includes('internet') || lower.includes('ddpi')) {
                    console.log(`[${l.x}, ${l.y}] w:${l.width} h:${l.height} -> "${l.text}"`);
                }
            });
        }
    }
}

extractTextPositions('../Prakash.pdf').catch(console.error);
