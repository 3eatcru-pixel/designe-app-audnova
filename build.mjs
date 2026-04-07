import { build } from 'vite';

console.log('🔨 Starting Vite build...');
build().then(() => {
    console.log('✅ Build completed successfully!');
    process.exit(0);
}).catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
