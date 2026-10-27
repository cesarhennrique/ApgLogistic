# Site APG — Guia de assets

Este guia cobre tudo o que **não é código**: logo, fotos, imagens geradas por IA, modelos 3D, texturas, HDRI e mapa. Cada item diz onde o arquivo vai ficar e qual prompt depende dele.

## Regras

- **Originais** ficam em `assets-src/`, que vai para o git mas não é publicado. **Arquivos otimizados** ficam em `public/`.
- **IA nunca finge ser a APG.** Imagens geradas só servem para atmosfera, texturas e conceitos 3D. Terminal, frota, pátio e pessoas da APG aparecem só em **fotos reais**. Mostrar uma foto inventada como se fosse o terminal deles é propaganda enganosa e expõe o cliente.
- **Licenças:** só use CC0, licença comercial comprada ou material do próprio cliente. Anote a origem de cada arquivo em `assets-src/LICENSES.md`.
- Para converter e otimizar, coloque o original em `assets-src/` e peça no Claude do VS Code: *"Converta assets-src/<pasta> para WebP em public/<pasta>, largura máxima 2400px, qualidade 80, usando sharp."*

---

## 1. Logo (antes do Prompt 01)

1. Coloque o arquivo vetorial do cliente em `assets-src/logo/`.
2. Se vier em `.ai`, `.eps` ou `.pdf`, converta para SVG antes do Prompt 01:
   - no Illustrator: *Arquivo → Exportar → SVG*, com texto convertido em contornos;
   - ou com o Inkscape, que é gratuito.

```bash
inkscape assets-src/logo/logo.pdf --export-type=svg --export-plain-svg -o assets-src/logo/logo.svg
```

3. O Prompt 01 gera as variações (branca e só a seta) e extrai as cores exatas.

## 2. Fotos reais

### 2.1 O que já existe no site Wix (baixar antes do Prompt 04)

Arquivos originais em `https://static.wixstatic.com/media/<id>`. Baixe pelo navegador e salve em `assets-src/photos/`.

| Arquivo (id) | Tamanho | Uso |
|---|---|---|
| `64205d_641a3a3e0c744a1fb608a7a2e834271b~mv2.jpg` (DJI_0590, drone) | 4000×2250 | **Boa.** Hero de `/estrutura`, card de containers-suape |
| `64205d_f3af07e32d9c4ab3b5872a0f30c47428~mv2.jpg` (DJI_0164, drone) | 4000×2250 | **Boa.** Galeria, card de logística |
| `64205d_c52ce2d1f17342efb54260c308ac93e5~mv2.jpg` (sp2) | 1280×727 | Só galeria, em tamanho pequeno |
| `64205d_15e3824658294564b80b170dd21d151a~mv2.jpg` (sp6) | 1280×720 | Só galeria, em tamanho pequeno |
| `64205d_c0b6089890f041e6a1b677022105ad95~mv2.jpg` (sp3) | 1066×960 | Só galeria, em tamanho pequeno |
| `64205d_e61162640dd84009bf854673c0e08780~mv2.jpg` (sp1) | 774×774 | Baixa resolução. Evitar |
| `64205d_05730d62cc904ac394f43e3c42d2c48b~mv2.jpg` (interno1) | 960×1280 | Galeria (vertical) |
| `64205d_30aa52df3e1f4bf8aa6052a74947f16d~mv2.jpg` | 806×627 | Baixa resolução. Evitar |

**Conclusão:** só os 2 drones têm qualidade de site premium. O resto serve só para miniaturas da galeria.

### 2.2 Sessão de fotos (recomendado)

Peça ao cliente uma sessão com fotógrafo e drone (estimativa: R$ 1.500 a R$ 3.000). É o investimento com maior retorno visual depois do 3D.

Lista de fotos:

1. Pátio CONE do alto, no pôr do sol, com as pilhas de containers (drone, horizontal 16:9).
2. Pátio à noite com as luzes acesas (drone).
3. Fila de carretas APG alinhadas, com a cabine e o logo em destaque.
4. Carreta APG saindo do portão, de baixo para cima, em movimento.
5. Docas do galpão com as portas abertas e operação de carga.
6. Interior do galpão de cross-docking, em perspectiva longa.
7. Operação em Suape: carreta APG sendo carregada pelo portêiner (com autorização do porto).
8. Equipe: 3 a 4 retratos ambientados (operação, motorista, escritório), com autorização de imagem.
9. Detalhes: cantoneira de container, lacre, rastreador, mão no volante.
10. Unidade da Bahia (BR-324): fachada e pátio.

**Especificações:** RAW + JPG em resolução máxima, horizontal na maioria (mínimo 3000 px), mais 3 verticais para mobile.

**Destino:**
- `assets-src/photos/estrutura/`, depois convertido para `public/images/estrutura/`;
- `assets-src/photos/services/`, depois convertido para `public/images/services/<slug>.webp`.

## 3. Imagens geradas por IA (atmosfera)

Use o gerador de imagem que você assina: Midjourney, ChatGPT, Gemini ou Ideogram. Os prompts estão em inglês porque os modelos rendem melhor assim.

**Regra:** nada de logos, textos ou marcas na imagem. Se aparecer algum, gere de novo.

Se a sessão de fotos acontecer, as imagens 3.1 a 3.3 são **substituídas** pelas fotos reais.

| # | Destino | Proporção | Prompt |
|---|---|---|---|
| 3.1 | `public/images/services/containers-suape.webp` (provisória) | 4:5 | `Cinematic close-up of stacked shipping containers at a Brazilian seaport at golden hour, warm sunset light on corrugated steel, deep navy blue and muted red containers, shallow depth of field, ship-to-shore crane silhouette in soft focus background, 35mm film look, subtle grain, no text, no logos` |
| 3.2 | `public/images/services/operacao-bahia.webp` (provisória) | 4:5 | `Low angle cinematic shot of a white cab-over semi truck carrying a navy blue shipping container on a Brazilian highway at dusk, headlights on, motion blur on asphalt, tropical vegetation on roadside, warm orange sky fading to deep blue, no text, no logos, no license plate` |
| 3.3 | `public/images/services/logistica-armazenagem.webp` (provisória) | 4:5 | `Wide interior of a modern logistics warehouse with cross-docking, long perspective of loading docks with open doors, pallets neatly organized, cool white industrial light with warm sunset light entering through dock doors, clean and organized, cinematic, no people faces, no text, no logos` |
| 3.4 | Fundo do FinalCta: `public/images/bg/cta.webp` | 21:9 | `Aerial night view of a container terminal, sodium vapor lights creating warm pools of light on rows of containers, deep navy blue darkness around, long exposure light trails of trucks, minimal and moody, cinematic, no text` |
| 3.5 | Fundo de `/contato`: `public/images/bg/contato.webp` | 16:9 | `Abstract macro of corrugated shipping container steel surface painted deep navy blue, a thin red painted stripe crossing diagonally, raking light from the side, minimal, high detail, no text` |

Gere 4 variações de cada uma, escolha a melhor e faça upscale para pelo menos 2400 px de largura.

## 4. Modelos 3D (antes do Prompt 11)

Precisamos de só **2 modelos**. Todo o resto (containers, portêiner, terminal, estrada, vans) é feito em código.

| Modelo | Arquivo final | Limite |
|---|---|---|
| Navio de cabotagem (porta-containers médio) | `public/3d/models/ship.glb` | até 40 mil triângulos, até 600 KB |
| Cabine do cavalo mecânico (cara chata, estilo Scania/Volvo, **sem marca**) | `public/3d/models/truck-cab.glb` | até 20 mil triângulos, até 300 KB |

Só a geometria importa: o código troca os materiais pelas cores da cena e aplica o logo APG como decal.

### Caminho A (recomendado): IA de imagem para 3D

1. **Gere a imagem conceito** no gerador de imagem, com fundo branco e vista 3/4:

   **Navio:**
   ```text
   Stylized 3D miniature model of a medium coastal container ship, clean simple shapes, smooth surfaces, slightly beveled edges, dark navy hull, white superstructure at the stern, empty flat deck, three-quarter view from front left, plain white background, soft studio light, product render, no text, no logos, no containers on deck
   ```

   **Cabine:**
   ```text
   Stylized 3D miniature model of a cab-over semi truck tractor unit without trailer, European style flat front cab, clean simple shapes, slightly beveled edges, plain white paint, black wheels, three-quarter view from front left, plain white background, soft studio light, product render, no text, no logos, no brand grille badge
   ```

2. **Converta para 3D** no Meshy (meshy.ai) ou no Tripo (tripo3d.ai), com *Image to 3D*:
   - envie a imagem;
   - escolha topologia low-poly ou "quad" e o alvo de polígonos da tabela;
   - baixe em **GLB**;
   - plano pago: cerca de US$ 20/mês, e um mês basta;
   - gere 2 ou 3 versões e escolha a mais limpa.
3. Salve em `assets-src/3d/ship-raw.glb` e `assets-src/3d/truck-cab-raw.glb`.

### Caminho B: comprar pronto

No Sketchfab (filtro *Downloadable* + licença *Standard* ou *CC Attribution*) ou no CGTrader, procure por `low poly container ship` e `low poly cab over truck`. Antes de comprar, verifique:

- licença que permite uso comercial;
- triângulos abaixo do limite;
- formato GLB ou glTF;
- estilo limpo, sem texturas fotográficas.

Custo típico: US$ 10 a US$ 60 cada. Registre a licença em `assets-src/LICENSES.md`.

### Otimização (os dois caminhos)

```bash
npx @gltf-transform/cli optimize assets-src/3d/ship-raw.glb public/3d/models/ship.glb --compress meshopt --texture-compress webp --texture-size 1024
```

```bash
npx @gltf-transform/cli optimize assets-src/3d/truck-cab-raw.glb public/3d/models/truck-cab.glb --compress meshopt --texture-compress webp --texture-size 1024
```

Para conferir triângulos e tamanho:

```bash
npx @gltf-transform/cli inspect public/3d/models/ship.glb
```

Se passar do limite, peça ao Claude do VS Code: *"Simplifique public/3d/models/ship.glb com gltf-transform simplify até ficar abaixo de 40 mil triângulos sem deformar a silhueta, e normalize escala e orientação (proa para -Z, base em y=0)."*

**Se nada ficar bom:** o Prompt 11 tem fallback procedural. O site não trava por causa disso.

## 5. Texturas, HDRI e água (antes do Prompt 09)

Todas são CC0 (uso livre). Baixe na resolução indicada.

| Item | Fonte | Destino |
|---|---|---|
| HDRI de pôr do sol | polyhaven.com, categoria HDRIs: busque "sunset" e escolha um céu limpo com sol baixo. **1K, formato .hdr** | `public/3d/hdri/sunset-1k.hdr` |
| Normal map de água | three.js, arquivo `examples/textures/waternormals.jpg` no repositório oficial (licença MIT) | `public/3d/textures/water-normal.webp` |
| Asfalto | ambientcg.com: busque "Asphalt" e escolha um com faixa clara. **1K-JPG**: só Color e NormalGL | `public/3d/textures/asphalt-color.webp`, `asphalt-normal.webp` |
| Concreto do pátio | ambientcg.com: busque "Concrete". 1K-JPG: Color e NormalGL | `public/3d/textures/concrete-color.webp`, `concrete-normal.webp` |

**Orçamento:** todos os arquivos de `public/3d/` somados ficam abaixo de **1,5 MB**. O Prompt 18 verifica isso automaticamente.

## 6. Mapa do Nordeste (antes do Prompt 04)

A malha oficial do IBGE é pública. Este link gera o SVG do Nordeste dividido por estados:

```text
https://servicodados.ibge.gov.br/api/v3/malhas/regioes/2?formato=image/svg+xml&intrarregiao=UF&qualidade=minima
```

Abra no navegador, salve como `assets-src/map/nordeste-ibge.svg` e peça no VS Code: *"Limpe assets-src/map/nordeste-ibge.svg para public/images/map/nordeste.svg: um <path> por estado com id pela sigla (id="PE", id="BA"…), sem fill e stroke fixos, viewBox justo."*

## 7. Fonte para as imagens OG (antes do Prompt 07)

Baixe o Archivo em fonts.google.com/specimen/Archivo (*Get font → Download*). Copie o arquivo variável `Archivo-VariableFont_wdth,wght.ttf` para `src/app/fonts/`. Licença OFL, uso livre.

## 8. Checklist para enviar ao cliente

Copie e mande ao cliente:

> Para o novo site, precisamos de:
> 1. Logo em vetor (AI, EPS, PDF ou SVG). ✅ recebido
> 2. Número de WhatsApp comercial para o botão do site.
> 3. E-mail que recebe os pedidos de cotação.
> 4. Confirmação de que rh@apgtransportes.com.br está ativo para receber currículos.
> 5. Fotos e vídeos originais em alta (drone, frota, terminal, equipe), ou aprovação de uma sessão de fotos.
> 6. Logos dos clientes que podemos exibir, com autorização por escrito.
> 7. Certificações (ISO, SASSMAQ etc.) e números atualizados: quantidade de carretas, funcionários, TEUs/mês.
> 8. Marcos da história da empresa desde 1996, para a linha do tempo.
> 9. Missão, visão e valores, se existirem.
> 10. Acesso ao painel do domínio apgtransportes.com.br (registro.br ou outro), para configurar o site e o e-mail.
> 11. Validação da Política de Privacidade pelo jurídico.

## 9. Ordem: quando cada asset precisa existir

| Antes do prompt | Asset |
|---|---|
| 01 | Logo SVG em `assets-src/logo/` |
| 04 | Drones do Wix + imagens IA 3.1–3.5 + mapa do Nordeste |
| 05 | Fotos para a galeria de `/estrutura` |
| 07 | Fonte Archivo TTF |
| 09 | HDRI, normal map de água, asfalto, concreto |
| 11 | `ship.glb` e `truck-cab.glb` otimizados |
| 19 | WhatsApp, e-mails e acesso ao DNS |
