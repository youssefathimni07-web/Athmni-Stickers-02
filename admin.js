const ordersList = document.getElementById("orders-list");
const ordersStatus = document.getElementById("orders-status");
const refreshOrdersButton = document.getElementById("refresh-orders");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function setStatus(message) {
  ordersStatus.textContent = message;
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = `
      <article class="ai-panel">
        <h2>No orders yet</h2>
        <p class="ai-note">When customers submit orders, they will appear here.</p>
      </article>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  orders
    .slice()
    .reverse()
    .forEach((order) => {
      const article = document.createElement("article");
      article.className = "ai-panel admin-order-card";
      article.innerHTML = `
        <div class="admin-order-head">
          <h2>${escapeHtml(order.id)}</h2>
          <span class="summary-pill">${formatMoney(order.total)}</span>
        </div>
        <p class="ai-note">Created: ${escapeHtml(new Date(order.createdAt).toLocaleString())}</p>
        <p><strong>Name:</strong> ${escapeHtml(order.customerName)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</p>
        <p><strong>Gmail:</strong> ${escapeHtml(order.customerEmail)}</p>
        <p><strong>Location:</strong> ${escapeHtml(order.customerLocation)}</p>
        <p><strong>Payment:</strong> ${escapeHtml(order.paymentMethod)}</p>
        <p><strong>Notes:</strong> ${escapeHtml(order.customerNotes || "No notes")}</p>
        <div class="admin-order-items">
          ${order.items
            .map(
              (item) => `
                <div class="cart-item">
                  <div>
                    <p class="cart-item-title">${escapeHtml(item.name)}</p>
                    <p class="cart-item-meta">${escapeHtml(item.id)}</p>
                  </div>
                  <span class="cart-item-price">${formatMoney(item.price)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      `;
      fragment.appendChild(article);
    });

  ordersList.replaceChildren(fragment);
}

async function loadOrders() {
  setStatus("Loading orders...");

  try {
    const response = await fetch("/api/orders");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load orders.");
    }

    renderOrders(data.orders || []);
    setStatus(`Loaded ${data.orders.length} order(s).`);
  } catch (error) {
    ordersList.innerHTML = `
      <article class="ai-panel">
        <h2>Could not load orders</h2>
        <p class="ai-note">${error.message}</p>
      </article>
    `;
    setStatus("Orders request failed.");
  }
}

refreshOrdersButton.addEventListener("click", loadOrders);

loadOrders();
