const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function createQRWithLogo(url, logoPath, outputPath) {
    try {
        // Generar QR en formato canvas temporal
        const qrCanvas = createCanvas(800, 800);
        await QRCode.toCanvas(qrCanvas, url, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 800,
            color: {
                dark: '#000000',  // Puntos
                light: '#ffffff' // Fondo
            }
        });

        // Crear canvas final donde juntaremos ambos
        const finalCanvas = createCanvas(800, 800);
        const ctx = finalCanvas.getContext('2d');

        // Dibujar el QR
        ctx.drawImage(qrCanvas, 0, 0, 800, 800);

        // Cargar el Logo
        const logo = await loadImage(logoPath);
        
        // Calcular el tamaño y posición del logo central (20% del código QR para no estropear la lectura)
        const logoSize = 160; 
        const logoPos = (800 - logoSize) / 2;
        
        // Opcional: Agregar un pequeño fondo blanco para que el logo resalte más y no se confunda con los puntos
        ctx.fillStyle = '#ffffff';
        // Circular mask background
        ctx.beginPath();
        ctx.arc(800/2, 800/2, logoSize/2 + 10, 0, 2 * Math.PI);
        ctx.fill();

        // Dibujar logo redondo
        ctx.save();
        ctx.beginPath();
        ctx.arc(800/2, 800/2, logoSize/2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(logo, logoPos, logoPos, logoSize, logoSize);
        ctx.restore();

        // Guardar archivo final
        const out = fs.createWriteStream(outputPath);
        const stream = finalCanvas.createPNGStream();
        stream.pipe(out);
        
        out.on('finish', () =>  console.log('¡QR con Logo Umami generado con éxito!'));

    } catch (err) {
        console.error("Error generando el QR:", err);
    }
}

// Variables base
const siteUrl = 'https://umamii-burguer.vercel.app/';
const logoToUse = './assets/img/Logo (2).jpeg';
const finalQrOutput = './assets/img/qr-umamii-logo.png';

// Ejecutar script
createQRWithLogo(siteUrl, logoToUse, finalQrOutput);
