let token = document.cookie.split('; ').find(row => row.startsWith('user_token='));
let userToken = token.split('=')[1]
let currentDate = new Date();
let today = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
let tomorrow = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + (currentDate.getDate() + 1);

function initialize() {
    let url = `/api/user_auth`;
    authorize(url);
    //selectValue();
};

initialize();

function authorize(url) {
    console.log(url);
    fetch (url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": userToken
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        let orderData = data.data;
        for (let i = 0; i < orderData.length; i++) {
            //console.log("merhcant name: " + orderData[i].merchant_name);
           //console.log("first image: " + orderData[i].images);
            let orderCard = document.createElement("div");
            orderCard.classList.add("order-card");
            let orderTime1 = orderData[i].order_time.split('T')[0];
            let orderTime2 = orderData[i].order_time.split('T')[1];
            let cloudfrontUrl = 'https://df6a6ozdjz3mp.cloudfront.net/';
            let merchatnName = orderData[i].merchant_name;
            let isPaid = null;
            switch(orderData[i].is_paid) {
                case 0:
                    isPaid = "未付款";
                    break;
                case 1:
                    isPaid = "已付款";
                    break;
                case 2:
                    isPaid = "已取消";
                    break;
            };
            
            let rate = "未評分";
            if (orderData[i].rate !== null) {
                rate = `${orderData[i].rate}/5`;
            };

            if (orderData[i].service_time_name !== "") {
                orderCard.innerHTML = `
                <div class = "order-image-container" order-id = "${orderData[i].id}">
                    <img src="${cloudfrontUrl}${merchatnName}/${orderData[i].images}" class = "order-image"/>
                    <div class = "order-info">
                        <strong class = "merchant-name">${orderData[i].merchant_name}</strong>
                        <div class = "order-date">預約日期: ${orderData[i].date}</div>
                        <div>預約時間: ${orderData[i].time_start} - ${orderData[i].time_end}</div>
                        <div>時段: ${orderData[i].service_time_name}</div>
                        <div>價格: ${orderData[i].price}</div>
                        <div>預約單號: ${orderData[i].order_number}</div>
                        <div>下訂時間: ${orderTime1} ${orderTime2}</div>
                        <div class = "rate-title">評分: ${rate}</div>
                        <div class = "paid-status-title">付款狀態: ${isPaid}</div>
                    </div>
                </div>`;
            }
            else {
                orderCard.innerHTML = `
                <div class = "order-image-container" order-id = "${orderData[i].id}">
                    <img src="${cloudfrontUrl}${merchatnName}/${orderData[i].images}" class = "order-image"/>
                    <div class = "order-info">
                        <strong class = "merchant-name">${orderData[i].merchant_name}</strong>
                        <div class = "order-date">預約日期: ${orderData[i].date}</div>
                        <div>預約時間: ${orderData[i].time_start} - ${orderData[i].time_end}</div>
                        <div>價格: ${orderData[i].price}</div>
                        <div>預約單號: ${orderData[i].order_number}</div>
                        <div>下訂時間: ${orderTime1} ${orderTime2}</div>
                        <div class = "rate-title">評分: ${rate}</div>
                        <div class = "paid-status-title">付款狀態: ${isPaid}</div>
                    </div>
                </div>`;
            };
            document.querySelector(".order-cards").appendChild(orderCard);
        };
        btnContent();
    });
};

document.getElementById("order-select").addEventListener("change", (event) => {
    console.log(event.target.value);
    let selectedOption = event.target.selectedOptions[0];
    let selectValue = "";
    let url = null;
    switch (selectedOption.textContent) {
        case "全部訂單":
            selectValue = "";
            document.querySelector(".order-cards").innerHTML = "";
            url = `/api/user_auth?${selectValue}`;
            authorize(url);
            break;
        case "已完成訂單":
            selectValue = `is_paid=1&date=${today}&passed=1`;
            document.querySelector(".order-cards").innerHTML = "";
            url = `/api/user_auth?${selectValue}`;
            authorize(url);
            break;
        case "即將到來的預約":
            selectValue = `is_paid=1&date=${today}&passed=0`;
            document.querySelector(".order-cards").innerHTML = "";
            url = `/api/user_auth?${selectValue}`;
            authorize(url);
            break;
        case "已取消訂單":
            selectValue = `is_paid=2&date=${today}`;
            document.querySelector(".order-cards").innerHTML = "";
            url = `/api/user_auth?${selectValue}`;
            authorize(url);
            break;
    };
});

function parseDate(dateString) {
    let [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);//將日期做精確比較，而不是字典形式的比較
};

function btnContent() {
    let currentDate = new Date();
    let today = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
    let tomorrow = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + (currentDate.getDate() + 1);
    
    let orderImgContainers = document.querySelectorAll(".order-image-container");
    for (let orderImgContainer of orderImgContainers) {
        let orderDateDiv = orderImgContainer.querySelector(".order-date");
        let orderDate = orderDateDiv.textContent.split(": ")[1];
        let paidStatusDiv = orderImgContainer.querySelector(".paid-status-title");
        let paidStatus = paidStatusDiv.textContent.split(": ")[1];
        let rateDiv = orderImgContainer.querySelector(".rate-title");
        
        console.log("Raw Order Date:", orderDate);
        console.log("Parsed Order Date:", parseDate(orderDate));
        console.log("Raw Today:", today);
        console.log("Parsed Today:", parseDate(today));
        console.log("Raw Tomorrow:", tomorrow);
        console.log("Parsed Tomorrow:", parseDate(tomorrow));
        console.log("Paid Status:", paidStatus);
        
        console.log("Is order date >= tomorrow?", parseDate(orderDate) >= parseDate(tomorrow));
        console.log("Is order date < today?", parseDate(orderDate) < parseDate(today));
        
        if (parseDate(orderDate) >= parseDate(tomorrow) && paidStatus === "已付款") {
            console.log("Rendering cancel button");
            let cancelBtn = document.createElement("button");
            cancelBtn.classList.add("cancel-order-button");
            cancelBtn.textContent = "取消訂單";
            orderImgContainer.appendChild(cancelBtn);
        }
        else if (parseDate(orderDate) < parseDate(today) && paidStatus === "已付款" && rateDiv.textContent.includes("未評分")) {
            console.log("Rendering feedback button");
            let feedBackBtn = document.createElement("button");
            feedBackBtn.classList.add("feed-back-button");
            feedBackBtn.textContent = "送出評價";
            orderImgContainer.appendChild(feedBackBtn);
        }
        else if (parseDate(orderDate) < parseDate(today) && paidStatus === "已付款" && !rateDiv.textContent.includes("未評分")){
            let feedBackBtn = document.createElement("button");
            feedBackBtn.classList.add("feed-back-sent");
            feedBackBtn.textContent = "已評分";
            orderImgContainer.appendChild(feedBackBtn);
        }
        else if (parseDate(today) === parseDate(orderDate) && paidStatus === "已付款") {
            let eventStatusDiv = document.createElement("div");
            eventStatusDiv.classList.add("event-status");
            eventStatusDiv.textContent = "今日預約";
            orderImgContainer.appendChild(eventStatusDiv);
        }
        else if (paidStatus === "已取消") {
            console.log("Rendering cancel status");
            let cancelStatusDiv = document.createElement("div");
            cancelStatusDiv.classList.add("cancel-status");
            cancelStatusDiv.textContent = "已取消";
            orderImgContainer.appendChild(cancelStatusDiv);
        }
        else if (paidStatus === "未付款") {
            let cancelStatusDiv = document.createElement("div");
            cancelStatusDiv.classList.add("cancel-status");
            cancelStatusDiv.textContent = "付款失敗";
            orderImgContainer.appendChild(cancelStatusDiv);
        };
    };
    btnFunction();
};

function btnFunction() {
    let cancelBtns = document.querySelectorAll(".cancel-order-button");
    for (let cancelBtn of cancelBtns) {
        cancelBtn.addEventListener("click", (event) => {
            let orderImgContainer = event.target.closest(".order-image-container");
            let orderId = orderImgContainer.getAttribute("order-id");
            console.log(orderId);
            let url = `/api/refund_order/${orderId}`;
            fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": userToken,
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert(data.message);
                location.reload();
            });
        });
    };

    let feedBackBtns = document.querySelectorAll(".feed-back-button");
    for (let feedBackBtn of feedBackBtns) {
        feedBackBtn.addEventListener("click", (event) => {
            event.preventDefault();
    
            let feedbackArea = document.querySelector(".feedback-area");
            feedbackArea.innerHTML = "";
    
            feedbackArea.style.display = "block";
    
            let merchantName = feedBackBtn.closest(".order-image-container").querySelector(".merchant-name").textContent;
    
            let title = document.createElement("strong");
            title.classList.add("feedback-title");
            title.textContent = `您要給 ${merchantName} 什麼評價呢？`;

            let cancel = document.createElement("div");
            cancel.classList.add("cancel");
            cancel.addEventListener("click", () => {
                feedbackArea.style.display = "none";
            });
    
            let stars = document.createElement("div");
            stars.classList.add("stars");
            let selectedRating = 0;
    
            for (let i = 0; i < 5; i++) {
                let starDiv = document.createElement("div");
                starDiv.classList.add("star");
                starDiv.textContent = "☆";
                starDiv.setAttribute("data-index", i);
    
                starDiv.addEventListener("mouseover", () => {
                    for (let j = 0; j <= i; j++) {
                        stars.children[j].textContent = "★"; 
                    }
                });
    
                starDiv.addEventListener("mouseout", () => {
                    for (let j = 0; j < 5; j++) {
                        stars.children[j].textContent = j < selectedRating ? "★" : "☆"; 
                    }
                });
    
                starDiv.addEventListener("click", () => {
                    selectedRating = i + 1; 
                    for (let j = 0; j < 5; j++) {
                        stars.children[j].textContent = j < selectedRating ? "★" : "☆"; 
                    }
                });
    
                stars.appendChild(starDiv);
            }
    
            let submitRate = document.createElement("button");
            submitRate.classList.add("submit-rate");
            submitRate.setAttribute("order-id", feedBackBtn.closest(".order-image-container").getAttribute("order-id"));
            submitRate.textContent = "送出";
    
            feedbackArea.appendChild(title);
            feedbackArea.appendChild(cancel);
            feedbackArea.appendChild(stars);
            feedbackArea.appendChild(submitRate);
        });
    };

    let merchantNames = document.querySelectorAll(".merchant-name");
    for (let merchantName of merchantNames) {
        merchantName.addEventListener("click", (event) => {
            let merchantName = event.target.textContent;
            window.location.href = `/merchant/${merchantName}`;
        });
    };

    //submitRateFuntion();
};

/*function submitRateFuntion() {
    let submitRateBtn = document.querySelector(".submit-rate");
    let stars = document.querySelectorAll(".star");
    let score = 0;
    for(let star of stars) {
        if(star.textContent === "★") {
            score++;
        };
    };
    if (submitRateBtn) {
        submitRateBtn.addEventListener("click", (event) => {
            event.preventDefault();
            let orderImgContainer = event.target.closest(".order-image-container");
            let orderId = orderImgContainer.getAttribute("order-id");
            console.log(orderId);
            let url = `/api/feedback/${orderId}`;
            fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": userToken,
                },
                body: JSON.stringify({
                    "rate": score
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.message) {
                    alert(data.message);
                    submitRateBtn.disabled = true;
                    submitRateBtn.classList.remove("submit-rate");
                    submitRateBtn.classList.add("feed-back-sent");
                    submitRateBtn.textContent = "已評分";
                }
                else if (data.error) {
                    alert(data.error);
                }
            });
        });
    };
};*/

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('submit-rate')) {
        let orderId = event.target.getAttribute('order-id');
        handleSubmitRate(event, orderId);
    }
});

function handleSubmitRate(event, orderId) {
    event.preventDefault();
    let stars = event.target.closest('.feedback-area').querySelectorAll('.star');
    let score = Array.from(stars).filter(star => star.textContent === '★').length;
    /*let orderImgContainer = document.querySelector('.order-image-container');
    let orderId = orderImgContainer.getAttribute('order-id');*/
    
    console.log('Submitting rating:', score, 'for order:', orderId);

    let url = `/api/feedback/${orderId}`;
    fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": userToken,
        },
        body: JSON.stringify({
            "rate": score
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        if (data.message) {
            alert(data.message);
            event.target.disabled = true;
            event.target.classList.remove("submit-rate");
            event.target.classList.add("feed-back-sent");
            event.target.textContent = "已評分";
            document.querySelectorAll(".order-image-container").forEach(container => {
                if(container.getAttribute("order-id") === orderId) {
                    container.querySelector(".feed-back-button").classList.add("feed-back-sent");
                    container.querySelector(".feed-back-button").textContent = "已評分";
                };
            });
        }
        else if (data.error) {
            alert(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('提交評分時發生錯誤，請稍後再試。');
    });
};