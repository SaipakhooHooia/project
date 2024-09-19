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
            userLogin(userLoginGmail)
            break;
        case 'user-signup':
            console.log("User signup with: " + responsePayload.email);
            userSignupGmail = responsePayload.email;
            userSignup(userSignupGmail);
            break;
        case 'merchant-login':
            console.log("Merchant login with: " + responsePayload.email);
            merchantLoginGmail = responsePayload.email;
            merchantLogin(merchantLoginGmail);
            break;
        case 'merchant-signup':
            console.log("Merchant signup with: " + responsePayload.email);
            merchantSignupGmail = responsePayload.email;
            merchantSignup(merchantSignupGmail);
            //localStorage.setItem("merchant-signup-gmail", merchantSignupGmail);
            //window.location.href = "/new_merchant_setting";
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
                    theme: "outline", 
                    size: "large", 
                    type: "standard",
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

//**************************FB登入 */
/*
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk')
);


window.fbAsyncInit = function() {
FB.init({
appId            : '517905320729039',
xfbml            : true,
version          : 'v12.0'
});
FB.login(function(response) {
if (response.authResponse) {
 console.log('Welcome!  Fetching your information.... ');
 FB.api('/me', {fields: 'name, email'}, function(response) {
     document.getElementById("profile").innerHTML = "Good to see you, " + response.name + ". i see your email address is " + response.email
 });
} else { 
 console.log('User cancelled login or did not fully authorize.'); }
});
};
*/
//**************************商家註冊、登入 */


async function merchantSignup(merchantSignupGmail) {
    if (!document.querySelector("#merchant-user-name").value || !document.querySelector("#merchant-user-phone-num").value) {
        alert("請輸入商家名稱及電話");
        return;
    };
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    //console.log(document.querySelector("#merchant-name").value,document.querySelector("#user-name").value,gmail,document.querySelector("#phone-number").value,)
    let response = await fetch("/api/signup", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gmail: merchantSignupGmail,
            name: document.querySelector("#merchant-user-name").value,
            phone_number: document.querySelector("#merchant-user-phone-num").value
        })
    });
    let data = await response.json();
    if (data.message){
        alert(data.message);
    }
    else if (data.error){
        console.log(data.error);
        alert(data.error);
    } 
};

    


function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
}

async function merchantLogin(merchantLoginGmail) {
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
    };  
};

//---------使用者註冊部分---------
async function userSignup(userSignupGmail) {
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    //console.log(document.querySelector("#name-user").value,document.querySelector("#phone-number-user").value,gmail,)
    if(!document.querySelector("#name-user").value || !document.querySelector("#phone-number-user").value){
        alert("請輸入姓名及電話");
        return;
    };

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
        document.querySelector(".user-signup-message").textContent = "註冊成功，請登入";
    };
};  

async function userLogin(userLoginGmail){
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
    };
};
/*
document.querySelector(".adjust-setting").addEventListener("click", () => {
    document.querySelector(".search-setting").style.display = "block";
});*/