# 🐱‍💻 GATO BINARIO — Misión 01: Sistema Comprometido

Videojuego educativo de programación para la **primera reunión del Club Gato Binario**.
HTML5 + CSS3 + JavaScript vanilla. Sin frameworks, sin build, sin instalación.

> El Gato Binario quedó atrapado dentro de un sistema informático corrompido por bugs.
> Los estudiantes deben recorrer las cuatro zonas del sistema, recuperar los componentes
> perdidos y derrotar al **Bug Supremo**.

---

## 1. Cómo ejecutarlo

**Opción A — Live Server (recomendada)**
1. Abre la carpeta del proyecto en Visual Studio Code.
2. Clic derecho sobre `index.html` → **Open with Live Server**.

**Opción B — servidor incluido**
```bash
node tools/serve.mjs
```
Luego abre `http://localhost:5501`.

> ⚠️ El juego usa módulos ES (`type="module"`), así que **no funciona abriendo el archivo
> con doble clic** (`file://`). Necesita un servidor local, como Live Server.

Navegadores probados: Chrome / Edge / Firefox actuales.

---

## 2. Cómo se juega

1. **Registro** — alias del operador + nombre del equipo + elección del gato (6 variantes).
2. **Mapa del sistema** — 4 zonas + el boss. Las siguientes aparecen **🔒 BLOQUEADAS**.
3. **En cada zona** se construye un programa y se pulsa **▶ EJECUTAR**. El gato hace
   exactamente lo que se le indique, en orden.
4. Si algo sale distinto aparece **BUG DETECTADO**: se corrige y se vuelve a intentar.
   *Equivocarse no cuesta nada*: es parte del juego.

### Las tres rutas (todas juegan la MISMA misión)

| Ruta | Para quién | Qué hace |
|---|---|---|
| **EXPLORADOR** | Nunca ha programado | Arrastra o hace clic en bloques visuales. Cero código. |
| **PROGRAMADOR** | Ya conoce lo básico | Escribe *GatoScript* y lo compila a bloques (`Ctrl+Enter`). |
| **HACKER** | Quiere romper el sistema | Retos opcionales: menos instrucciones, bugs ocultos, optimización. |

Las rutas **comparten el programa**: se puede armar con bloques y verlo como código,
o escribirlo como código y verlo como bloques. Eso permite que un equipo mixto
(principiante + intermedio + avanzado) trabaje sobre la misma pantalla.

### Estrellas de cada zona
- ★ Completar la zona.
- ★★ Recoger todos los coleccionables.
- ★★★ Usar el número de instrucciones objetivo o menos → **obliga a descubrir ciclos y funciones**.

---

## 3. Las zonas

| Zona | Tema | Idea que se descubre |
|---|---|---|
| **01 · Arranque del sistema** | Secuencias | Un programa es una lista ordenada de instrucciones. |
| **02 · Laberinto de datos** | Decisiones | `SI (hayMoneda) { recoger }` — decidir en cada casilla. |
| **03 · Fábrica de Bugs** | Ciclos | El mismo tramo se repite 4 veces → `REPETIR 4 { … }`. |
| **04 · Núcleo del Sistema** | Funciones | 4 nodos idénticos → `funcion reparar()` usada 4 veces. |
| **BOSS · Bug Supremo** | Todo junto | 4 fases: ordenar, depurar, optimizar y ejecutar. |

Cada zona tiene además un **bug oculto** para cazar (mini-juego de la ruta Hacker).

### GatoScript (ruta Programador)

```js
avanzar();  girarIzquierda();  girarDerecha();
saltar();   recoger();         activar();      esperar();

repetir (4) {
  avanzar();
}

si (hayMoneda()) {
  recoger();
} sino {
  avanzar();
}

funcion reparar() {
  avanzar();
  activar();
}
reparar();
```

Sensores disponibles: `hayMuro()`, `hayMoneda()`, `hayObjeto()`, `hayEnemigo()`,
`hayObstaculo()`, `hayMeta()`.

---

## 4. Gamificación

- **XP**: misión +100 · solución eficiente +40 · bonus de equipo +25 · retos Hacker +30…90 · boss +200.
- **Rangos**: 🐾 Gatito Digital → 🐱 Aprendiz Binario → 😼 Cazabugs → 🤖 Hacker Felino → 👾 Maestro Binario → 🐱‍💻 Leyenda del Código.
- **Insignias**: 9 logros visuales (Primer Bug, Mente Lógica, Speedrunner, Compañero de Código, Programador, Bug Hunter, Rescatista Binario, Optimizador, Verdugo del Bug Supremo).
- **Bits** (monedas) y **estrellas** coleccionables. El sistema ya está preparado para
  gastarlos después en skins/personajes (`state.coins` en `js/core/storage.js`).
- Todo se guarda en **localStorage** (clave `gatobinario.save.v1`).

---

## 5. Panel del organizador

Botón discreto (esquina inferior derecha) o atajo **`Ctrl + Shift + P`**.

Permite: ir a cualquier zona o al boss · desbloquear zonas · sumar o restar XP
(incluido el **+20 XP por ayudar a un compañero**) · activar o desactivar la ruta Hacker ·
reiniciar el boss · modo proyector · pantalla completa · sonido y música ·
**reiniciar todo el progreso**.

### Modo proyector
Botón 📽 (o desde el panel). Aumenta el tamaño de los textos, oculta los controles
secundarios y amplía el área de juego para verlo desde lejos.

---

## 6. Sonido

El juego **suena sin necesidad de archivos**: todos los efectos y la música son
sintetizados con la Web Audio API (chiptune).

Para usar audio propio, coloca los archivos y decláralos en `assets/audio/manifest.json`:

```json
{
  "sfx":  { "coin": "assets/audio/sfx/coin.mp3" },
  "music": { "menu": "assets/audio/music/menu.mp3" }
}
```

Nombres admitidos:
`click, type, step, jump, coin, xp, success, unlock, error, hit, levelup, boss` (sfx)
y `menu, level, boss, victory` (música). Lo que no esté declarado se sigue sintetizando.

---

## 7. Recursos gráficos

**Los 334 sprites son propios**: se generan como SVG con un generador parametrizado.

```bash
node tools/generate-sprites.mjs   # regenera todo assets/
node tools/validate-sprites.mjs   # comprueba que ningún SVG esté mal formado
node tools/test-levels.mjs        # verifica que las 4 zonas se pueden completar
```

Para revisar todos los sprites de un vistazo, abre `tools/preview.html` con el
servidor en marcha (hoja de contacto con las 334 imágenes).

```
assets/
  sprites/
    player/        156 archivos — 6 pelajes × (idle, walk, jump, happy, hurt, down, action)
    enemies/       bugs, robots patrulla, glitches, virus
    boss/          Bug Supremo: 4 fases + ataque, daño y derrota
    items/         bits, estrellas, llaves, chips, cristales
    objects/       servidores, terminales, cofres, puertas, portales, firewalls, interruptores
    environment/   tiles de piso, muros y plataformas de las 5 zonas
    avatars/       retratos de selección
  backgrounds/     menú, mapa, 4 zonas y arena del boss (1280×720)
  icons/           interfaz + iconos de cada instrucción
  badges/          9 insignias
  audio/           music/ y sfx/ (vacías: el sonido es sintetizado)
```

### Sustituir un sprite por uno propio
Los archivos se referencian **en un solo lugar**: `js/core/assets.js`.
Basta con cambiar la ruta de la animación correspondiente (o sobrescribir el `.svg`/`.png`
con el mismo nombre) y el resto del juego lo adopta sin tocar el motor.

---

## 8. Estructura del código

```
index.html
css/
  base.css       variables, botones, paneles, HUD, modo proyector
  screens.css    arranque, título, registro, mapa, boss, victoria, perfil
  game.css       escenario, bloques, editor de código, retos hacker
  effects.css    animaciones, partículas, glitch, confeti
js/
  app.js                arranque y navegación general
  core/
    utils.js            helpers de DOM, bus de eventos
    storage.js          localStorage, XP, rangos, insignias
    assets.js           catálogo de sprites y animaciones + precarga
    audio.js            sintetizador de efectos y música chiptune
    fx.js               partículas, números flotantes, confeti, sacudidas
  game/
    commands.js         catálogo de instrucciones + parser de GatoScript
    levels.js           datos de las 4 zonas (mapas ASCII)
    world.js            rejilla, semántica de ejecución e intérprete
    renderer.js         dibujo en canvas
    blocks.js           ruta Explorador (arrastrar y soltar)
    codepanel.js        ruta Programador (editor + compilación)
    hacker.js           ruta Hacker (retos + caza de bugs)
    level-screen.js     controlador de la pantalla de nivel
    boss.js             combate final por fases
  ui/
    screens.js          navegación entre pantallas y overlays
    hud.js              barra superior
    map.js              mapa de zonas
    terminal.js         arranque y terminal de ambientación
    dialogs.js          perfil, briefing, ayuda, resultados
    teacher.js          panel del organizador
tools/                  generador de sprites, validador, tests y servidor
```

---

## 9. Guion sugerido para la reunión (≈ 90 min)

| Tiempo | Actividad |
|---|---|
| 0–5 | Pantalla de título proyectada. Se lee la alerta: *SISTEMA COMPROMETIDO*. |
| 5–10 | Equipos de 3–4. Cada uno elige alias, nombre de equipo y gato. |
| 10–15 | Se proyecta el mapa y se explica **¿CÓMO SE JUEGA?**. |
| 15–30 | **Zona 01**: todos con la ruta Explorador. Se dicta la secuencia en voz alta antes de ejecutar. |
| 30–45 | **Zona 02**: aparece el `SI`. Los avanzados pasan a la ruta Programador. |
| 45–60 | **Zona 03**: el reto de las ★★★ los empuja a descubrir `REPETIR`. |
| 60–75 | **Zona 04**: funciones. Momento ideal para el bonus *+20 XP por ayudar a un compañero*. |
| 75–90 | **BOSS SUPREMO** proyectado, resuelto entre todos. Final + *MISIÓN 02 · PRÓXIMAMENTE*. |

**Consejos**
- Activa el **modo proyector** antes de empezar.
- Si un equipo se atasca, usa el panel del organizador para desbloquear la siguiente zona.
- El bug oculto de cada zona es un buen “rompehielos” para los que terminan primero.

---

## 10. Despliegue en Vercel

El proyecto es **100 % estático**: no hay build, no hay dependencias, no hay backend.
Vercel solo tiene que servir los archivos tal cual.

### Opción A — GitHub (recomendada: cada `push` republica el juego)

```bash
git init
git add .
git commit -m "Gato Binario - Mision 01"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/gato-binario.git
git push -u origin main
```

Luego en [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repositorio.
Vercel detecta que no hay framework y publica la carpeta tal cual. **No cambies nada**
en la pantalla de configuración y pulsa **Deploy**.

Si por algún motivo Vercel pide ajustes, usa exactamente esto:

| Campo | Valor |
|---|---|
| Framework Preset | **Other** |
| Build Command | *(vacío)* |
| Output Directory | `.` |
| Install Command | *(vacío)* |
| Root Directory | `./` |

### Opción B — CLI, sin GitHub

```bash
npm i -g vercel
vercel login
vercel          # despliegue de prueba
vercel --prod   # despliegue definitivo
```

Cuando pregunte el nombre del proyecto, escribe **`gato-binario`**
(la carpeta actual tiene espacios y acentos, y ese nombre no sirve como URL).

### Opción C — arrastrar y soltar

Comprime la carpeta en un `.zip` y súbela en
[vercel.com/new](https://vercel.com/new) → *Deploy without Git*.

### Qué hace `vercel.json`

- `cleanUrls`: la dirección queda como `tudominio.vercel.app` (sin `/index.html`).
- Los sprites se cachean 1 hora (rápido durante la sesión, pero si reemplazas
  una imagen se actualiza el mismo día; no se quedan pegados un año).
- El HTML, el CSS y el JS se revalidan siempre: al redesplegar, todos ven la
  versión nueva de inmediato.
- Cabeceras básicas de seguridad (`nosniff`, `X-Frame-Options`, `Referrer-Policy`).

### Después del primer despliegue

1. Abre `index.html` y reemplaza las dos rutas `/assets/og-image.png` por la URL
   completa (`https://TU-DOMINIO.vercel.app/assets/og-image.png`) para que la
   vista previa se vea bien al compartir el enlace por WhatsApp.
2. Comparte el enlace con los equipos. **Cada dispositivo guarda su propio
   progreso** en `localStorage`: los equipos no se pisan entre sí y no hace falta
   ninguna cuenta.
3. Si quieres regenerar la imagen de vista previa: arranca `npm run dev` y abre
   `http://localhost:5501/tools/make-og.html`.

### Comprobación antes de publicar

```bash
npm test
```

Valida los 334 SVG, comprueba que **todas las rutas coinciden en mayúsculas y
minúsculas** (Windows no distingue, el servidor de Vercel sí: este chequeo evita
imágenes rotas en producción) y verifica que las 4 zonas se pueden completar.

---

*Club Gato Binario · Misión 01 · v1.0*
