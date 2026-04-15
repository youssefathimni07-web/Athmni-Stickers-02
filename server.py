import json
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
ORDERS_FILE = DATA_DIR / "orders.json"


def load_env():
    env_path = ROOT_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_env()

PORT = int(os.environ.get("PORT", "3000"))

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}


def ensure_orders_file():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not ORDERS_FILE.exists():
        ORDERS_FILE.write_text("[]", encoding="utf-8")


def read_orders():
    ensure_orders_file()
    return json.loads(ORDERS_FILE.read_text(encoding="utf-8"))


def write_orders(orders):
    ensure_orders_file()
    ORDERS_FILE.write_text(json.dumps(orders, indent=2, ensure_ascii=False), encoding="utf-8")


class AppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if self.path == "/api/orders":
                self.handle_get_orders()
                return

            self.serve_static()
        except Exception as error:
            self.send_json(500, {"error": f"Server error: {error}"})

    def do_POST(self):
        try:
            if self.path == "/api/orders":
                self.handle_create_order()
                return

            self.send_json(405, {"error": "Method not allowed."})
        except Exception as error:
            self.send_json(500, {"error": f"Server error: {error}"})

    def parse_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON body.")

    def send_json(self, status_code, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_static(self):
        relative_path = "index.html" if self.path == "/" else self.path.lstrip("/")
        file_path = (ROOT_DIR / relative_path).resolve()

        if not str(file_path).startswith(str(ROOT_DIR.resolve())) or not file_path.is_file():
            self.send_json(404, {"error": "File not found."})
            return

        content_type = MIME_TYPES.get(file_path.suffix.lower(), "application/octet-stream")
        data = file_path.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_get_orders(self):
        self.send_json(200, {"orders": read_orders()})

    def handle_create_order(self):
        try:
            body = self.parse_json_body()
        except ValueError as error:
            self.send_json(400, {"error": str(error)})
            return

        customer_name = str(body.get("customerName", "")).strip()
        customer_phone = str(body.get("customerPhone", "")).strip()
        customer_email = str(body.get("customerEmail", "")).strip()
        customer_location = str(body.get("customerLocation", "")).strip()
        customer_notes = str(body.get("customerNotes", "")).strip()
        payment_method = str(body.get("paymentMethod", "cash on delivery")).strip()
        items = body.get("items", [])
        total = float(body.get("total", 0))

        if not customer_name or not customer_phone or not customer_email or not customer_location or not items:
            self.send_json(400, {"error": "Missing customer details or order items."})
            return

        orders = read_orders()
        order = {
            "id": f"ORD-{int(datetime.now().timestamp() * 1000)}",
            "createdAt": datetime.now().isoformat(),
            "customerName": customer_name,
            "customerPhone": customer_phone,
            "customerEmail": customer_email,
            "customerLocation": customer_location,
            "customerNotes": customer_notes,
            "paymentMethod": payment_method,
            "items": items,
            "total": total,
        }

        orders.append(order)
        write_orders(orders)
        self.send_json(201, {"order": order})

    def log_message(self, format_string, *args):
        return


if __name__ == "__main__":
    ensure_orders_file()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), AppHandler)
    print(f"Athimni website running at http://127.0.0.1:{PORT}")
    server.serve_forever()
