// ---------- Checkout Page Logic ----------
const CART_KEY = "ESCafeCoCart";

function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
}

// Update cart badge with total item count
function updateCartBadge() {
  const cart = loadCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// Remove item from cart
function removeFromCart(menuItemId) {
  let cart = loadCart();
  cart = cart.filter(item => item.MenuItemID !== menuItemId);
  saveCart(cart);
  updateCartBadge();
  renderCart();
}

// Update item quantity
function updateQuantity(menuItemId, newQty) {
  const cart = loadCart();
  const item = cart.find(entry => entry.MenuItemID === menuItemId);
  
  if (item) {
    if (newQty <= 0) {
      removeFromCart(menuItemId);
    } else {
      item.qty = newQty;
      saveCart(cart);
      updateCartBadge();
      renderCart();
    }
  }
}

// Get references to page elements
const rowsBody   = document.getElementById("order-rows");
const totalSpan  = document.getElementById("order-total");
const messageP   = document.getElementById("order-message");
const form       = document.getElementById("order-form");
const nameInput  = document.getElementById("customer-name");
const emailInput = document.getElementById("customer-email");
const timeInput  = document.getElementById("pickup-time");

// Render cart contents
function renderCart() {
  const cart = loadCart();
  rowsBody.innerHTML = '';

  if (!cart || cart.length === 0) {
    rowsBody.innerHTML = "<tr><td colspan='5'>Your cart is empty.</td></tr>";
    form.style.display = "none";
    totalSpan.textContent = "0.00";
    return;
  }

  form.style.display = "block";
  let total = 0;

  cart.forEach(item => {
    const subtotal = item.Price * item.qty;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.ItemName}</td>
      <td>
        <div class="cart-qty-controls">
          <button class="qty-btn-small minus-btn" data-id="${item.MenuItemID}" type="button">−</button>
          <input type="number" class="qty-input-small" value="${item.qty}" min="1" max="99" data-id="${item.MenuItemID}">
          <button class="qty-btn-small plus-btn" data-id="${item.MenuItemID}" type="button">+</button>
        </div>
      </td>
      <td>$${item.Price.toFixed(2)}</td>
      <td>$${subtotal.toFixed(2)}</td>
      <td>
        <button class="remove-btn" data-id="${item.MenuItemID}" type="button">Remove</button>
      </td>
    `;
    rowsBody.appendChild(tr);
  });

  totalSpan.textContent = total.toFixed(2);

  // Add event listeners to quantity controls
  document.querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      const item = cart.find(i => i.MenuItemID === id);
      if (item && item.qty > 1) {
        updateQuantity(id, item.qty - 1);
      }
    });
  });

  document.querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      const item = cart.find(i => i.MenuItemID === id);
      if (item && item.qty < 99) {
        updateQuantity(id, item.qty + 1);
      }
    });
  });

  document.querySelectorAll('.qty-input-small').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      let newQty = parseInt(e.target.value);
      
      if (isNaN(newQty) || newQty < 1) {
        newQty = 1;
      } else if (newQty > 99) {
        newQty = 99;
      }
      
      updateQuantity(id, newQty);
    });
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      if (confirm('Remove this item from your cart?')) {
        removeFromCart(id);
      }
    });
  });
}

// Initial render
renderCart();
updateCartBadge();

// When the form is submitted, send the order to Flask
form.addEventListener("submit", event => {
  event.preventDefault();

  const cart = loadCart();
  if (!cart || cart.length === 0) {
    messageP.textContent = "Your cart is empty!";
    return;
  }

  const orderData = {
    customerName: nameInput.value.trim(),
    customerEmail: emailInput.value.trim(),
    pickupTime: timeInput.value,
    items: cart
  };

  fetch("http://127.0.0.1:5050/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  })
    .then(res => res.json())
    .then(data => {
      localStorage.setItem("lastOrderName", nameInput.value.trim());
      localStorage.setItem("lastOrderTime", timeInput.value);
      clearCart();
      window.location.href = "/templates/thanks.html";
    })
    .catch(() => {
      messageP.textContent = "Could not place order. Is Flask running?";
    });
});