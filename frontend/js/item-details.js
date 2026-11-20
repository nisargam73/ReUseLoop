const detailsContent = document.getElementById("details-content");

const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatPrice(item) {
    const type = String(item.listing_type || "").toLowerCase();

    if (type === "donation") return "Free";
    if (type === "exchange") return "Exchange";

    if (item.price === null || item.price === undefined || item.price === "") {
        return "Price not specified";
    }

    return "₹" + Number(item.price).toLocaleString("en-IN");
}

function showItem(item) {
    const title = escapeHTML(item.title || "Untitled item");
    const description = escapeHTML(item.description || "No description provided.");
    const condition = escapeHTML(item.item_condition || "Not specified");
    const city = escapeHTML(item.city || "Location not specified");
    const listingType = escapeHTML(item.listing_type || "Not specified");
    const status = escapeHTML(item.status || "Available");

    let imageHTML = '<div class="image-placeholder">♻</div>';

    if (item.image_url) {
        const imageURL = item.image_url.startsWith("http")
            ? item.image_url
            : item.image_url.startsWith("/")
                ? item.image_url
                : "/" + item.image_url;

        imageHTML = `
            <img
                src="${escapeHTML(imageURL)}"
                alt="${title}"
                onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=&quot;image-placeholder&quot;>♻</div>';"
            >
        `;
    }

    detailsContent.innerHTML = `
        <section class="details-card">
            <div class="image-box">
                ${imageHTML}
            </div>

            <div class="item-info">
                <span class="item-type">${listingType}</span>

                <h1>${title}</h1>

                <div class="price">${formatPrice(item)}</div>

                <p class="description">${description}</p>

                <div class="info-list">
                    <div class="info-row">
                        <span>Condition</span>
                        <span>${condition}</span>
                    </div>

                    <div class="info-row">
                        <span>Location</span>
                        <span>${city}</span>
                    </div>

                    <div class="info-row">
                        <span>Listing type</span>
                        <span>${listingType}</span>
                    </div>

                    <div class="info-row">
                        <span>Status</span>
                        <span>${status}</span>
                    </div>

                    <div class="info-row">
                        <span>Item ID</span>
                        <span>#${escapeHTML(item.item_id)}</span>
                    </div>
                </div>

                <a
    class="contact-button"
    href="/pages/messages.html?item_id=${item.item_id}&seller_id=${item.owner_id}"
>
    💬 Contact Seller
</a>
            </div>
        </section>
    `;
}

async function loadItemDetails() {
    if (!itemId || !/^\d+$/.test(itemId)) {
        detailsContent.innerHTML = `
            <div class="status-message">
                <h2>Invalid item</h2>
                <p>Please select an item from Browse Items.</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`/items/${itemId}`);

        if (!response.ok) {
            throw new Error(
                response.status === 404
                    ? "This item could not be found."
                    : "Unable to load item details."
            );
        }

        const item = await response.json();
        showItem(item);

    } catch (error) {
        console.error("Item details error:", error);

        detailsContent.innerHTML = `
            <div class="status-message">
                <h2>Unable to load item</h2>
                <p>${escapeHTML(error.message)}</p>
                <p>Please check your internet connection and try again.</p>
                <a href="/pages/browse.html">Return to Browse Items</a>
            </div>
        `;
    }
}

loadItemDetails();
