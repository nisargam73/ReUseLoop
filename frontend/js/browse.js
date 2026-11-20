// =============================================
// ReUseLoop - Browse Items
// Database Connected Marketplace
// =============================================

const API_URL = "";

const itemsContainer = document.getElementById("browse-items");
const browseCount = document.getElementById("browse-count");

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-btn");

const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");
const conditionFilter = document.getElementById("condition-filter");
const sortFilter = document.getElementById("sort-filter");

const clearButton = document.getElementById("clear-filters");

let allItems = [];


// =============================================
// CATEGORY NAMES
// =============================================

const categories = {
    1: "Electronics",
    2: "Books",
    3: "Clothing",
    4: "Furniture",
    5: "Home Appliances",
    6: "Sports",
    7: "Other"
};


// =============================================
// CATEGORY EMOJIS
// =============================================

function getCategoryEmoji(categoryId) {

    const emojis = {
        1: "📱",
        2: "📚",
        3: "👕",
        4: "🪑",
        5: "🏠",
        6: "⚽",
        7: "♻️"
    };

    return emojis[categoryId] || "♻️";
}


// =============================================
// LOAD ITEMS FROM DATABASE
// =============================================

async function loadItems() {

    itemsContainer.innerHTML = `
        <div class="loading-state">
            Loading available products...
        </div>
    `;

    try {

        const response = await fetch(`${API_URL}/items`);

        if (!response.ok) {
            throw new Error("Unable to retrieve products.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid response received from server.");
        }

        allItems = data;

        applyFilters();

    }

    catch (error) {

        console.error("Browse Error:", error);

        browseCount.textContent = "Unable to load items";

        itemsContainer.innerHTML = `
            <div class="error-state">

                <h3>Unable to Load Products</h3>

                <p>
                    Please check whether the ReUseLoop backend
                    server is running.
                </p>

                <button class="retry-btn" onclick="loadItems()">
                    Try Again
                </button>

            </div>
        `;
    }
}


// =============================================
// IMAGE URL
// =============================================

function getImageURL(imageURL) {

    if (!imageURL) {
        return null;
    }

    if (
        imageURL.startsWith("http://") ||
        imageURL.startsWith("https://")
    ) {
        return imageURL;
    }

    return `${API_URL}${imageURL.startsWith("/") ? "" : "/"}${imageURL}`;
}


// =============================================
// FILTER ITEMS
// =============================================

function applyFilters() {

    const search = searchInput.value.trim().toLowerCase();

    const category = categoryFilter.value;
    const type = typeFilter.value;
    const condition = conditionFilter.value;
    const sort = sortFilter.value;

    let filteredItems = allItems.filter(item => {

        const title = (item.title || "").toLowerCase();

        const description =
            (item.description || "").toLowerCase();

        const city = (item.city || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            description.includes(search) ||
            city.includes(search);

        const matchesCategory =
            !category ||
            String(item.category_id) === category;

        const matchesType =
            !type ||
            item.listing_type === type;

        const matchesCondition =
            !condition ||
            item.item_condition === condition;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesType &&
            matchesCondition
        );

    });


    // =========================================
    // SORTING
    // =========================================

    if (sort === "low") {

        filteredItems.sort(
            (a, b) => Number(a.price || 0) - Number(b.price || 0)
        );

    }

    else if (sort === "high") {

        filteredItems.sort(
            (a, b) => Number(b.price || 0) - Number(a.price || 0)
        );

    }

    else if (sort === "name") {

        filteredItems.sort(
            (a, b) => (a.title || "").localeCompare(b.title || "")
        );

    }

    else {

        filteredItems.sort(
            (a, b) => Number(b.item_id) - Number(a.item_id)
        );

    }


    renderItems(filteredItems);

}


// =============================================
// RENDER PRODUCT CARDS
// =============================================

function renderItems(items) {

    browseCount.textContent =
        `${items.length} product${items.length !== 1 ? "s" : ""} found`;

    itemsContainer.replaceChildren();


    if (items.length === 0) {

        itemsContainer.innerHTML = `
            <div class="empty-state">

                <h3>No Products Found 🔍</h3>

                <p>
                    We couldn't find any products matching your search.
                </p>

                <p>
                    Try changing your search or filters.
                </p>

            </div>
        `;

        return;
    }


    items.forEach(item => {

        const card = document.createElement("article");

        card.className = "product-card";


        // IMAGE

        const imageBox = document.createElement("div");

        imageBox.className = "product-image";

        const imageURL = getImageURL(item.image_url);

        if (imageURL) {

            const img = document.createElement("img");

            img.src = imageURL;

            img.alt = item.title || "Product image";

            img.loading = "lazy";

            img.onerror = function () {

                this.remove();

                const placeholder = document.createElement("div");

                placeholder.className = "product-placeholder";

                placeholder.textContent =
                    getCategoryEmoji(item.category_id);

                imageBox.prepend(placeholder);

            };

            imageBox.appendChild(img);

        }

        else {

            const placeholder = document.createElement("div");

            placeholder.className = "product-placeholder";

            placeholder.textContent =
                getCategoryEmoji(item.category_id);

            imageBox.appendChild(placeholder);

        }


        // LISTING TYPE

        const badge = document.createElement("span");

        badge.className = "product-type";

        badge.textContent = item.listing_type || "Available";

        imageBox.appendChild(badge);


        // CONTENT

        const content = document.createElement("div");

        content.className = "product-content";


        const title = document.createElement("h3");

        title.textContent = item.title || "Untitled Item";


        const description = document.createElement("p");

        description.className = "product-description";

        description.textContent =
            item.description || "No description available.";


        // CONDITION AND CATEGORY

        const meta = document.createElement("div");

        meta.className = "product-meta";

        const condition = document.createElement("span");

        condition.textContent =
            item.item_condition || "Condition unavailable";

        const category = document.createElement("span");

        category.textContent =
            categories[item.category_id] || "Other";


        meta.append(condition, category);


        // PRICE

        const price = document.createElement("div");

        price.className = "product-price";

        if (item.listing_type === "Sale") {

            price.textContent =
                item.price != null
                    ? `₹${Number(item.price).toLocaleString("en-IN")}`
                    : "Price unavailable";

        }

        else if (item.listing_type === "Exchange") {

            price.textContent = "Exchange Available";

        }

        else {

            price.textContent = "Free Donation";

        }


        // LOCATION

        const location = document.createElement("div");

        location.className = "product-location";

        location.textContent =
            `📍 ${item.city || "Location unavailable"}`;


        // DETAILS BUTTON

        const detailsButton = document.createElement("a");

        detailsButton.className = "details-btn";

        detailsButton.href =
            `/item-details.html?id=${encodeURIComponent(item.item_id)}`;

        detailsButton.textContent = "View Details →";


        // APPEND

        content.append(
            title,
            description,
            meta,
            price,
            location,
            detailsButton
        );

        card.append(imageBox, content);

        itemsContainer.appendChild(card);

    });

}


// =============================================
// SEARCH
// =============================================

searchButton.addEventListener("click", applyFilters);

searchInput.addEventListener("input", applyFilters);

searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        event.preventDefault();

        applyFilters();

    }

});


// =============================================
// FILTER EVENTS
// =============================================

categoryFilter.addEventListener("change", applyFilters);

typeFilter.addEventListener("change", applyFilters);

conditionFilter.addEventListener("change", applyFilters);

sortFilter.addEventListener("change", applyFilters);


// =============================================
// CLEAR FILTERS
// =============================================

clearButton.addEventListener("click", () => {

    searchInput.value = "";

    categoryFilter.value = "";

    typeFilter.value = "";

    conditionFilter.value = "";

    sortFilter.value = "newest";

    applyFilters();

});


// =============================================
// INITIALIZE
// =============================================

loadItems();