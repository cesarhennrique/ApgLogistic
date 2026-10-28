# Licenças dos assets

| Arquivo | Origem | Licença |
|---|---|---|
| `logo/logo-original.png` | Cliente (APG), PNG 4962×2954 do site atual: https://static.wixstatic.com/media/64205d_aa89fadd6fc64cdfb223ecf6a65dc45c~mv2.png | Material do próprio cliente |
| `map/nordeste-ibge.svg` | IBGE, malha territorial das UFs (Nordeste); convertido por `scripts/clean-map.mjs` para `public/images/map/nordeste.svg` | Dados públicos (IBGE) |
| `3d/waternormals.jpg` | three.js, `examples/textures/waternormals.jpg`: https://github.com/mrdoob/three.js; convertido com sharp para `public/3d/textures/water-normal.webp` (1024 px, q85) | MIT |
| `fonts/ArchivoExtraCondensed-{Bold,ExtraBold}.ttf` | Archivo (Omnibus-Type), estáticos de https://github.com/Omnibus-Type/Archivo/tree/master/fonts/ttf; subset latin + woff2 (pyftsubset) em `src/app/fonts/`. Texto da licença: `fonts/Archivo-OFL.txt` | SIL OFL 1.1 |
