"""Servidor local do painel.

Serve os arquivos do projeto (como `python -m http.server`) e repassa as
consultas de cotação para a brapi.dev usando a chave do arquivo `.env`.
Assim a chave fica só no seu computador e nunca vai para o navegador.

Uso:
    python servidor.py          # porta 8000
    python servidor.py 9000     # outra porta
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.dirname(os.path.abspath(__file__))
BRAPI = "https://brapi.dev/api/quote/"
PREFIXO = "/api/brapi/quote/"


def ler_env(caminho):
    """Lê um .env simples (CHAVE=valor, # comentários, aspas opcionais)."""
    valores = {}
    if not os.path.exists(caminho):
        return valores
    with open(caminho, encoding="utf-8-sig") as f:
        for linha in f:
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha:
                continue
            nome, valor = linha.split("=", 1)
            valores[nome.strip()] = valor.strip().strip('"').strip("'")
    return valores


def chave_e_origem():
    """Devolve (chave, origem). Relido a cada consulta: dá para editar o .env sem reiniciar.

    O .env manda: se ele tem a linha BRAPI_TOKEN, vale o que está nela, mesmo vazia.
    A variável de ambiente só é usada quando o .env não tem essa linha. Isso evita que
    uma chave carregada antes (por exemplo, pelo VS Code ao abrir o terminal) continue
    valendo depois de apagada do arquivo.
    """
    env = ler_env(os.path.join(RAIZ, ".env"))
    if "BRAPI_TOKEN" in env:
        return env["BRAPI_TOKEN"], ".env"
    valor = os.environ.get("BRAPI_TOKEN", "").strip()
    return valor, ("variável de ambiente BRAPI_TOKEN" if valor else "")


def token():
    return chave_e_origem()[0]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=RAIZ, **kwargs)

    def end_headers(self):
        # Sem cache: depois de um git pull, o navegador sempre pega a versão nova.
        if not self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def responder_json(self, status, dados):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        url = urllib.parse.urlsplit(self.path)
        caminho = urllib.parse.unquote(url.path)

        # Nunca servir arquivos ocultos como .env ou .git.
        if any(parte.startswith(".") for parte in caminho.split("/") if parte):
            self.send_error(404)
            return

        if caminho == "/api/brapi/status":
            chave, origem = chave_e_origem()
            self.responder_json(200, {"token": bool(chave), "origem": origem})
            return

        if caminho.startswith(PREFIXO):
            self.repassar_brapi(caminho[len(PREFIXO):], url.query)
            return

        super().do_GET()

    def repassar_brapi(self, ticker, query):
        chave = token()
        if not chave:
            self.responder_json(501, {"error": True, "code": "NO_ENV_TOKEN",
                                      "message": "BRAPI_TOKEN não está no .env"})
            return
        if not ticker.isalnum() or len(ticker) > 12:
            self.responder_json(400, {"error": True, "message": "Código inválido"})
            return
        params = dict(urllib.parse.parse_qsl(query))
        params = {k: v for k, v in params.items() if k in ("range", "interval")}
        params["token"] = chave
        destino = BRAPI + urllib.parse.quote(ticker.upper()) + "?" + urllib.parse.urlencode(params)
        pedido = urllib.request.Request(destino, headers={"User-Agent": "personal-investor/1.0"})
        try:
            with urllib.request.urlopen(pedido, timeout=20) as r:
                status, corpo = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, corpo = e.code, e.read()
        except Exception as e:  # rede fora do ar, DNS, certificado...
            self.responder_json(502, {"error": True, "message": "Falha ao falar com a brapi: " + str(e)})
            return
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)


def main():
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    servidor = ThreadingHTTPServer(("127.0.0.1", porta), Handler)
    print(f"Painel em http://localhost:{porta}/#papel=PETR4")
    chave, origem = chave_e_origem()
    print("Chave da brapi: " + ("lida de " + origem if chave else "não encontrada (crie o .env a partir do .env.example)"))
    print("Ctrl+C para parar.")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
