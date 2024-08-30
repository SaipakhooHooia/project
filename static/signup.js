//let fetchData = null;

let userLoginGmail = null;
let userSignupGmail = null;
let merchantLoginGmail = null;
let merchantSignupGmail = null;
function handleCredentialResponse(response) {
    const buttonType = handleCredentialResponse.buttonType;
    const responsePayload = decodeJwtResponse(response.credential);

    console.log("ID: " + responsePayload.sub);
    console.log('Full Name: ' + responsePayload.name);
    console.log('Given Name: ' + responsePayload.given_name);
    console.log('Family Name: ' + responsePayload.family_name);
    console.log("Image URL: " + responsePayload.picture);
    
    switch (buttonType) {
        case 'user-login':
            console.log("User login with: " + responsePayload.email);
            userLoginGmail = responsePayload.email;
            break;
        case 'user-signup':
            console.log("User signup with: " + responsePayload.email);
            userSignupGmail = responsePayload.email;
            break;
        case 'merchant-login':
            console.log("Merchant login with: " + responsePayload.email);
            merchantLoginGmail = responsePayload.email;
            break;
        case 'merchant-signup':
            console.log("Merchant signup with: " + responsePayload.email);
            merchantSignupGmail = responsePayload.email;
            break;
        default:
            console.error("Unknown button type:", buttonType);
    }
}

function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "69733288319-aneoppgio3farrkvp3fkfoslcbppr1vg.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    
    const buttons = [
        {id: 'user-login-button', type: 'user-login'},
        {id: 'user-signup-button', type: 'user-signup'},
        {id: 'merchant-login-button', type: 'merchant-login'},
        {id: 'merchant-signup-button', type: 'merchant-signup'}
    ];

    buttons.forEach(button => {
        const buttonElement = document.getElementById(button.id);
        if (buttonElement) {
            google.accounts.id.renderButton(
                buttonElement,
                { 
                    theme: "filled_blue", 
                    size: "large", 
                    type: "icon",
                    click_listener: () => {
                        handleCredentialResponse.buttonType = button.type;
                    }
                } 
            );
        } else {
            console.error(`Button element with id ${button.id} not found`);
        }
    });
}

document.querySelector(".signup_submit").addEventListener("click", async function () {
    if (!merchantSignupGmail) {
        alert("Gmail not available. Please sign in first.");
        return;
    }
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    //console.log(document.querySelector("#merchant-name").value,document.querySelector("#user-name").value,gmail,document.querySelector("#phone-number").value,)
    let response = await fetch("/api/signup", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            merchant_name: document.querySelector("#merchant-name").value,
            user_name: document.querySelector("#user-name").value,
            gmail: merchantSignupGmail,
            phone_number: document.querySelector("#phone-number").value,
            merchant_id: document.querySelector("#merchant-id").value,
            service_type: document.querySelector("#service-type").value,
            intro: document.querySelector("#intro").value,
            address: document.querySelector("#address").value,
            google_map_src: document.querySelector("#google_map_src").value,
            supply: document.querySelector("#supply").value,
            note: document.querySelector("#note").value
        })
    });
    let data = await response.json();
    if (data.token){
        console.log(data.token);
        setCookie("token", data.token, 7);
        window.location.href = "/merchant_setting";
    }
    else if (data.error){
        console.log(data.error);
        alert(data.error);
    } 
});


function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
}

document.querySelector(".login_submit").addEventListener("click", async function () {
    if (!merchantLoginGmail) {
        alert("Gmail not available. Please sign in first.");
        return;
    }
    document.querySelector(".message").textContent = "登入中...";
    let response = await fetch("/api/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gmail: merchantLoginGmail,
        })
    });
    let data = await response.json();
    if (data.token){
        console.log(data.token);
        setCookie("token", data.token, 7);
        window.location.href = "/merchant_member_page";
    }
    else if (data.error){
        console.log(data.error);
        alert(data.error);
    }
});

//---------使用者註冊部分---------
document.querySelector(".signup_submit_user").addEventListener("click", async function () {
    if (!userSignupGmail) {
        alert("Gmail not available. Please sign in first.");
        return;
    }
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    //console.log(document.querySelector("#name-user").value,document.querySelector("#phone-number-user").value,gmail,)
    let response = await fetch("/api/user_signup", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name_user: document.querySelector("#name-user").value,
            phone_number_user: document.querySelector("#phone-number-user").value,
            gmail: userSignupGmail
        })
    });
    let data = await response.json();
    if (data.error){
        alert(data.error);
    }
    else{
        document.querySelector(".user-signup-message").textContent = "註冊成功";
        setCookie("user_token", data.token, 7);
        window.location.reload();
    };
});

document.querySelector(".login_submit_user").addEventListener("click", async function () {
    if (!userLoginGmail) {
        alert("Gmail not available. Please sign in first.");
        return;
    }
    document.querySelector(".message").textContent = "登入中...";
    let response = await fetch("/api/login_user", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gmail: userLoginGmail,
        })
    });
    let data = await response.json();
    if (data.token){
        console.log(data.token);
        localStorage.setItem("user", data.user);
        localStorage.setItem("gmail", data.gmail);
        localStorage.setItem("user_id", data.user_id);
        setCookie("user_token", Object.values(data.token)[0], 7);
        window.location.reload();
    }
    else if (data.error){
        console.log(data.error);
        alert(data.error);
    }
});
