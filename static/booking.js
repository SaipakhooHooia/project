function initialize(){
    authorize();
    let reservation = localStorage.getItem("newReservations");
    reservation = JSON.parse(reservation);
    let merchantName = reservation.merchant_name;
    let reservations = reservation.reservations;
    let updatedReservationData = {};
    console.log(reservations);
    getReservations(reservations, merchantName, updatedReservationData);
    renderForm();
};

initialize();

function authorize(){
    let userToken = document.cookie.split('; ').find(row => row.startsWith('user_token='));
    console.log("User Token:", userToken);  
    if (!userToken) {
        window.location.href = "/";
        return;
    }
    
    let userTokenValue = userToken.split('=')[1];
    console.log("User Token Value:", userTokenValue);  
    if (!userTokenValue) {
        window.location.href = "/";
        return;
    }
}

function getReservations(reservations, merchantName, updatedReservationData){
    document.querySelector(".greeting").textContent = ` ${localStorage.getItem("user")}您好，您的預約資訊如下:`;
    let reservationName = document.createElement("div");

    if (Object.keys(reservations).length === 0) {
        let noReservation = document.createElement("h3");
        noReservation.textContent = `目前沒有預約資訊`;
        document.querySelector(".reservation-container").appendChild(noReservation);
    } else {
        reservationName.innerHTML = `
            <div class="merchant-name">
                <h3>${merchantName}</h3>
            </div>`;
        document.querySelector(".reservation-container").appendChild(reservationName);
    };

    let totalPrice = 0;
    for (let date in reservations) {
        let reservationDate = document.createElement("div");
        reservationDate.className = "reservation-date-container";
        reservationDate.innerHTML = `<div class="reservation-date">${date}</div>`;
        reservations[date].forEach(timeSlot => {
            if (timeSlot.service_name){
                reservationDate.innerHTML += `
                <div class="reservation-time" data-date="${date}" data-start="${timeSlot.start}" data-end="${timeSlot.end}" data-service="${timeSlot.service_name}">
                    起: ${timeSlot.start} - 迄: ${timeSlot.end} - 時段: ${timeSlot.service_name}，金額: ${timeSlot.price}
                    <img class="cancel-reservation" src="/static/trash_can.png" alt="取消預約" />
                </div>
            `;
            }
            else{
                reservationDate.innerHTML += `
                <div class="reservation-time" data-date="${date}" data-start="${timeSlot.start}" data-end="${timeSlot.end}" data-service="${timeSlot.service_name}">
                    起: ${timeSlot.start} - 迄: ${timeSlot.end}，金額: ${timeSlot.price}
                    <img class="cancel-reservation" src="/static/trash_can.png" alt="取消預約" />
                </div>
            `;
            }
            totalPrice += parseInt(timeSlot.price);
        });
        document.querySelector(".reservation-container").appendChild(reservationDate);
    }

    let innerHr = document.createElement("hr");
    totalPriceContent = document.createElement("div");
    totalPriceContent.className = "total-price";
    totalPriceContent.textContent = `NT：${totalPrice} `;
    document.querySelector(".reservation-container").appendChild(innerHr);
    document.querySelector(".reservation-container").appendChild(totalPriceContent);

    document.querySelectorAll(".cancel-reservation").forEach(trashButton => {
        trashButton.addEventListener("click", (event) => {
            event.preventDefault();
            let reservationTimeDiv = event.target.closest(".reservation-time");
            let date = reservationTimeDiv.dataset.date;
            let start = reservationTimeDiv.dataset.start;
            let end = reservationTimeDiv.dataset.end;
            let serviceName = reservationTimeDiv.dataset.service;
    
            if (reservations[date]) {
                reservations[date] = reservations[date].filter(timeSlot => {
                    return !(timeSlot.start === start && timeSlot.end === end && timeSlot.service_name === serviceName);
                });
    
                if (reservations[date].length === 0) {
                    delete reservations[date];
                }
            }
    
            updatedReservationData = {
                merchant_name: merchantName,
                reservations: reservations
            };
            localStorage.setItem("newReservations", JSON.stringify(updatedReservationData));
    
            reservationTimeDiv.remove();
    
            let container = reservationTimeDiv.closest(".reservation-date-container");
            if (container && container.querySelectorAll(".reservation-time").length === 0) {
                container.remove();
            }
    
            // 重新計算總價
            let newTotalPrice = 0;
            for (let date in reservations) {
                reservations[date].forEach(timeSlot => {
                    newTotalPrice += parseInt(timeSlot.price);
                });
            }
    
            let totalPriceContent = document.querySelector(".total-price");
            totalPriceContent.textContent = `NT：${newTotalPrice}`;
    
            if (Object.keys(reservations).length === 0) {
                let noReservation = document.createElement("h3");
                noReservation.textContent = `目前沒有預約資訊`;
                document.querySelector(".reservation-container").innerHTML = '';
                document.querySelector(".reservation-container").appendChild(noReservation);
            }
        });
    });
};

function renderForm() {
    document.getElementById("booking-name").value = localStorage.getItem("user") || "";
    document.getElementById("booking-gmail").value = localStorage.getItem("gmail") || "";
}

document.querySelector(".booking_submit").addEventListener("click", sendBookingData);
async function sendBookingData(){
    if (document.querySelector("inform")) {
        document.querySelector(".inform").remove();
    };
    let inform = document.createElement("h3");
    inform.className = "inform";
    inform.textContent = `訂單處理中，請稍後...`;
    document.querySelector(".main").appendChild(inform);
    let reservationJson = JSON.parse(localStorage.getItem("newReservations")); 
    if (!reservationJson || !reservationJson.reservations || Object.keys(reservationJson.reservations).length === 0) {
        alert("請先選擇預約時段");
        return; 
    }

    let reservation = localStorage.getItem("newReservations");
    let bookingName = document.getElementById("booking-name").value;
    let bookingGmail = document.getElementById("booking-gmail").value;
    let bookingPhoneNumber = document.getElementById("booking-phone-number").value;
    let token = document.cookie.split('; ').find(row => row.startsWith('user_token=')).split('=')[1];
    function extractTotalPrice(text) {
        const match = text.match(/NT：(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    let totalPriceContent = document.querySelector(".total-price");
    let totalPriceText = totalPriceContent.textContent;
    let totalPrice = extractTotalPrice(totalPriceText);
    
    let combinedContent = {
        reservation: reservation,
        name: bookingName,
        gmail: bookingGmail,
        userID: localStorage.getItem("user_id"),
        phoneNumber: bookingPhoneNumber,
        totalPrice: totalPrice
    }
    TPDirect.card.getPrime(function (result) {
        if (result.status !== 0) {
          alert('卡片資訊錯誤');
          return false;
        }
        let prime = result.card.prime;
        //alert('getPrime 成功: ' + prime);
        fetch("/api/booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `${token}`
          },
          body: JSON.stringify({
            "prime": prime, 
            "order": combinedContent
        })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            console.log("訂單編號:", data.data);
            if(data.data){
                inform.textContent = `訂單編號：${data.data}，預約明細請留意電子郵件通知。`;
                document.querySelector(".main").appendChild(inform);
            };
        })
      });
};

//-------------------------------GetPrime section----------------------------------------------------
let APP_ID = 151667;
let APP_KEY = "app_w9o9z86GgK37YgOsND8SbZ9qiiScnUNOAYPCx6Gi4LaBZQzOAJQ8NtMYvxRr";
TPDirect.setupSDK(APP_ID, APP_KEY, "sandbox");

TPDirect.card.setup({
    fields: {
    number: {
        element: '.form-control.card-number',
        placeholder: '**** **** **** ****'
    },
    expirationDate: {
        element: document.getElementById('tappay-expiration-date'),
        placeholder: 'MM / YY'
    },
    ccv: {
        element: '.form-control.ccv',
        placeholder: 'CCV'
    }
    },
    styles: {
    'input': {
          'color': 'gray'
    },
    'input.ccv': {
        // 'font-size': '16px'
    },
    ':focus': {
        'color': 'black'
    },
    '.valid': {
        'color': 'green'
    },
    '.invalid': {
        'color': 'red'
    },
    '@media screen and (max-width: 400px)': {
        'input': {
        'color': 'orange'
        }
    }
    },
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6, 
        endIndex: 11
    }
});