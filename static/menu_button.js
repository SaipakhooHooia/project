document.addEventListener("click", (event) => {
    const ClickInsidePopupMenu = document.querySelector(".popup-menu").contains(event.target) || 
                          document.querySelector(".popup-menu-title").contains(event.target);
    
    if (!ClickInsidePopupMenu) {
        document.querySelector(".popup-menu").style.display = "none";
    }

    const ClickInsideLoginMenu = document.querySelector(".login-signup-menu").contains(event.target) || 
                          document.querySelector(".login-signup-popup-menu").contains(event.target);
    if (!ClickInsideLoginMenu) {
        document.querySelector(".login-signup-menu").style.display = "none";
    }
});

document.querySelector(".popup-menu-title").addEventListener("click", () => {
    document.querySelector(".popup-menu").style.display = "block";
});

document.querySelector(".popup-menu").children[1].addEventListener("click", (event) => {
    document.querySelector(".login-signup-form").style.display = "block";
    document.querySelector(".login-area").style.display = "none";
    document.querySelector(".signup-area").style.display = "block";
});

document.querySelector(".popup-menu").children[2].addEventListener("click", (event) => {
    document.querySelector(".login-signup-form").style.display = "block";
    document.querySelector(".login-area").style.display = "block";
    document.querySelector(".signup-area").style.display = "none";
});

document.querySelector(".switch-to-login").addEventListener("click", (event) => {
    document.querySelector(".login-area").style.display = "block";
    document.querySelector(".signup-area").style.display = "none";
});

document.querySelector(".switch-to-signup").addEventListener("click", (event) => {
    document.querySelector(".login-signup-form").style.display = "block";
    document.querySelector(".login-area").style.display = "none";
    document.querySelector(".signup-area").style.display = "block";
});

document.querySelectorAll(".cancel").forEach((element) => {
    element.addEventListener("click", (event) => {
        document.querySelector(".login-signup-form").style.display = "none";
        document.querySelector(".login-signup-form-user").style.display = "none";
    });
});

document.querySelector(".popup-menu").children[3].addEventListener("click", (event) => {
    if (document.cookie === "") {
        document.querySelector(".login-signup-form").style.display = "block";
    }
    else{
        window.location.href = "/merchant_member_page";
    }
});

document.querySelector(".home-icon").addEventListener("click", (event) => {
    window.location.href = "/";
});

document.querySelector(".browse-title").addEventListener("click", (event) => {
    window.location.href = "/merchant_browse";
});

document.querySelector(".search-button").addEventListener("click", (event) => {
    let searchElement = document.querySelector(".search-box").value;
    window.location.href = "/merchant_browse?keyword=" + searchElement;
});

document.querySelector(".login-signup-popup-menu").addEventListener("click", (event) => {
    document.querySelector(".login-signup-menu").style.display = "block";
});

document.querySelector(".login-signup-menu").children[0].addEventListener("click", (event) => {
    document.querySelector(".login-signup-form-user").style.display = "block";
    document.querySelector(".login-area-user").style.display = "none";
    document.querySelector(".signup-area-user").style.display = "block";
});

document.querySelector(".login-signup-menu").children[1].addEventListener("click", (event) => {
    document.querySelector(".login-signup-form-user").style.display = "block";
    document.querySelector(".login-area-user").style.display = "block";
    document.querySelector(".signup-area-user").style.display = "none";
});

document.querySelector(".switch-to-login-user").addEventListener("click", (event) => {
    document.querySelector(".login-area-user").style.display = "block";
    document.querySelector(".signup-area-user").style.display = "none";
});

document.querySelector(".switch-to-signup-user").addEventListener("click", (event) => {
    document.querySelector(".login-area-user").style.display = "none";
    document.querySelector(".signup-area-user").style.display = "block";
});

let userTokenExist = document.cookie.includes("user_token");
let merchantTokenExist = document.cookie.includes("token");

if (userTokenExist || merchantTokenExist) {
    document.querySelector(".login-signup-popup-menu").style.display = "none";
    document.querySelector(".log-out").style.display = "block";
} 
else {
    document.querySelector(".login-signup-popup-menu").style.display = "block";
    document.querySelector(".log-out").style.display = "none";
};

if (userTokenExist) {
    document.querySelector(".user-menu").style.display = "block";
    document.querySelector(".popup-menu-title").style.display = "none";
};

document.querySelector(".user-menu").addEventListener("click", (event) => {
    window.location.href = "/user_member_page";
});

document.querySelector(".log-out").addEventListener("click", (event) => {
    document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
    localStorage.clear();
    window.location.href = "/"; 
});