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
    let merchantCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (merchantCookie === undefined) {
        //alert("請先登入或註冊商家會員");
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


document.querySelector(".adjust-setting").addEventListener("click", () => {
    document.querySelector(".search-setting").style.display = "block";
    document.querySelectorAll(".search-setting-menu div").forEach((element) => {
        element.classList.remove("filtered-class");
    });
    document.querySelector(".city").classList.add("filtered-class");
    showFilter("縣市");
});

document.querySelector(".close-search-setting").addEventListener("click", () => {
    document.querySelector(".search-setting").style.display = "none";
});

document.querySelector(".search-setting-menu").querySelectorAll("div").forEach((element) => {
    element.addEventListener("click", () => {
        document.querySelectorAll(".search-setting-menu div").forEach((el) => {
            el.classList.remove("filtered-class");
        });
        element.classList.add("filtered-class");
        showFilter(element.textContent);
    });
});

function showFilter(text) {
    let settingDict = {
        "縣市": ".city-select",
        "類型": ".class-select",
        "租金": ".price-range-select",
        "更多": ".more-select"
    };
    for(let key in settingDict){
        const element = document.querySelector(settingDict[key]);
        if(text == key){
            element.style.display = "grid";
            if (!element.hasListeners) {
                if (key == "更多") {
                    element.querySelectorAll("div").forEach((div) => {
                        div.addEventListener("click", () => {
                            div.classList.toggle("filtered-option");
                            console.log(div.textContent);
                            updateFilter();
                        });
                    });
                }
                else if(key == "縣市"||key == "類型"||key == "租金"){
                    element.querySelectorAll("div").forEach((div) => {
                    div.addEventListener("click", () => {
                        element.querySelectorAll("div").forEach((el) => {
                            el.classList.remove("filtered-option");
                        });
                        div.classList.add("filtered-option");
                        console.log(div.textContent);
                        updateFilter();
                        });
                    });
                };
                element.hasListeners = true;
            };
        }
        else {
            element.style.display = "none";
        };
    };
};
let globalSelectDict = {};
function updateFilter() {
    let selects = document.querySelectorAll(".filtered-option");
    let selectDict = {};
    if (selects.length > 0) {
        selects.forEach((select) => {
            let selectCat = select.parentElement.dataset.type;
            if (selectCat in selectDict) {
                if (!selectDict[selectCat].includes(select.textContent)) {
                selectDict[selectCat].push(select.textContent);
                };
            }
            else {
                selectDict[selectCat] = [select.textContent];
            };
        });
        globalSelectDict = selectDict;
    };
};

document.querySelector(".clear-filter").addEventListener("click", () => {
    globalSelectDict = {};
    document.querySelectorAll(".filtered-class").forEach((element) => {
        element.classList.remove("filtered-class");
    });
    document.querySelectorAll(".filtered-option").forEach((element) => {
        element.classList.remove("filtered-option");
    });
    document.querySelector(".city").classList.add("filtered-class");
    showFilter("縣市");
    document.querySelector(".city-select").style.display = "grid";
    document.querySelector(".price-range-select").style.display = "none";
    document.querySelector(".class-select").style.display = "none";
    document.querySelector(".more-select").style.display = "none";
});

document.querySelector(".confirm-button").addEventListener("click", () => {
    console.log(globalSelectDict);
    document.querySelector(".search-setting").style.display = "none";
});

document.querySelector(".search-button").addEventListener("click", (event) => {
    let searchElement = document.querySelector(".search-box").value;

    let url = `/merchant_browse?keyword=${searchElement}`;
    
    if (globalSelectDict.city) {
        url += `&city=${globalSelectDict.city}`;
    }
    if (globalSelectDict.class) {
        url += `&type=${globalSelectDict.class}`;
    }
    if (globalSelectDict.price) {
        url += `&price=${globalSelectDict.price}`;
    }
    if (globalSelectDict.more) {
        url += `&more=${globalSelectDict.more}`;
    }
    console.log(url);
    window.location.href = url;
    globalSelectDict = {};
});
