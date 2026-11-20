
// =======================================
// ReUseLoop - Search, Filter, Display, Delete
// =======================================

const API_URL = "http://127.0.0.1:8000";

const container = document.getElementById("items-container");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resetButton = document.getElementById("reset-search");
const message = document.getElementById("search-message");

const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");
const sortFilter = document.getElementById("sort-filter");
const applyFiltersButton = document.getElementById("apply-filters");
const clearFiltersButton = document.getElementById("clear-filters");

let allItems = [];

// Load available items
async function loadItems() {
    await fetchAndDisplayItems(`${API_URL}/items`);
}

// Search items
async function searchItems(keyword) {
    await fetchAndDisplayItems(
        `${API_URL}/items/search?q=${encodeURIComponent(keyword)}`
    );
}

// Fetch items from the backend
async function fetchAndDisplayItems(url) {
    container.textContent = "Loading items...";
    message.textContent = "";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const items = await response.json();

        if (!Array.isArray(items)) {
            throw new Error("Invalid item list received from backend.");
        }

        allItems = items;
        applyFilters();

    } catch (error) {
        console.error("Loading error:", error);

        container.textContent =
            "Unable to load items. Please check the backend.";

        message.textContent = error.message;
    }
}

// Apply category, type and sorting filters
function applyFilters() {
    let filteredItems = [...allItems];

    const category = categoryFilter?.value || "";
    const type = typeFilter?.value || "";
    const sortOption = sortFilter?.value || "default";

    if (category !== "") {
        filteredItems = filteredItems.filter(
            item => String(item.category_id) === String(category)
        );
    }

    if (type !== "") {
        filteredItems = filteredItems.filter(
            item =>
                String(item.listing_type).toLowerCase() ===
                String(type).toLowerCase()
        );
    }

    if (sortOption === "price-low") {
        filteredItems.sort(
            (a, b) => Number(a.price || 0) - Number(b.price || 0)
        );
    } else if (sortOption === "price-high") {
        filteredItems.sort(
            (a, b) => Number(b.price || 0) - Number(a.price || 0)
        );
    } else if (sortOption === "title") {
        filteredItems.sort(
            (a, b) => (a.title || "").localeCompare(b.title || "")
        );
    }

    displayItems(filteredItems);

    message.textContent = `${filteredItems.length} item(s) found.`;
}

// Display item cards
function displayItems(items) {
    container.replaceChildren();

    if (items.length === 0) {
        container.textContent = "No matching items found.";
        return;
    }

    items.forEach(item => {
        const card = document.createElement("article");
        card.className = "item-card";

        // Item photo
        const photo = document.createElement("img");
        photo.className = "item-card-image";
        photo.alt = item.title || "Item photo";
        photo.loading = "lazy";

        if (item.image_url) {
            photo.src = item.image_url.startsWith("http")
                ? item.image_url
                : `${API_URL}${item.image_url}`;

            photo.onerror = () => {
                photo.onerror = null;
                photo.src =
                    "https://placehold.co/400x250?text=No+Photo";
            };
        } else {
            photo.src =
                "https://placehold.co/400x250?text=No+Photo";
        }

        // Item title
        const title = document.createElement("h3");
        title.textContent = item.title || "Untitled item";

        // Description
        const description = document.createElement("p");
        description.textContent =
            item.description || "No description available.";

        // Condition
        const condition = document.createElement("p");
        condition.textContent =
            `Condition: ${item.item_condition || "Not specified"}`;

        // Listing type
        const type = document.createElement("p");
        type.textContent = `Type: ${item.listing_type || "Not specified"}`;

        // Price
        const price = document.createElement("p");

        if (
            String(item.listing_type).toLowerCase() === "sale" &&
            item.price !== null &&
            item.price !== undefined
        ) {
            price.textContent =
                `Price: ₹${Number(item.price).toLocaleString("en-IN")}`;
        } else {
            price.textContent = item.listing_type || "";
        }

        // Location
        const city = document.createElement("p");
        city.textContent = `Location: ${item.city || "Not specified"}`;

        // Availability
        const status = document.createElement("span");
        status.className = "item-status";
        status.textContent = item.status || "Available";

        // View Details button
        const detailsLink = document.createElement("a");
        detailsLink.className = "details-button";
        detailsLink.textContent = "View Details";
        detailsLink.href =
            `item-details.html?id=${encodeURIComponent(item.item_id)}`;

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-item-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            const confirmed = window.confirm(
                `Are you sure you want to delete "${item.title}"?`
            );

            if (!confirmed) {
                return;
            }

            await deleteItem(item.item_id, deleteButton);
        });

        // Add every element only once
        card.append(
            photo,
            title,
            description,
            condition,
            type,
            price,
            city,
            status,
            detailsLink,
            deleteButton
        );

        container.appendChild(card);
    });
}

// Delete an item using the backend
async function deleteItem(itemId, button) {
    try {
        button.disabled = true;
        button.textContent = "Deleting...";

        const response = await fetch(
            `${API_URL}/items/${encodeURIComponent(itemId)}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            throw new Error(
                errorData.detail || `Delete failed: ${response.status}`
            );
        }

        message.textContent = "Item deleted successfully.";

        await loadItems();

    } catch (error) {
        console.error("Delete error:", error);

        alert(
            "Unable to delete this item. " +
            "Check whether the backend has a DELETE endpoint.\n\n" +
            error.message
        );

        button.disabled = false;
        button.textContent = "Delete";
    }
}

// Search form
searchForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const keyword = searchInput.value.trim();

    if (keyword === "") {
        await loadItems();
    } else {
        await searchItems(keyword);
    }
});

// Reset search
resetButton?.addEventListener("click", async () => {
    searchInput.value = "";
    await loadItems();
});

// Apply filters
applyFiltersButton?.addEventListener("click", applyFilters);

// Clear filters
clearFiltersButton?.addEventListener("click", async () => {
    if (categoryFilter) categoryFilter.value = "";
    if (typeFilter) typeFilter.value = "";
    if (sortFilter) sortFilter.value = "default";

    if (searchInput) searchInput.value = "";

    await loadItems();
});

// Load items when the page opens
loadItems();

