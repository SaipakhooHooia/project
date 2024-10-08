const token = document.cookie.split('; ').find(row => row.startsWith('token='));
if (!token) {
    window.location.href = '/';
}

document.querySelector(".add").addEventListener("click", () => {
    addTimeGroup();
})

document.querySelector(".service-agreement").addEventListener("click", () => {
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

selector('#new-service-time-start');
selector('#new-service-time-end');

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

document.querySelector(".submit-new-merchant").addEventListener("click", async (event) => {
    event.preventDefault();
    document.querySelector(".submit-new-merchant-message").textContent = "資料上傳中，請稍後...";
    const form = document.getElementById('form');
    const formData = new FormData(form);
    formData.delete('image');
    const images = document.getElementById('image').files;
    let submitButton = document.querySelector(".submit-new-merchant");
    submitButton.disabled = true; 

    let resizedImages = [];

    for (let i = 0; i < images.length; i++) {
        const resizedImage = await resizeImage(images[i],600, 600); 
        resizedImages.push(resizedImage);
    }

    resizedImages.forEach((resizedImage, index) => {
        formData.append('image', resizedImage, `image-${index}.jpg`);
    });

    let cookie = getTokenFromString(document.cookie);

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
        const response = await fetch('/api/add-merchant', {
            method: 'POST',
            headers: {
                'Authorization': cookie
            },
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
}