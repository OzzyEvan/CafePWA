// ---------- Checkout Page Logic ----------
const CART_KEY = "ESCafeCoCart";

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
  if (form) form.style.display = "none";
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

// Handle form submission
if (form) {
  form.addEventListener('submit', function(event) {
    event.preventDefault();  // CRITICAL: Prevents page refresh
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const time = timeInput.value;
    
    if (!name || !email || !time) {
      messageP.textContent = "⚠️ Please fill in all fields.";
      messageP.style.color = "red";
      return;
    }

    // Disable button to prevent double-submission
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    // Send order to Flask
    fetch("http://127.0.0.1:5050/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        customerEmail: email,
        pickupTime: time,
        items: cart
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Order response:", data);
      
      // Store details for thanks page
      localStorage.setItem("lastOrderName", name);
      localStorage.setItem("lastOrderTime", time);
      
      // Clear cart
      clearCart();
      
      // Redirect to thanks page
      window.location.href = "thanks.html";
    })
    .catch(err => {
      console.error("Order submission error:", err);
      messageP.textContent = "❌ Could not place order. Please try again.";
      messageP.style.color = "red";
      
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = "Place order";
    });
  });
}