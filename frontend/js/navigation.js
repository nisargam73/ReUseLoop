// ==========================================
// ReUseLoop - Shared Navigation
// ==========================================

const currentPage = window.location.pathname;

const navigationLinks = [
    {
        name: "Home",
        url: "/index.html"
    },
    {
        name: "Browse Items",
        url: "/pages/browse.html"
    },
    {
        name: "List an Item",
        url: "/add-item.html"
    },
    {
        name: "Exchange",
        url: "/pages/exchange.html"
    },
    {
        name: "Donations",
        url: "/pages/donations.html"
    },
    {
        name: "Repairs",
        url: "/pages/repairs.html"
    },
    {
        name: "Messages",
        url: "/pages/messages.html"
    },
    {
        name: "Impact",
        url: "/pages/impact.html"
    },
    {
        name: "Profile",
        url: "/pages/profile.html"
    }
];

function createNavigation() {
    const header = document.getElementById("site-header");

    if (!header) {
        return;
    }

    const nav = document.createElement("nav");
    nav.className = "main-navigation";

    const logo = document.createElement("a");
    logo.className = "brand-logo";
    logo.href = "/index.html";
    logo.textContent = "♻ ReUseLoop";

    const menu = document.createElement("div");
    menu.className = "navigation-links";

    navigationLinks.forEach(link => {
        const anchor = document.createElement("a");

        anchor.href = link.url;
        anchor.textContent = link.name;

        if (currentPage.endsWith(link.url)) {
            anchor.classList.add("active");
        }

        menu.appendChild(anchor);
    });

    nav.append(logo, menu);
    header.replaceChildren(nav);
}

document.addEventListener("DOMContentLoaded", createNavigation);