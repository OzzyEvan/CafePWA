// ---------- Checkout Page Logic ----------
const CART_KEY = "cafeFiniganCart";

function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  return stored ? JSON.parse(stored) : [];
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
}

// Get references to page elements
const rowsBody   = document.getElementById("order-rows");
const totalSpan  = document.getElementById("order-total");
const messageP   = document.getElementById("order-message");
const form       = document.getElementById("order-form");
const nameInput  = document.getElementById("customer-name");
const emailInput = document.getElementById("customer-email");
const timeInput  = document.getElementById("pickup-time");

// Load cart and display it
const cart = loadCart();

if (!cart || cart.length === 0) {
  rowsBody.innerHTML = "<tr><td colspan='4'>Your cart is empty.</td></tr>";
  form.style.display = "none";   // hide form if nothing to order
  totalSpan.textContent = "0.00";
} else {
  let total = 0;

  cart.forEach(item => {
    const subtotal = item.Price * item.qty;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.ItemName}</td>
      <td>${item.qty}</td>
      <td>$${item.Price.toFixed(2)}</td>
      <td>$${subtotal.toFixed(2)}</td>
    `;
    rowsBody.appendChild(tr);
  });

  totalSpan.textContent = total.toFixed(2);
}