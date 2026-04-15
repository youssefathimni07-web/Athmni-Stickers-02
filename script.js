const products = [
  {
    id: "ultras-1",
    name: "Ultras L'Emkachkhines 02 Pack 1",
    price: 8,
    badge: "Pack 1",
    image: "images/sticker-1.jpeg",
    alt: "Stickers ultras l'emkachkhines 02 collage design 1",
    description: "stickers ultras l'emkachkhines 02",
  },
  {
    id: "ultras-2",
    name: "Ultras L'Emkachkhines 02 Pack 2",
    price: 8,
    badge: "Pack 2",
    image: "images/sticker-2.jpeg",
    alt: "Stickers ultras l'emkachkhines 02 collage design 2",
    description: "stickers ultras l'emkachkhines 02",
  },
  {
    id: "ultras-3",
    name: "Ultras L'Emkachkhines 02 Pack 3",
    price: 8,
    badge: "Pack 3",
    image: "images/sticker-3.jpeg",
    alt: "Stickers ultras l'emkachkhines 02 collage design 3",
    description: "stickers ultras l'emkachkhines 02",
  },
];

const productGrid = document.getElementById("product-grid");
const cardTemplate = document.getElementById("product-card-template");
const toast = document.getElementById("toast");
const productCount = document.getElementById("product-count");
const year = document.getElementById("year");
const cartList = document.getElementById("cart-list");
const cartTotal = document.getElementById("cart-total");
const checkoutForm = document.getElementById("checkout-form");
const formResult = document.getElementById("form-result");

let toastTimer;
const cart = [];

function formatPrice(amount) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function renderCart() {
  if (!cart.length) {
    cartList.innerHTML =
      '<p class="cart-empty">No stickers added yet. Tap "Add to Cart" on any pack to build the order.</p>';
    cartTotal.textContent = formatPrice(0);
    return;
  }

  const fragment = document.createDocumentFragment();

  cart.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "cart-item";
    card.innerHTML = `
      <div>
        <p class="cart-item-title">${item.name}</p>
        <p class="cart-item-meta">Pack ${index + 1} in your order</p>
      </div>
      <span class="cart-item-price">${formatPrice(item.price)}</span>
    `;
    fragment.appendChild(card);
  });

  cartList.replaceChildren(fragment);
  cartTotal.textContent = formatPrice(getCartTotal());
}

function addToCart(product) {
  cart.push(product);
  renderCart();
  showToast(`${product.name} added to your order`);
}

function handleImageError(event) {
  const image = event.currentTarget;
  image.alt = "Sticker image unavailable";
  image.src =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
        <rect width="600" height="600" rx="72" fill="#0d1728" />
        <rect x="54" y="54" width="492" height="492" rx="52" fill="#13233a" stroke="#29486f" />
        <text x="300" y="275" text-anchor="middle" fill="#9ec3ff" font-size="36" font-family="Arial, sans-serif">
          Image not found
        </text>
        <text x="300" y="330" text-anchor="middle" fill="#7f9abb" font-size="24" font-family="Arial, sans-serif">
          Update the image path in script.js
        </text>
      </svg>
    `);
}

function renderProducts() {
  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const badge = card.querySelector(".product-badge");
    const image = card.querySelector(".product-image");
    const title = card.querySelector(".product-title");
    const description = card.querySelector(".product-description");
    const price = card.querySelector(".product-price");
    const button = card.querySelector(".product-button");

    badge.textContent = product.badge;
    image.src = product.image;
    image.alt = product.alt;
    image.addEventListener("error", handleImageError, { once: true });
    title.textContent = product.name;
    description.textContent = product.description;
    price.textContent = formatPrice(product.price);

    button.addEventListener("click", () => {
      button.textContent = "Added";
      button.classList.add("is-added");
      addToCart(product);

      window.setTimeout(() => {
        button.textContent = "Add to Cart";
        button.classList.remove("is-added");
      }, 1500);
    });

    fragment.appendChild(card);
  });

  productGrid.replaceChildren(fragment);
  productCount.textContent = String(products.length);
}

renderProducts();
renderCart();
year.textContent = String(new Date().getFullYear());

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!cart.length) {
    formResult.textContent = "Add at least one sticker before confirming the order.";
    showToast("Please add a sticker before checkout");
    return;
  }

  const formData = new FormData(checkoutForm);
  const name = formData.get("customerName");
  const phone = formData.get("customerPhone");
  const email = formData.get("customerEmail");
  const location = formData.get("customerLocation");
  const notes = formData.get("customerNotes");
  const items = cart.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
  }));

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        customerLocation: location,
        customerNotes: notes,
        paymentMethod: "cash on delivery",
        items,
        total: getCartTotal(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Order request failed.");
    }

    formResult.textContent =
      `Order #${result.order.id} confirmed for ${name}. Payment method: cash on delivery. ` +
      `Phone: ${phone}. Gmail: ${email}. Location: ${location}.`;

    showToast("Order confirmed with cash on delivery");
    checkoutForm.reset();
    cart.length = 0;
    renderCart();
  } catch (error) {
    formResult.textContent = `Order could not be saved: ${error.message}`;
    showToast("Order request failed");
  }
});
