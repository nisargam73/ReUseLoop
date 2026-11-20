// ========================================
// ReUseLoop - Repair Directory
// ========================================

// Sample data for the project demonstration.
// These are not verified real businesses.

const enquirySection = document.getElementById("enquiry-section");
const selectedService = document.getElementById("selected-service");
const enquiryForm = document.getElementById("repair-enquiry-form");
const enquiryStatus = document.getElementById("enquiry-status");

let currentRepairService = null;

const repairServices = [
    {
        id: 1,
        name: "Electronics Care Centre",
        category: "Electronics",
        icon: "💻",
        description: "Basic troubleshooting and repair of laptops and computers.",
        location: "Mysuru",
        price: "₹300 onwards",
        phone: ""
    },
    {
        id: 2,
        name: "Mobile Repair Service",
        category: "Electronics",
        icon: "📱",
        description: "Mobile diagnostics and common hardware repair services.",
        location: "Mysuru",
        price: "₹200 onwards",
        phone: ""
    },
    {
        id: 3,
        name: "Clothing Repair Studio",
        category: "Clothing",
        icon: "🧵",
        description: "Clothing alterations, stitching, and minor fabric repairs.",
        location: "Mysuru",
        price: "₹100 onwards",
        phone: ""
    },
    {
        id: 4,
        name: "Furniture Fix Workshop",
        category: "Furniture",
        icon: "🪑",
        description: "Basic furniture maintenance and wooden item repairs.",
        location: "Mysuru",
        price: "₹400 onwards",
        phone: ""
    },
    {
        id: 5,
        name: "Bicycle Repair Point",
        category: "Bicycle",
        icon: "🚲",
        description: "Bicycle puncture repairs, brake adjustments, and servicing.",
        location: "Mysuru",
        price: "₹100 onwards",
        phone: ""
    },
    {
        id: 6,
        name: "Home Appliance Service",
        category: "Home Appliances",
        icon: "🔌",
        description: "Initial diagnosis for common household appliance problems.",
        location: "Mysuru",
        price: "₹300 onwards",
        phone: ""
    }
];

const repairContainer = document.getElementById("repair-container");
const repairMessage = document.getElementById("repair-message");
const repairCount = document.getElementById("repair-count");

const repairSearchForm = document.getElementById("repair-search-form");
const repairSearchInput = document.getElementById("repair-search-input");
const repairCategory = document.getElementById("repair-category");


// Display repair service cards
function displayRepairServices(services) {
    repairContainer.replaceChildren();

    repairCount.textContent = `${services.length} service(s) found`;

    if (services.length === 0) {
        repairMessage.textContent = "";

        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent =
            "No matching services found. Try another keyword or category.";

        repairContainer.appendChild(emptyState);
        return;
    }

    repairMessage.textContent = "Browse the available sample services below.";

    services.forEach(service => {
        const card = document.createElement("article");
        card.className = "repair-card";

        const icon = document.createElement("div");
        icon.className = "repair-icon";
        icon.textContent = service.icon;

        const category = document.createElement("span");
        category.className = "repair-category";
        category.textContent = service.category;

        const title = document.createElement("h3");
        title.textContent = service.name;

        const description = document.createElement("p");
        description.className = "repair-description";
        description.textContent = service.description;

        const info = document.createElement("div");
        info.className = "repair-info";

        const location = document.createElement("p");
        location.textContent = `📍 Location: ${service.location}`;

        const price = document.createElement("p");
        price.className = "repair-price";
        price.textContent = `Estimated cost: ${service.price}`;

        const contact = document.createElement("button");

contact.type = "button";
contact.className = "repair-contact";
contact.textContent = "Enquire About Service";

contact.addEventListener("click", () => {
    currentRepairService = service;

    selectedService.textContent =
        `Service: ${service.name} | Category: ${service.category}`;

    enquiryStatus.textContent = "";
    enquirySection.hidden = false;

    enquirySection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});
        info.append(location, price);
        card.append(icon, category, title, description, info, contact);

        repairContainer.appendChild(card);
    });
}


// Search by service name, description, category, or location
function filterRepairServices() {
    const keyword = repairSearchInput.value.trim().toLowerCase();
    const selectedCategory = repairCategory.value.toLowerCase();

    const filteredServices = repairServices.filter(service => {
        const searchableText = [
            service.name,
            service.category,
            service.description,
            service.location
        ].join(" ").toLowerCase();

        const matchesKeyword = searchableText.includes(keyword);

        const matchesCategory =
            selectedCategory === "" ||
            service.category.toLowerCase() === selectedCategory;

        return matchesKeyword && matchesCategory;
    });

    displayRepairServices(filteredServices);
}


// Handle the search form
repairSearchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    filterRepairServices();
});


// Update results when category changes
repairCategory.addEventListener("change", filterRepairServices);


// Show all services initially
displayRepairServices(repairServices);

enquiryForm.addEventListener("submit", function(event) {
    event.preventDefault();

    if (!currentRepairService) {
        enquiryStatus.textContent = "Please select a repair service.";
        return;
    }

    const name = document.getElementById("enquiry-name").value.trim();
    const email = document.getElementById("enquiry-email").value.trim();
    const message = document.getElementById("enquiry-message").value.trim();

    const subject = `Repair Enquiry - ${currentRepairService.name}`;

    const body =
        `Hello,\n\n` +
        `I would like to enquire about your repair service.\n\n` +
        `Service: ${currentRepairService.name}\n` +
        `Category: ${currentRepairService.category}\n` +
        `Customer name: ${name}\n` +
        `Customer email: ${email}\n\n` +
        `Message:\n${message}\n`;

    const mailtoLink =
        `mailto:?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

    enquiryStatus.textContent =
        "Opening your default email application...";

    window.location.href = mailtoLink;
});

document.getElementById("cancel-enquiry").addEventListener("click", () => {
    enquirySection.hidden = true;
    currentRepairService = null;
});