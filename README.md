# Endless Runner 3D - Three.js & Joystick

Jogo 3D Endless Runner desenvolvido com **Three.js**, **Vite** e **Iconify** (sem dependência de React), com suporte completo a Teclado e Joystick / Gamepad (presets XInput / Xbox e DualShock / PlayStation), remapeamento personalizável com 2 entradas por ação, vibração háptica no controle e efeitos sonoros procedurais via Web Audio API.

---

## 🎮 Mecânica do Jogo

- **Personagem em corrida contínua**: O personagem está sempre correndo para frente em uma pista de 3 faixas.
- **Obstáculos Moderados**: Troncos caídos com musgo, barreiras de trânsito listradas e rochas no caminho.
  - O jogador pode **pular** os obstáculos ou **mudar de faixa** para desviar.
  - **Colisão**: Se bater no obstáculo, perde pontos (-120 pts), perde vida (-25%) e força (-20%), pisca em invulnerabilidade e **volta suavemente para o meio (centro)** continuando a correr.
  - **Sem fim ("o jogo não tem fim")**: O jogo continua infinitamente; mesmo que a vida zere, o personagem recupera o fôlego e segue em frente.
- **Frutas Colecionáveis**:
  - Maçãs, Bananas, Cerejas e Laranjas 3D flutuantes que giram pelo caminho.
  - Coletar frutas aumenta a pontuação (+60 a +120 pts), restaura a barra de vida (+12% a +20%) e aumenta a força (+15% a +25%).
  - Efeito de partículas com as cores de cada fruta e som harmônico.
- **Áudio e Controles de Som**:
  - Mutar áudio geral com um clique.
  - Ativar / desativar efeitos sonoros (SFX).
  - Ativar / desativar música de fundo sintetizada (BGM).
  - Pausar a qualquer momento (tecla `Esc`, botão `Start/Options` no controle ou botão na tela).

---

## 🕹️ Controles e Suporte a Joystick

### 1. Presets Prontos
No menu de configurações (ícone de controle), você pode escolher entre 2 modos de visualização de botões:
- **XInput (Xbox)**: Botões nomeados como `A`, `B`, `X`, `Y`, `LB`, `RB`, `LT`, `RT`, `View`, `Menu`, `D-Pad`, `Analógico Esquerdo`, etc.
- **DualShock (PlayStation)**: Botões nomeados como `✕ (Cruz)`, `○ (Círculo)`, `□ (Quadrado)`, `△ (Triângulo)`, `L1`, `R1`, `L2`, `R2`, `Select / Share`, `Start / Options`, `D-Pad`, `L3`, etc.

### 2. Configuração de Controles (2 Entradas por Ação)
Cada uma das 4 ações principais pode ser configurada com **duas entradas simultâneas**:
1. **Entrada 1**: Tecla no Teclado
2. **Entrada 2**: Botão, Direcional (D-Pad) ou Eixo Analógico no Joystick

| Ação | Teclado Padrão | Joystick Padrão (Xbox) | Joystick Padrão (PlayStation) |
|---|---|---|---|
| **Mover para Esquerda** | `Seta Esquerda` / `A` | `D-Pad Esquerda` ou `Analógico Esq (←)` | `D-Pad Esquerda` ou `Analógico Esq (←)` |
| **Mover para Direita** | `Seta Direita` / `D` | `D-Pad Direita` ou `Analógico Esq (→)` | `D-Pad Direita` ou `Analógico Esq (→)` |
| **Pular Obstáculo** | `Barra de Espaço` / `W` | `Botão A` | `Botão ✕ (Cruz)` |
| **Pausar / Despausar** | `Esc` / `P` | `Menu / Start` | `Options / Start` |

*Para remapear, clique no botão da ação correspondente e pressione a nova tecla ou botão no controle.*

### 3. Vibração Háptica no Controle (DualShock / PS2 / PS3 / PS4 / PS5 / Xbox)
- Suporte nativo à API Gamepad Haptics (`dual-rumble`).
- O controle vibra em impactos com obstáculos e dá pulsos sutis ao coletar frutas.
- Botão **"Testar Vibração"** disponível no modal de configurações de controles.

---

## 🚀 Como Executar

1. Instalar dependências (caso ainda não estejam instaladas):
```bash
npm install
```

2. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse a URL indicada no terminal (geralmente `http://localhost:5173`).

---

## 🛠️ Tecnologias Utilizadas
- **Three.js**: Renderizador 3D WebGL, iluminação dinâmica, sombras suaves (PCFSoftShadowMap), materiais PBR, neblina atmosférica e animações procedurais.
- **Iconify**: Componente de ícones unificados (`<iconify-icon>`).
- **Web Audio API**: Sintetizador procedural para sons de pulo, impacto, chimes de frutas e música chiptune retro em tempo real (sem arquivos de áudio externos).
- **Gamepad API**: Detecção de joysticks, deadzone analógico e vibração de rumble duplo.
- **Vite**: Bundler rápido para desenvolvimento e produção.
