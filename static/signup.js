//let fetchData = null;

let gmail = null;
function onSignIn(response) {
    console.log("onSignIn called");
    let id_token = response.credential;
    console.log("ID Token: " + id_token);

    fetch('/tokensignin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id_token: id_token})
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.text().then(text => { throw new Error(text) });
        }
    }).then(data => {
        console.log(data);
        //localStorage.setItem('gmail', data.email);
        gmail = data.email;
        return data.email;
    }).catch(error => {
        console.error('Error:', error);
    });
}

document.querySelector(".signup_submit").addEventListener("click", async function () {
    if (!gmail) {
        alert("Gmail not available. Please sign in first.");
        return;
    }
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    console.log(document.querySelector("#merchant-name").value,document.querySelector("#user-name").value,gmail,document.querySelector("#phone-number").value,)
    let response = await fetch("/api/signup", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            merchant_name: document.querySelector("#merchant-name").value,
            user_name: document.querySelector("#user-name").value,
            gmail: gmail,
            phone_number: document.querySelector("#phone-number").value,
            merchant_id: document.querySelector("#merchant-id").value,
            service_type: document.querySelector("#service-type").value,
            intro: document.querySelector("#intro").value
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
    if (!gmail) {
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
            gmail: gmail,
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
    if (!gmail) {
        alert("Gmail not available. Please sign in first.");
        return;
    }
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    console.log(document.querySelector("#name-user").value,document.querySelector("#phone-number-user").value,gmail,)
    let response = await fetch("/api/user_signup", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name_user: document.querySelector("#name-user").value,
            phone_number_user: document.querySelector("#phone-number-user").value,
            gmail: gmail
        })
    });
    let data = await response.json();
    if (data.error){
        alert(data.error);
    }
    else{
        document.querySelector(".message").textContent = "註冊成功";
        setCookie("user_token", data.token, 7);
    };
});

document.querySelector(".login_submit_user").addEventListener("click", async function () {
    if (!gmail) {
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
            gmail: gmail,
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
