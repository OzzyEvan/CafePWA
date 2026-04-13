console.log("menu.js loaded");

// --------- Simple Cart Storage (localStorage) ---------
const CART_KEY = "ESCafeCoCart";

// Load the cart array from localStorage (or return an empty array)
function loadCart() {
  const stored = localStorage.getItem(CART_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save the cart array back into localStorage
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Add an item to the cart with specified quantity
function addToCart(item, qty) {
  const cart = loadCart();

  // Look for an existing entry with the same MenuItemID
  const existing = cart.find(entry => entry.MenuItemID === item.MenuItemID);

  if (existing) {
    existing.qty += qty;  // increase by specified quantity
  } else {
    cart.push({
      MenuItemID: item.MenuItemID,
      ItemName: item.ItemName,
      Price: item.Price,
      qty: qty
    });
  }

  saveCart(cart);
  updateCartBadge();
  console.log(`${item.ItemName} (x${qty}) added to cart`, cart);
}

// Update cart badge with total item count
function updateCartBadge() {
  const cart = loadCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  
  // Find all cart badges and update them
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

// Containers for each category
const breakfastContainer = document.getElementById("menu-breakfast");
const lunchContainer     = document.getElementById("menu-lunch");
const drinksContainer    = document.getElementById("menu-drinks");
const specialContainer   = document.getElementById("menu-special");  // FIXED: removed duplicate "Container"

// Safety check: are the containers found?
console.log("Containers:", {
  breakfast: breakfastContainer,
  lunch: lunchContainer,
  drinks: drinksContainer,
  special: specialContainer
});

// Function to render a menu item (extracted for reuse)
function renderMenuItem(item) {
  let target;

  if (item.Category === "Breakfast") {
    target = breakfastContainer;
  } else if (item.Category === "Lunch") {
    target = lunchContainer;
  } else if (item.Category === "Drinks" || item.Category === "Drink") {
    target = drinksContainer;
  } else if (item.Category === "Specials" || item.Category === "Special") {  // FIXED: Added "Special" as alternative
    target = specialContainer;
  } else {
    target = breakfastContainer; // fallback
  }

  // Log to help debug
  console.log(`Rendering item: ${item.ItemName}, Category: ${item.Category}, Target:`, target);

  const card = document.createElement("article");
  card.className = "menu-item";

  // Thumb
  const thumb = document.createElement("div");
  thumb.className = "menu-thumb";
  const img = document.createElement("img");
  img.src = `/static/images/${item.ImageFile}`;
  img.alt = item.ItemName;
  thumb.appendChild(img);

  // Info
  const info = document.createElement("div");
  info.className = "menu-info";

  const h3 = document.createElement("h3");
  h3.textContent = item.ItemName;

  const desc = document.createElement("p");
  desc.className = "desc";
  desc.textContent = item.ItemDescription;

  // Actions
  const actions = document.createElement("div");
  actions.className = "menu-actions";

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = `$${Number(item.Price).toFixed(2)}`;

  const qtyControls = document.createElement("div");
  qtyControls.className = "qty-controls";

  const minusBtn = document.createElement("button");
  minusBtn.className = "qty-btn minus-btn";
  minusBtn.type = "button";
  minusBtn.textContent = "−";

  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.className = "qty-input";
  qtyInput.value = "1";
  qtyInput.min = "1";
  qtyInput.max = "99";

  const plusBtn = document.createElement("button");
  plusBtn.className = "qty-btn plus-btn";
  plusBtn.type = "button";
  plusBtn.textContent = "+";

  qtyControls.appendChild(minusBtn);
  qtyControls.appendChild(qtyInput);
  qtyControls.appendChild(plusBtn);

  const addButton = document.createElement("button");
  addButton.className = "add-btn";
  addButton.textContent = "Add";

  actions.appendChild(price);
  actions.appendChild(qtyControls);
  actions.appendChild(addButton);

  info.appendChild(h3);
  info.appendChild(desc);
  info.appendChild(actions);

  card.appendChild(thumb);
  card.appendChild(info);

  // Quantity controls
  minusBtn.addEventListener("click", () => {
    const currentVal = parseInt(qtyInput.value);
    if (currentVal > 1) {
      qtyInput.value = currentVal - 1;
    }
  });

  plusBtn.addEventListener("click", () => {
    const currentVal = parseInt(qtyInput.value);
    if (currentVal < 99) {
      qtyInput.value = currentVal + 1;
    }
  });

  // Validate input
  qtyInput.addEventListener("input", () => {
    let val = parseInt(qtyInput.value);
    if (isNaN(val) || val < 1) {
      qtyInput.value = 1;
    } else if (val > 99) {
      qtyInput.value = 99;
    }
  });

  // Add to cart with specified quantity
  addButton.addEventListener("click", () => {
    const qty = parseInt(qtyInput.value) || 1;

    addToCart(
      {
        MenuItemID: item.MenuItemID,
        ItemName: item.ItemName,
        Price: item.Price
      }, 
      qty
    );

    console.log(`Added to cart: ${item.ItemName} x${qty}`);

    // Reset quantity selector back to 1
    qtyInput.value = 1;

    // Visual feedback
    addButton.textContent = "Added!";
    setTimeout(() => {
      addButton.textContent = "Add";
    }, 1000);
  });

  if (target) {
    target.appendChild(card);
  } else {
    console.error(`No target container found for item: ${item.ItemName}`);
  }
}

// Load menu items from Flask
fetch("http://127.0.0.1:5050/menu")
  .then(res => res.json())
  .then(data => {
    console.log("Menu data from Flask:", data);

    const items = data.menu;  // matches return jsonify({"menu": menu})

    items.forEach(item => {
      renderMenuItem(item);
    });
  })
  .catch(err => {
    console.warn("API failed — loading offline menu instead:", err);

    fetch("/static/menu-offline.json")  // FIXED: Corrected path and filename
      .then(res => res.json())
      .then(data => {
        console.log("Offline menu data:", data);
        
        // Reuse the same rendering code used for the online menu
        const items = data.menu || data;
        items.forEach(item => {
          renderMenuItem(item);
        });
      })
      .catch(err => {
        console.error("Offline menu also failed:", err);
        if (breakfastContainer) {
          breakfastContainer.innerHTML =
            "<p>Unable to load menu items offline.</p>";
        }
      });
  });

// Initialize cart badge on page load
updateCartBadge();