/* ==========================================
   IMAGE COMPRESSION & DOWNLOAD UTILITIES
   ========================================== */

/**
 * Compresses an image file by resizing it and converting to JPEG.
 * Reduces file size from >1MB down to ~150KB - 250KB.
 */
async function compressImage(file, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Create a canvas and draw the resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to a compressed JPEG Blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Image compression failed'));
                    }
                }, 'image/jpeg', quality); 
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

/**
 * Triggers the download of the compressed image to the user's phone (Downloads folder).
 */
function downloadCompressedImage(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up memory
}

/**
 * MASTER SAVE FUNCTION: Use this instead of your old save logic.
 * Call this function when the user clicks "Confirm" or "Save Transaction".
 */
async function handleSaveWithCompression(imageFile, transactionRefNumber, transactionData) {
    try {
        console.log("Starting image compression...");
        
        // 1. Compress the image (Max width 1024px, 70% quality)
        const compressedBlob = await compressImage(imageFile, 1024, 0.7); 
        
        console.log(`Original size: ${(imageFile.size / 1024).toFixed(2)} KB`);
        console.log(`Compressed size: ${(compressedBlob.size / 1024).toFixed(2)} KB`);

        // 2. Save the compressed Blob to your IndexedDB/LocalStorage 
        // IMPORTANT: Pass 'compressedBlob' to your database save function, NOT the original 'imageFile'
        // Example: await saveToDatabase(transactionData, compressedBlob); 
        // (You will need to update your existing save function to accept the blob)

        // 3. Trigger the download to the user's phone Downloads folder
        const fileName = `GCash_Receipt_${transactionRefNumber}.jpg`;
        downloadCompressedImage(compressedBlob, fileName);

        console.log("Transaction saved and image downloaded successfully!");
        return true;

    } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process receipt image. Please try again.");
        return false;
    }
}