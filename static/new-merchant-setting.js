document.querySelector(".add").addEventListener("click", () => {
    addTimeGroup();
})

document.querySelector(".agreement").addEventListener("click", () => {
    console.log("service-agreement-label");
    let agreementContent = document.querySelector(".agreement-content");
    agreementContent.style.display = "block";
    agreementContent.classList.remove("hidden");
    agreementContent.style.visibility = "visible";
});

document.querySelector(".cancelled").addEventListener("click", () => {
    document.querySelector(".agreement-content").style.display = "none";
});

document.querySelector(".agreement-checkbox2").addEventListener("change", () => {
    if (document.querySelector(".agreement-checkbox2").checked === true) {
        document.querySelector(".agreement-checkbox").checked = true;
        let agreementContent = document.querySelector(".agreement-content");
        agreementContent.style.display = "none";
        agreementContent.classList.add("hidden");

        setTimeout(() => {
            agreementContent.style.visibility = "hidden";
            agreementContent.style.display = "none";
        }, 1000); 
    };
});


function selector(elements){  
    let select = document.querySelectorAll(elements);
    for (let element of select) {
        for (let hour = 0; hour < 24; hour++) {
            let option = document.createElement("option");
            option.value = hour+":00";
            option.text = hour+":00";
            element.appendChild(option);
        };
    }
    return select;
};

document.addEventListener("DOMContentLoaded", function() {
    initialize();
    console.log("DOMContentLoaded");
});
function initialize() {
    selector('#new-service-time-start');
    selector('#new-service-time-end');
    renderOldNewMerchantForm();
    console.log("initialize");
};

function renderMerchantMemberPage(memberData) {
    // 清空之前的内容
    const merchantMemberDataContainer = document.querySelector(".merchant-member-data");
    merchantMemberDataContainer.innerHTML = '';

    for (let merchantName in memberData) {
        let contact = memberData[merchantName].contact;
        let intro = memberData[merchantName].intro;
        let accountNum = memberData[merchantName].account_num;
        let phoneNumber = memberData[merchantName].phone_number;
        let address = memberData[merchantName].address;
        let googleMapSrc = memberData[merchantName].google_map_src;
        let supply = memberData[merchantName].supply;
        let note = memberData[merchantName].note;
        let merchantOnBroad = memberData[merchantName].on_broad;
        
        let merchantDiv = document.createElement('div');
        merchantDiv.className = `merchant ${merchantName.replace(/\s+/g, '-')}`;
        
        let h2 = document.createElement('h2');
        h2.textContent = merchantName;
        merchantDiv.appendChild(h2);

        const fields = [
            { label: '負責人', name: 'contact', value: contact },
            { label: '場地描述', name: 'intro', value: intro, isTextarea: true },
            { label: '公司帳號', name: 'account_num', value: accountNum },
            { label: '連絡電話', name: 'phone_number', value: phoneNumber },
            { label: '地址', name: 'address', value: address },
            { label: 'google map 定位連結', name: 'google_map_src', value: googleMapSrc },
            { label: '供應商品', name: 'supply', value: supply, isTextarea: true },
            { label: '注意事項', name: 'note', value: note, isTextarea: true }
        ];

        fields.forEach(field => {
            let label = document.createElement('label');
            label.setAttribute('for', field.name);
            label.textContent = field.label;
            merchantDiv.appendChild(label);

            let input = document.createElement(field.isTextarea ? 'textarea' : 'input');
            input.className = field.name;
            input.name = field.name;
            input.value = field.value;
            merchantDiv.appendChild(input);

            merchantDiv.appendChild(document.createElement('br'));
        });

        let serviceHoursContainer = document.createElement('div');
        serviceHoursContainer.className = 'service-hours-container';
        
        for (let serviceHour of memberData[merchantName].service_hours) {
            let serviceHourDiv = document.createElement('div');
            serviceHourDiv.className = 'service-hour';

            const serviceFields = [
                { label: '營業開始時間', name: 'start-time', value: serviceHour.startTime },
                { label: '營業結束時間', name: 'end-time', value: serviceHour.endTime },
                { label: '金額', name: 'price', value: serviceHour.price },
                { label: '時段名稱', name: 'service-time', value: serviceHour.serviceHourName }
            ];

            serviceFields.forEach(field => {
                let label = document.createElement('label');
                label.setAttribute('for', field.name);
                label.textContent = field.label;
                serviceHourDiv.appendChild(label);

                let input = document.createElement('input');
                input.className = field.name;
                input.name = field.name;
                input.value = field.value;
                serviceHourDiv.appendChild(input);

                serviceHourDiv.appendChild(document.createElement('br'));
            });
            
            serviceHoursContainer.appendChild(serviceHourDiv);
        }

        let onBroad = document.createElement('div');
        onBroad.className = 'on-broad';

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'online-status';
        checkbox.name = 'on-broad';
        checkbox.className = 'on-broad-checkbox';
        checkbox.checked = merchantOnBroad;

        let label = document.createElement('label');
        label.setAttribute('for', 'online-status');
        label.textContent = '上線狀態';

        onBroad.appendChild(checkbox);
        onBroad.appendChild(label);

        merchantDiv.appendChild(serviceHoursContainer);
        serviceHoursContainer.appendChild(onBroad);
        merchantMemberDataContainer.appendChild(merchantDiv);
    };
};

function addTimeGroup() {
    const lineBreak1 = document.createElement('br');
    const startTimeLabel = document.createElement('label');
    startTimeLabel.setAttribute('for', 'new-service-time-start');
    startTimeLabel.textContent = '開始時間';
    
    const startTimeInput = document.createElement('select');
    startTimeInput.setAttribute('id', 'new-service-time-start');
    startTimeInput.setAttribute('name', 'new-service-time-start');

    const lineBreak2 = document.createElement('br');

    const endTimeLabel = document.createElement('label');
    endTimeLabel.setAttribute('for', 'new-service-time-end');
    endTimeLabel.textContent = '結束時間';
    
    const endTimeInput = document.createElement('select');
    endTimeInput.setAttribute('id', 'new-service-time-end');
    endTimeInput.setAttribute('name', 'new-service-time-end');

    const lineBreak3 = document.createElement('br');
    const priceLabel = document.createElement('label');
    priceLabel.textContent = '每時段價格';
    priceLabel.setAttribute('for', 'price');
    const priceInput = document.createElement('input');
    priceInput.setAttribute('placeholder', '每時段價格');
    priceInput.setAttribute('id', 'price');
    priceInput.setAttribute('name', 'price');

    const lineBreak4 = document.createElement('br');
    const serviceTimeNameLabel = document.createElement('label');
    serviceTimeNameLabel.textContent = '時段名稱(選填)';
    serviceTimeNameLabel.setAttribute('for', 'service-time-name');
    const serviceTimeNameInput = document.createElement('input');
    serviceTimeNameInput.setAttribute('placeholder', '時段名稱(選填)');
    serviceTimeNameInput.setAttribute('id', 'service-time-name');
    serviceTimeNameInput.setAttribute('name', 'service-time-name');

    const lineBreak5 = document.createElement('br');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '刪除時段';
    deleteButton.setAttribute('class', 'delete-setting-button');
    const lineBreak6 = document.createElement('br');

    const serviceTimeSetting = document.createElement('div');
    serviceTimeSetting.setAttribute('class', 'service-time-setting');
    serviceTimeSetting.appendChild(lineBreak1);
    serviceTimeSetting.appendChild(startTimeLabel);
    serviceTimeSetting.appendChild(startTimeInput);
    serviceTimeSetting.appendChild(lineBreak2);
    serviceTimeSetting.appendChild(endTimeLabel);
    serviceTimeSetting.appendChild(endTimeInput);
    serviceTimeSetting.appendChild(lineBreak3);
    serviceTimeSetting.appendChild(priceLabel);
    serviceTimeSetting.appendChild(priceInput);
    serviceTimeSetting.appendChild(lineBreak4);
    serviceTimeSetting.appendChild(serviceTimeNameLabel);
    serviceTimeSetting.appendChild(serviceTimeNameInput); 
    serviceTimeSetting.appendChild(lineBreak5);
    serviceTimeSetting.appendChild(deleteButton);
    serviceTimeSetting.appendChild(lineBreak6);

    document.querySelector('.service-time-container').appendChild(serviceTimeSetting);
    selector('#new-service-time-start');
    selector('#new-service-time-end');

    document.querySelectorAll('.delete-setting-button').forEach((button) => {
        button.addEventListener('click', (event) => {
            let parentElement = event.target.closest('.service-time-setting');
    
            if (parentElement) {
                parentElement.remove(); 
            }
        });
    });
};

function checkTimeRangeOverlap() {
    let serviceTimes = document.querySelectorAll('.service-time-setting');
    let hoursADay = [];
    for (let i = 0; i< 24; i++) {
        hoursADay.push(i);
    };

    let overlap = false;
    for (let serviceTime of serviceTimes) {
        let serviceTimeStart = serviceTime.querySelector('#new-service-time-start').value;
        let timeStart = parseInt(serviceTimeStart.split(':')[0]);
        let serviceTimeEnd = serviceTime.querySelector('#new-service-time-end').value;
        let timeEnd = parseInt(serviceTimeEnd.split(':')[0]);
        console.log(timeStart, timeEnd);

        if (timeStart > timeEnd) {
            for (let j = timeStart; j < 23; j++) {
                if (!hoursADay.includes(j)) {
                    overlap = true;
                };
                hoursADay.splice(hoursADay.indexOf(j), 1);
            };
            for (let j = 0; j < timeEnd; j++) {
                if (!hoursADay.includes(j)) {
                    overlap = true;
                };
                hoursADay.splice(hoursADay.indexOf(j), 1);
            };
        }
        else if (timeEnd > timeStart) {
            for (let j = timeStart; j < timeEnd; j++) {
                if (!hoursADay.includes(j)) {
                    overlap = true;
                };
                hoursADay.splice(hoursADay.indexOf(j), 1);
            };
        }
        else if (timeEnd === timeStart) {
            overlap = true;
        };
    };
    return overlap;
};

document.querySelector(".next-page").addEventListener("click", (event) => {
    event.preventDefault();
    let merchantName = document.getElementById("new-merchant-name").value;
    let userName = document.getElementById("new-user-name").value;
    let phoneNum = document.getElementById("phone-num").value;
    let accountNum = document.getElementById("account-num").value;
    let serviceType = document.getElementById("service-type").value;
    let address = document.getElementById("new-address").value;

    if (!merchantName || !userName || !phoneNum || !accountNum || !serviceType || !address) {
        alert("請填寫完整商家資料。");
        return;
    };

    if (!phoneNum.match(/^\d{10}$/)) {
        alert("請輸入正確的電話號碼。");
        return;
    };

    if (!accountNum.match(/^\d{16}$/)) {
        alert("請輸入正確的銀行帳號。");
        return;
    };
    let googleMapRawData = document.getElementById("google-map-src").value;
    let srcRegex = /src="([^"]*)"/;
    let match = googleMapRawData.match(srcRegex);
    if (!match) {
        alert("Google 地圖網址格式錯誤。");
        return;
    };
    let googleMapSrc = match ? match[1] : null;

    let intro = document.getElementById("new-intro").value;
    let supply = document.getElementById("new-supply").value;
    let note = document.getElementById("new-note").value;

    let merchantData = {
        'merchant_name': merchantName,
        'user_name': userName,
        'phone_number': phoneNum,
        'account_number': accountNum,
        'service_type': serviceType,
        'address': address,
        'google_map_src': googleMapSrc,
        'intro': intro,
        'supply': supply,
        'note': note
    };

    localStorage.setItem("merchantData", JSON.stringify(merchantData));
    document.querySelector(".add-new-merchant-form").style.display = "none";
    document.querySelector(".add-new-merchant-form2").style.display = "block";
});

document.querySelector(".submit-new-merchant").addEventListener("click", async (event) => {
    event.preventDefault();
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    const form = document.getElementById('form');
    const formData = new FormData(form);
    formData.delete('image');
    const images = document.getElementById('image').files;
    const gmail = localStorage.getItem('merchant-signup-gmail');
    formData.append('gmail', gmail);

    let resizedImages = [];

    for (let i = 0; i < images.length; i++) {
        const resizedImage = await resizeImage(images[i],600, 600); 
        resizedImages.push(resizedImage);
    }

    resizedImages.forEach((resizedImage, index) => {
        formData.append('image', resizedImage, `image-${index}.jpg`);
    });

    let payload = {};
    let timeOverlaoResult = checkTimeRangeOverlap();
    if (timeOverlaoResult) {
        alert("時段重疊");
        return;
    };
    const serviceTimeSettings = document.querySelectorAll('.service-time-setting');
    serviceTimeSettings.forEach((serviceTimeSetting, index) => {
        let priceInput = true;
        if (serviceTimeSetting.querySelector('#price').value.trim() === "") {
            priceInput = false;
        };

        if (!priceInput) {
            alert("請填寫完整價格資訊");
            return;
        };

        payload[index] = {
            start: serviceTimeSetting.querySelector('#new-service-time-start').value,
            end: serviceTimeSetting.querySelector('#new-service-time-end').value,
            price: serviceTimeSetting.querySelector('#price').value,
            name: serviceTimeSetting.querySelector('#service-time-name').value
        };
    });

    let merchantOnBroad = document.querySelector(".on-broad-checkbox").checked;
    let agreement = document.querySelector(".agreement-checkbox").checked;

    if(!agreement){
        alert("請勾選同意條款");
        return;
    };

    formData.append('merchant_on_broad', JSON.stringify(merchantOnBroad));
    formData.append('agreement', JSON.stringify(agreement));

    let newMerchantInfo = JSON.parse(localStorage.getItem('merchantData'));
    formData.append('merchant_data', JSON.stringify(newMerchantInfo));

    let isValid = true; 

    for (let key in newMerchantInfo) {
        if (newMerchantInfo[key].trim() === "") {
            isValid = false; 
            alert("請填寫完整商家資料");
            return;
        };
    };

    formData.append('service_hour', JSON.stringify(payload));
    console.log(formData.get("service_hour"));
    console.log(formData.getAll("image"));

    try {
        const response = await fetch('/api/signup-merchant', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log(data);
        document.querySelector('#blah').setAttribute('src', 'http://placehold.it/180');
        if(data.success){
            alert(data.success);
            localStorage.removeItem('merchantData');
            window.location.href = '/merchant_member_page';
        }
        else{
            alert(data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function getTokenFromString(str) {
    const parts = str.split(';');

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.startsWith('token=')) {
            return trimmedPart.split('=')[1].trim();
        }
    }

    return null;
}

function readURL(input) {
    console.log(input);
    document.querySelector('#blah').setAttribute('src', 'http://placehold.it/180');
    if (input.files && input.files[0]) {
      let reader = new FileReader();
      console.log(reader);
  
      reader.onload = function (e) {
        console.log(e);
        document.querySelector('#blah').setAttribute('src', e.target.result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, 0.9); // 使用 0.9 的品質壓縮圖片
            };
            img.src = event.target.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

document.querySelector(".question-mark").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".google-map-tutorial").classList.remove("hidden");
    document.querySelector(".google-map-tutorial").style.display = "block";
  });

document.querySelector(".cancel-google-map-tutorial").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".google-map-tutorial").style.display = "none";
  });

document.querySelector(".submit-google-map-tutorial").addEventListener("click", (event) => {
    event.preventDefault();
    let tutorialElement = document.querySelector(".google-map-tutorial");
    document.querySelector(".google-map-tutorial").classList.add("hidden");
    setTimeout(() => {
        tutorialElement.style.display = "none";
    }, 1000);
});

function renderOldNewMerchantForm() {
    console.log("renderOldNewMerchantForm");
    let newMerchantForm = document.querySelector(".add-new-merchant-form");
        console.log("newMerchantForm?.style.display === 'block'");
      
        let merchantData = JSON.parse(localStorage.getItem("merchantData") || "{}");
        console.log("Merchant Data:", merchantData);
        let fieldsToUpdate = {
          "new-merchant-name": "merchant_name",
          "new-user-name": "user_name",
          "phone-num": "phone_number",
          "account-num": "account_number",
          "service-type": "service_type",
          "new-address": "address",
          "google-map-src": "google_map_src",
          "new-intro": "intro",
          "new-supply": "supply",
          "new-note": "note"
        };
        
        if (merchantData) {
            for (let [elementId, dataKey] of Object.entries(fieldsToUpdate)) {
                let element = document.getElementById(elementId);
              if (element) {
                element.value = merchantData[dataKey] || "";
              }
            };
        };
  };

  document.querySelector(".last-page").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".add-new-merchant-form").style.display = "block";
    document.querySelector(".add-new-merchant-form2").style.display = "none";
});