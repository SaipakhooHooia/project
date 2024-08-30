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

selector('#service-time-start');
selector('#service-time-end');

function addTimeGroup() {
    const lineBreak1 = document.createElement('br');
    const startTimeLabel = document.createElement('label');
    startTimeLabel.setAttribute('for', 'service-time-start');
    startTimeLabel.textContent = '開始時間';
    
    const startTimeInput = document.createElement('select');
    startTimeInput.setAttribute('id', 'service-time-start');
    startTimeInput.setAttribute('name', 'service-time-start');

    const lineBreak2 = document.createElement('br');

    const endTimeLabel = document.createElement('label');
    endTimeLabel.setAttribute('for', 'service-time-end');
    endTimeLabel.textContent = '結束時間';
    
    const endTimeInput = document.createElement('select');
    endTimeInput.setAttribute('id', 'service-time-end');
    endTimeInput.setAttribute('name', 'service-time-end');

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
    selector('#service-time-start');
    selector('#service-time-end');

    document.querySelectorAll('.delete-setting-button').forEach((button) => {
        button.addEventListener('click', (event) => {
            let parentElement = event.target.closest('.service-time-setting');
    
            if (parentElement) {
                parentElement.remove(); 
            }
        });
    });
};

document.querySelector(".submit").addEventListener("click", async (event) => {
    event.preventDefault();
    document.querySelector(".message").textContent = "資料上傳中，請稍後...";
    const form = document.getElementById('form');
    const formData = new FormData(form);
    formData.delete('image');//清除之前選取的圖片
    const images = document.getElementById('image').files;

    let resizedImages = [];

    // 將所有圖片調整大小並轉換為 Blob
    for (let i = 0; i < images.length; i++) {
        const resizedImage = await resizeImage(images[i],600, 600); 
        resizedImages.push(resizedImage);
    }

    // 將調整大小後的圖片加入 FormData
    resizedImages.forEach((resizedImage, index) => {
        formData.append('image', resizedImage, `image-${index}.jpg`);
    });

    let cookie = getTokenFromString(document.cookie);

    formData.append("token", cookie);
    let payload = {};
    const serviceTimeSettings = document.querySelectorAll('.service-time-setting');
    serviceTimeSettings.forEach((serviceTimeSetting, index) => {
        payload[index] = {
            start: serviceTimeSetting.querySelector('#service-time-start').value,
            end: serviceTimeSetting.querySelector('#service-time-end').value,
            price: serviceTimeSetting.querySelector('#price').value,
            name: serviceTimeSetting.querySelector('#service-time-name').value
        };
    });

    let merchantOnBroad = document.querySelector(".on-broad-checkbox").checked;
    let agreement = document.querySelector(".agreement-checkbox").checked;

    if(!agreement){
        alert("請勾選同意條款");
        return;
    }

    payload['merchant_on_broad'] = merchantOnBroad;
    payload['agreement'] = agreement;

    formData.append('service_hour', JSON.stringify(payload));

    console.log(formData.get("service_hour"));
    console.log(formData.getAll("image"));
    try {
        const response = await fetch('/api/merchant-setting', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log(data);
        document.querySelector('#blah').setAttribute('src', 'http://placehold.it/180');
        if(data.ok){
            window.location.href = '/';
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