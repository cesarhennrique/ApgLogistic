# Imagens de IA da jornada (padrão aprovado em 2026-10-30)

Padrão: objetos **fotorrealistas isolados em fundo branco puro**, movidos pelo scroll (prova em `/dev/prova`). Todas as imagens seguem as mesmas regras, para parecerem uma única sessão de fotos.

## Regras para todas as imagens

- Fundo **branco puro**, sem chão visível; só uma sombra de contato suave quando o objeto está apoiado.
- **Sem marcas, logos, textos ou placas.** O logo APG é aplicado depois por edição.
- Cores fixas: cabine branca; container **navy #1A2350** com **uma faixa vermelha #E31E24** horizontal.
- Mesma luz: suave de estúdio, vinda de cima e da esquerda.
- Gere de 3 a 4 variações, escolha a melhor e **salve a versão original em maior resolução** (sem print de tela).
- Salve em `C:\dev\apg-site\assets-src\ai\` com o nome indicado.

## Lista

| # | Arquivo | Uso na jornada |
|---|---|---|
| 1 | `carreta-lado.png` (já existe; falta a original em alta e o logo) | Capítulo da estrada |
| 2 | `carreta-lado-vazia.png` | Carreta esperando o container (capítulo 2) |
| 3 | `container-apg.png` | Container que desce do portêiner até a carreta |
| 4 | `porteiner-lado.png` | Portêiner (capítulo 1 e 2) |
| 5 | `navio-cima.png` | Navio chegando em Suape, visto de cima |
| 6 | `oceano-cima.png` | Fundo do navio, visto de cima |
| 7 | `carreta-cima.png` | Carreta seguindo a linha vermelha no terminal |

## Prompts

**1. Logo na carreta (edição da imagem existente).** Suba a imagem da carreta e o logo `public/brand/logo.svg` (exporte como PNG) e peça:

```text
Edit this image: place the attached logo on the truck cab door, centered on the door panel below the side window, sized about 60% of the door width, as a clean flat vinyl decal following the door surface. Keep everything else in the image exactly identical: same truck, same container, same lighting, same white background, same framing.
```

**2. Carreta vazia (edição da imagem da carreta):**

```text
Edit this image: remove the shipping container from the trailer so only the empty skeletal container chassis remains visible, with its twist locks. Keep the truck cab, chassis, wheels, lighting, white background, camera angle and framing exactly identical.
```

**3. Container APG isolado:**

```text
Photorealistic studio product photograph of a single 40-foot steel shipping container painted deep navy blue (#1A2350) with one horizontal red stripe (#E31E24) along its side, corrugated walls, corner castings, no logos, no text, no markings. Exact side view at 90 degrees, camera at mid-height, isolated and floating on a pure white seamless background with no shadow, soft even studio lighting from top-left, ultra sharp, 16:9.
```

**4. Portêiner:**

```text
Photorealistic studio product photograph of a ship-to-shore container gantry crane, light grey steel with subtle yellow and black safety stripes on the spreader, tall A-frame on top with forestays, long boom extending to the left, spreader raised high without any container, no logos, no text. Exact side elevation view at 90 degrees, the entire crane visible with margin, isolated on a pure white seamless background, subtle soft contact shadow under the legs, soft even studio lighting from top-left, ultra sharp, vertical 4:5.
```

**5. Navio visto de cima:**

```text
Photorealistic aerial top-down view, camera pointing straight down, of a medium coastal container ship, bow pointing up, deck fully loaded with neatly stacked shipping containers in muted colors (rust red, ocean blue, teal, ochre, white, grey) with several navy blue containers with a red stripe, white superstructure at the stern, no logos, no text, no names on the hull. Isolated on a pure white background with no water and no shadow, soft even lighting, ultra sharp, vertical 9:16.
```

**6. Oceano visto de cima:**

```text
Photorealistic aerial top-down photograph of deep blue tropical ocean water, camera pointing straight down, fine natural wave texture with subtle sun glints, uniform deep navy and teal tones, no boats, no land, no foam lines, seamless and evenly lit, ultra high resolution, 16:9.
```

**7. Carreta vista de cima:**

```text
Photorealistic aerial top-down view, camera pointing straight down, of a white cab-over semi truck pulling a 40-foot shipping container painted deep navy blue (#1A2350) with one red stripe (#E31E24) across the roof, truck pointing up, no logos, no text, no license plate. Isolated on a pure white background with a very subtle soft shadow, soft even studio lighting, ultra sharp, vertical 9:16.
```

**8. Navio no mar (revisão 2026-10-30b; substitui o navio e o oceano separados na cena 1).** Exceção às regras de fundo branco: aqui o oceano faz parte da foto. Salve como `navio-mar.png`, na **maior resolução que o gerador entregar** (a cena dá zoom de até ~2,5× nela).

```text
Photorealistic aerial drone photograph taken from high altitude, camera pointing straight down, of a medium coastal container ship sailing on deep blue tropical ocean. Bow pointing straight up, ship perfectly centered in the frame and occupying about one third of the frame height. Deck fully loaded with neatly stacked shipping containers in muted colors (rust red, ocean blue, teal, ochre, white, grey), with several deep navy blue containers with one red stripe near the middle of the deck. White superstructure at the stern. Natural white bow wave and a long turbulent foamy wake trailing behind the stern toward the bottom of the frame. Fine natural wave texture and subtle sun glints on the water. No land, no other boats, no logos, no text, no names on the hull. Natural midday light, ultra sharp, highest resolution, 16:9.
```

**9 e 10. Carreta com a câmera subindo (revisão 2026-10-31b).** São os quadros intermediários entre a carreta de lado e a de cima. Faça como **edição** da `carreta-lado` (suba a imagem), para manter o mesmo caminhão, o logo e o container. Gere 3–4 variações de cada, salve na maior resolução como `carreta-alto-30.png` e `carreta-alto-60.png`.

```text
Edit this image: show the exact same truck and container from a higher camera, raised to about 30 degrees above the horizon and looking down at it, so the roof of the container and the top of the cab become visible while the side is still seen. Keep the truck pointing left, same position and length in the frame, same white cab with the logo on the door, same navy container with the red stripe along the side; the container roof is navy with one red stripe running along its length. Pure white background, very subtle contact shadow, same soft studio lighting, ultra sharp.
```

Para a de 60°, use o mesmo texto trocando "about 30 degrees" por "about 60 degrees" e "while the side is still seen" por "with only a thin sliver of the side still visible".

## Depois de gerar

Me avise quando os arquivos estiverem na pasta. Eu reviso a consistência entre eles (cor, luz, escala), recorto o fundo onde for preciso e reescrevo a jornada no novo padrão.
