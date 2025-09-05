
# ✋ AirSketch

> Desenhe com as mãos usando **visão computacional** e **MediaPipe**.  
> Um experimento em React + TypeScript que transforma gestos na frente da webcam em traços no canvas.

---

## 🚀 Tecnologias

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) → base escalável
- [Vite](https://vitejs.dev/) → dev server rápido
- [Tailwind CSS](https://tailwindcss.com/) → UI minimalista e responsiva
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) → detecção de landmarks da mão em tempo real
- Filtro **One Euro** → suavização dos pontos para traços mais fluidos

---

## ✨ Funcionalidades

- 🎨 Desenhar unindo **polegar + indicador** (gesto *pinch*)
- 🧽 Borracha
- 🎚 Alterar **cor** e **espessura** dos traços
- ↶ ↷ **Undo/Redo**
- 💾 Exportar o desenho em **PNG**
- 🖐 Suporte a **mão esquerda/direita** (configurável)
- 🎥 Opção de **usar a webcam como fundo** (desenhe sobre você mesmo!)
- ⭕ Cursor fantasma mostra onde o próximo traço vai começar
- ⚡ Otimizações de latência com One Euro filter

---

## 📦 Instalação e uso

```bash
# clone o repositório
git clone https://github.com/seu-usuario/airsketch.git
cd airsketch

# instale dependências
npm install

# inicie em modo dev
npm run dev
```

Abra no navegador em [http://localhost:5173](http://localhost:5173).

---

## 📂 Configuração do modelo MediaPipe

Baixe o arquivo [`hand_landmarker.task`](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) e coloque em:

```
public/models/hand_landmarker.task
```

Sem ele a detecção não inicia.

---

## 🖼 Preview

> (Adicione aqui um gif ou print do app rodando)

<p align="center">
  <img src="docs/preview.png" width="600" alt="demo AirSketch" />
</p>

---

## 💡 Ideias futuras

- ✍️ Reconhecimento de gestos customizados
- 🖼 Exportar também em **SVG/vetor**
- 📱 Suporte mobile
- 🎶 Modo criativo: gestos que mudam cor/espessura dinamicamente

---

## 📜 Licença

MIT © [Mari Ventura](https://github.com/mariavitoriaventura)
