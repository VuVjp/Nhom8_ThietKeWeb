import { articleService } from '../services/articleService';

/**
 * Scans HTML content for <img> tags with local sources (base64 or blob),
 * uploads them to the cloud, and returns the HTML with cloud URLs.
 */
export async function processContentImages(html: string): Promise<string> {
    if (!html) return '';

    // Create a temporary DOM to manipulate
    const doc = new DocumentFragment();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    doc.appendChild(tempDiv);

    const images = tempDiv.querySelectorAll('img');
    const uploadPromises: Promise<void>[] = [];

    images.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
            const promise = (async () => {
                try {
                    const response = await fetch(src);
                    const blob = await response.blob();
                    const file = new File([blob], 'image.png', { type: blob.type });
                    const cloudUrl = await articleService.uploadImage(file);
                    img.setAttribute('src', cloudUrl);
                } catch (error) {
                    console.error('Failed to upload content image:', error);
                }
            })();
            uploadPromises.push(promise);
        }
    });

    await Promise.all(uploadPromises);
    return tempDiv.innerHTML;
}
