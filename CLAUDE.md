# Mec Encoder: guia para o Claude Code

App do Hugo (hugomec7) para converter vídeos (proxy, H.265, NVENC), cortar, ver e baixar vídeos.
Inspirado no Shutter Encoder, só com o que ele usa. Windows 10. O Hugo escreve e lê em português:
responda em português, direto, sem jargão.

## Estrutura

- `core/`: motor em Rust (crate `mec-core`): presets, FFmpeg, cortes, downloads (`core/src/download.rs`).
- `cli/`: linha de comando `mec.exe` (`bin\mec.exe convert ...`). **Não mudar o comportamento do `mec.exe convert`.**
- `app/`: Tauri 2. O Rust fica em `app/src/` (`main.rs`, `downloader.rs`, `viewer.rs`, `store.rs`, `tools.rs`).
  A interface é JS puro, sem framework: `app/ui/` (`index.html`, `app.js`, `i18n-view.js` com 10 idiomas, `news.js` gerado).
- `app/viewer/`: player `mecview` em C (compilado contra as DLLs do FFmpeg).
- `app/bin/`: ffmpeg, ffprobe, DLLs, mecview.exe e mec.exe. Vem do CI e não está no git.
- Dados do usuário ficam em `%APPDATA%\com.hugomec.mecencoder` (`presets.json`, `queue.json`, `settings.json`, `jobs\`).

## Branches e publicação

- Trabalhe na branch `player`. O `main` só recebe por fast-forward: `git push origin player:main`.
  Antes, confira com `git merge-base --is-ancestor origin/main HEAD`.
- **Só publique (push para o main) quando o Hugo pedir** ("publicar", "publica").
- **Versão de teste tem "teste" no nome:** `0.3.13-teste.1`, `0.3.13-teste.2`… nos 4 arquivos de versão
  (`app/Cargo.toml`, `cli/Cargo.toml`, `link/Cargo.toml`, `app/tauri.conf.json`). A final é `0.3.13`.
  O CI dá ao MSI o número `0.3.13.1` (só números) e, se uma versão de teste chegar ao main, sai como pré-lançamento.
  O app trata `0.3.13-teste.N` como anterior à `0.3.13` (`update::newer`), então quem testou recebe a final.
- Build de teste sem publicar: `gh workflow run build.yml --ref player`. O artefato se chama "MecEncoder-windows-x64"
  (MSI + portátil). Mande ao Hugo o link da execução no GitHub Actions.
- Para lançar a versão X.Y.Z:
  1. Escreva `docs/release-notes/X.Y.Z.md` com **English** e **Português** (veja as anteriores).
  2. Suba a versão (sem "-teste") em `app/Cargo.toml`, `cli/Cargo.toml`, `link/Cargo.toml` e `app/tauri.conf.json`.
  3. Coloque as notas no topo do `CHANGELOG.md`, depois de `# Changelog · Novidades`, com o título `## X.Y.Z`.
  4. Rode `python docs/release-notes/make_news.py` (gera `app/ui/news.js`).
  5. Faça o commit, dê push no `player` e depois `git push origin player:main`. O CI cria o release `vX.Y.Z`
     com MSI, portátil e `latest.json` (o app usa esse arquivo para avisar de atualização).
  - Com `<!-- prerelease -->` nas notas, sai como pré-lançamento e o app não oferece a atualização.
- Notas de release sobre sites adultos: não cite os sites. Escreva só "agora tem suporte a novos sites".

## Compilar e testar

- O CI (`.github/workflows/build.yml`) é a referência de como montar tudo no Windows: FFmpeg BtbN 8.0 GPL shared,
  mecview com MinGW, `cargo build -p mec-cli`, `npx @tauri-apps/cli@2 build`.
- Testes do motor: `cargo test -p mec-core --features serde` (precisa de ffmpeg no PATH) e `cargo test -p mec-cli`.
- Para testar a interface sem o app, abra `app/ui/index.html?lang=pt&theme=studio` num navegador. Sem o Tauri,
  ela entra em modo demonstração.
- Para rodar o app de verdade em desenvolvimento: `app/bin` precisa ter ffmpeg, ffprobe, as DLLs e mecview.exe.
  Dá para copiar da pasta `bin` de uma instalação portátil. Depois rode `cd app && npx @tauri-apps/cli@2 dev`.

## Pasta de tarefas (automação, usada pelo MecDrive)

- `%APPDATA%\com.hugomec.mecencoder\jobs\`: um `.json` com `files`, `preset` e opções (`outputFolder`, `keepTree`,
  `suffix`, `subfolder`, `trim`, `join`, `deleteSource`). O README.txt completo é gerado pelo `JOBS_README` em `main.rs`.
- Sem `"start"`: entra na fila e renderiza sozinho. O pedido vai para `running\` e depois para `done\` ou `failed\`.
- `"start": false`: entra na fila parado. O pedido vai para `queued\` e o `status.json` fica com `state: "queued"`.
  Se a predefinição não existir, vai para `failed\` com `preset-not-found`. Se nenhum arquivo for encontrado, `source-missing`.
- Não mude o comportamento de pedidos sem `"start"`.
- Linha de comando: `mec-encoder.exe "arquivo" "pasta"` coloca os caminhos na fila sem converter. Com o app já aberto,
  os caminhos vão para a janela aberta (plugin single-instance).

## Extensão do navegador (por enquanto só Firefox)

- `browser/firefox/`: extensão MV3 (id `mec-encoder@hugomec`). Textos em `_locales/` (10 idiomas).
  - Clique no ícone: menu (`popup.*`) com o link que vai (copiado ainda não enviado, ou a página de vídeo) e
    Baixar rápido / Só o áudio / GIF / Escolher qualidade (abre o app na janela de qualidade).
  - Aba Avançado: chave "Botão em cima dos vídeos" (`content/float.js`), desligada por padrão; ao ligar pede
    `<all_urls>` e registra o script com `scripting.registerContentScripts`. Ícone redondo, arrastável (posição
    salva por site), posição padrão em 6 lugares (escolher uma apaga as arrastadas) e lista "Sites sem o botão".
    No X ele manda o link do post. O Hugo preferiu esse botão ao da fileira do curtir do X (removido).
  - Botão direito num link, vídeo ou página: Mec Encoder › vídeo, só o áudio ou GIF.
- `link/` (crate `mec-link`, vira `bin\mec-link.exe`): host de native messaging. Escolhe o link, responde à extensão
  e chama `mec-encoder.exe --mec-link {"urls":[...],"kind":"video"}`. Não herda o canal do navegador
  (senão o Firefox espera o app fechar) e sai do "job" do Firefox (`CREATE_BREAKAWAY_FROM_JOB`).
- O app, ao abrir, grava `%APPDATA%\com.hugomec.mecencoder\browser\firefox.json`, `app.txt` (caminho do exe) e a chave
  `HKCU\Software\Mozilla\NativeMessagingHosts\com.hugomec.mecencoder` (`register_browser` em `main.rs`).
- Com `--mec-link` o app abre minimizado e não rouba o foco; com ele já aberto, o link vai para a aba Baixar sem trazer
  a janela para a frente (evento `ext-link`, pendentes via `ext_take`).
- Instalar para teste: Firefox › `about:debugging` › Este Firefox › Carregar extensão temporária › `manifest.json`.
- Versão de verdade (instalada de vez): assinada no addons.mozilla.org como "On your own" (unlisted), pelo Hugo
  (conta dele). Fluxo de cada versão nova da extensão:
  1. Subir `version` no `manifest.json` e gerar o zip em `D:\hugo\Projetos\Apps\MecEncoder\Extensoes\`.
  2. O Hugo envia o zip no AMO e baixa o `.xpi` assinado (salvar na mesma pasta Extensoes).
  3. Anexar o `.xpi` ao release do app (`gh release upload vX.Y.Z MecEncoder-Firefox-A.B.C.xpi`) e pôr a versão
     nova no topo de `browser/firefox-updates.json` (no main). O Firefox atualiza sozinho por esse arquivo
     (`update_url` no manifest; **nunca mudar esse endereço**, senão quem já instalou para de receber).
- `data_collection_permissions: none`: a extensão só manda o link para o app no próprio PC, nada vai para a internet.

## Como o Hugo gosta de trabalhar

- Na dúvida, pesquise em fontes oficiais antes e avise. Nada de achismo.
- Ao controlar o PC dele: não abra o app de novo se já estiver aberto. Traga a janela com Alt+Tab ou pela barra de tarefas.
- Para mudanças grandes de interface, mostre o design para ele aprovar antes de implementar.
- Textos da interface: em todos os idiomas do `i18n-view.js`. Português com acentos.
