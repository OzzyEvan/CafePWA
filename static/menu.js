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

// Safety check: are the containers found?
console.log("Containers:", {
  breakfast: breakfastContainer,
  lunch: lunchContainer,
  drinks: drinksContainer
});

// Load menu items from Flask
fetch("http://127.0.0.1:5050/menu")
  .then(res => res.json())
  .then(data => {
    console.log("Menu data from Flask:", data);

    const items = data.menu;  // matches return jsonify({"menu": menu})

    items.forEach(item => {
      let target;

      if (item.Category === "Breakfast") {
        target = breakfastContainer;
      } else if (item.Category === "Lunch") {
        target = lunchContainer;
      } else if (item.Category === "Drinks" || item.Category === "Drink") {
        target = drinksContainer;
      } else {
        target = breakfastContainer; // fallback
      }

      const card = document.createElement("article");
      card.className = "menu-item";
      card.innerHTML = `
        <div class="menu-thumb">
          <img src="/static/images/${item.ImageFile}" alt="${item.ItemName}">
        </div>
        <div class="menu-info">
          <h3>${item.ItemName}</h3>
          <p class="desc">${item.ItemDescription}</p>
          <div class="menu-actions">
            <span class="price">$${Number(item.Price).toFixed(2)}</span>
            <div class="qty-controls">
              <button class="qty-btn minus-btn" type="button">−</button>
              <input type="number" class="qty-input" value="1" min="1" max="99">
              <button class="qty-btn plus-btn" type="button">+</button>
            </div>
            <button class="add-btn">Add</button>
          </div>
        </div>
      `;

      // Get elements from this card
      const addButton = card.querySelector(".add-btn");
      const qtyInput = card.querySelector(".qty-input");
      const minusBtn = card.querySelector(".minus-btn");
      const plusBtn = card.querySelector(".plus-btn");

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
      }
    });
  })
  .catch(err => {
    console.error("Error loading menu:", err);
    if (breakfastContainer) {
      breakfastContainer.innerHTML = "<p>Unable to load menu items.</p>";
    }
  });

// Initialize cart badge on page load
updateCartBadge();