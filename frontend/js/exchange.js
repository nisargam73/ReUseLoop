const API_URL = "http://127.0.0.1:8000";

const container = document.getElementById("exchange-items-container");
const message = document.getElementById("exchange-message");
const searchForm = document.getElementById("exchange-search-form");
const searchInput = document.getElementById("exchange-search-input");

let exchangeItems = [];

async function loadExchangeItems(keyword = "") {
message.textContent = "Loading exchange items...";
container.replaceChildren();

try {
    let url = `${API_URL}/items`;

    if (keyword.trim()) {
        url = `${API_URL}/items/search?q=${encodeURIComponent(keyword.trim())}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }

    const items = await response.json();

    exchangeItems = items.filter(item =>
        String(item.listing_type).toLowerCase() === "exchange" &&
        String(item.status).toLowerCase() === "available"
    );

    displayExchangeItems(exchangeItems);

} catch (error) {
    console.error("Exchange page error:", error);

    message.textContent =
        "Unable to load items. Check that the ReUseLoop backend is running.";
}

}

function displayExchangeItems(items) {
container.replaceChildren();

if (items.length === 0) {
    message.textContent =
        "No exchange items found. Be the first to list an item for exchange!";

    const link = document.createElement("a");
    link.href = "../add-item.html";
    link.className = "exchange-button";
    link.textContent = "List an Item";

    container.appendChild(link);
    return;
}

message.textContent = `${items.length} exchange item(s) available.`;

items.forEach(item => {
    const card = document.createElement("article");
    card.className = "exchange-card";

    const badge = document.createElement("span");
    badge.className = "exchange-badge";
    badge.textContent = "Available for Exchange";

    const title = document.createElement("h3");
    title.textContent = item.title || "Untitled item";

    const description = document.createElement("p");
    description.textContent =
        item.description || "No description available.";

    const condition = document.createElement("p");
    condition.textContent =
        `Condition: ${item.item_condition || "Not specified"}`;

    const city = document.createElement("p");
    city.textContent = `Location: ${item.city || "Not specified"}`;

    const details = document.createElement("a");
    details.className = "exchange-button";
    details.href =
        `../item-details.html?id=${encodeURIComponent(item.item_id)}`;
    details.textContent = "View Details";

    card.append(
        badge,
        title,
        description,
        condition,
        city,
        details
    );

    container.appendChild(card);
});

}

searchForm.addEventListener("submit", event => {
event.preventDefault();
loadExchangeItems(searchInput.value);
});

loadExchangeItems();
