import { fileURLToPath, URL } from 'node:url';
import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({
  plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['logo-shapefull.jpg','apple-touch-icon.png'],manifest:{name:'Shape Full Academia',short_name:'Shape Full',description:'Gestão inteligente para academias',theme_color:'#171322',background_color:'#171322',display:'standalone',start_url:'/',icons:[
    {src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
    {src:'/icon-512-maskable.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
  ]}})],
  resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
  server:{port:5173},
});
