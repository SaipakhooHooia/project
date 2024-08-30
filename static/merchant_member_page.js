document.querySelector(".merchant-setting-title").addEventListener("click", () => {
    document.querySelector(".merchant-setting-form").style.display = "block";
    document.querySelector(".order-setting-form").style.display = "none";
    merchantSettingInitialize();
});

let globalFetchData = null;
let tokenValue = null;

async function merchantSettingInitialize(){
    let memberData = await authorize();
    if (memberData) {
        globalFetchData = memberData;
        renderMerchantMemberPage(memberData);
        adjustInputWidths();
        document.querySelector(".order-setting-form").style.display = "none";
        addSearchOptionChangeListener();
        searchOrders();
    }
};
merchantSettingInitialize();

async function authorize() {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (!token) {
        window.location.href = '/';
        return null; 
    }

    tokenValue = token.split('=')[1];
    try {
        let response = await fetch('/api/merchant_auth', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": tokenValue
            }
        });

        let data = await response.json();
        if (data.error) {
            window.location.href = '/';
            return null;  
        } else {
            return data; 
        }
    } catch (error) {
        console.error('Authorization failed:', error);
        return null; 
    }
}

function renderMerchantMemberPage(memberData) {
    // 清空之前的内容
    const merchantMemberDataContainer = document.querySelector(".merchant-member-data");
    merchantMemberDataContainer.innerHTML = '';

    for (let merchantName in memberData) {
        let contact = memberData[merchantName].contact;
        let intro = memberData[merchantName].intro;
        let merchantID = memberData[merchantName].merchant_id;
        let phoneNumber = memberData[merchantName].phone_number;
        let address = memberData[merchantName].address;
        let googleMapSrc = memberData[merchantName].google_map_src;
        let supply = memberData[merchantName].supply;
        let note = memberData[merchantName].note;
        let merchantOnBroad = memberData[merchantName].on_broad;
        
        let merchantDiv = document.createElement('div');
        merchantDiv.className = `merchant ${merchantName.replace(/\s+/g, '-')}`;
        
        let formContent = `
            <h2>${merchantName}</h2>
            <label for="contact">負責人</label>
            <input value="${contact}" class="contact" name="contact"/>
            <br>
            <label for="intro">場地描述</label>
            <input value="${intro}" class="intro" name="intro"/>
            <br>
            <label for="merchant_id">Merchant ID</label>
            <input value="${merchantID}" class="merchant_id" name="merchant_id"/>
            <br>
            <label for="phone_number">連絡電話</label>
            <input value="${phoneNumber}" class="phone_number" name="phone_number"/>
            <br>
            <label for="address">場地位址</label>
            <input value="${address}" class="address" name="address"/>
            <br>
            <label for="google_map_src">google map 定位連結</label>
            <input value="${googleMapSrc}" class="google_map_src" name="google_map_src"/>
            <br>
            <label for="supply">供應商品</label>
            <input value="${supply}" class="supply" name="supply"/>
            <br>
            <label for="note">注意事項</label>
            <input value="${note}" class="note" name="note"/>
        `;

        merchantDiv.innerHTML = formContent;

        let serviceHoursContainer = document.createElement('div');
        serviceHoursContainer.className = 'service-hours-container';
        
        for (let serviceHour of memberData[merchantName].service_hours) {
            let startTime = serviceHour.startTime;
            let endTime = serviceHour.endTime;
            let price = serviceHour.price;
            let serviceTimeName = serviceHour.serviceHourName;

            let serviceHourDiv = document.createElement('div');
            serviceHourDiv.className = 'service-hour';
            serviceHourDiv.innerHTML = `
                <label for="start-time">營業開始時間</label>
                <input value="${startTime}" class="start-time" name="start-time"/>
                <br>
                <label for="end-time">營業結束時間</label>
                <input value="${endTime}" class="end-time" name="end-time"/>
                <br>
                <label for="price">金額</label>
                <input value="${price}" class="price" name="price"/>
                <br>
                <label for="service-time">時段名稱</label>
                <input value="${serviceTimeName}" class="service-time" name="service-time"/>
                <br>
            `;
            
            serviceHoursContainer.appendChild(serviceHourDiv);
        };
        let onBroad = document.createElement('div');
        onBroad.className = 'on-broad';
        onBroad.innerHTML = `
            <input type="checkbox" id="online-status" name="on-broad" class ="on-broad-checkbox">
            <label for="online-status">上線狀態</label> 
        `;

        if (merchantOnBroad) {
            onBroad.querySelector('.on-broad-checkbox').checked = true;
        };
        merchantDiv.appendChild(serviceHoursContainer);
        serviceHoursContainer.appendChild(onBroad);
        merchantMemberDataContainer.appendChild(merchantDiv);
    }
}

function adjustInputWidth(input) {
    const valueLength = input.value.length;
    input.style.width = `${valueLength + 20}ch`;
}

function adjustInputWidths() {
    document.querySelectorAll('.intro').forEach(input => {
        adjustInputWidth(input);
    });
};

document.querySelector(".submit").addEventListener("click", async (event) => {
    event.preventDefault();
    document.querySelector(".sending-message").textContent = "資料送出中...";
    let token = document.cookie.split('; ').find(row => row.startsWith('token='));
    let tokenValue = token.split('=')[1];

    // 收集所有商家資料
    let merchantData = {};
    let merchantDivs = document.querySelectorAll('.merchant-member-data > div');

    merchantDivs.forEach(merchantDiv => {
        let merchantName = merchantDiv.querySelector('h2').textContent;
        console.log(`Processing merchant: ${merchantName}`);  // 新增日誌
        
        let contact = merchantDiv.querySelector('.contact').value;
        let phoneNumber = merchantDiv.querySelector('.phone_number').value;
        let merchantID = merchantDiv.querySelector('.merchant_id').value;
        let intro = merchantDiv.querySelector('.intro').value;
        let address = merchantDiv.querySelector('.address').value;
        let googleMapSrc = merchantDiv.querySelector('.google_map_src').value;
        let supply = merchantDiv.querySelector('.supply').value;
        let note = merchantDiv.querySelector('.note').value;
        let onlineStatus = merchantDiv.querySelector('.on-broad-checkbox').checked ? 1 : 0;

        let serviceHours = [];
        // 修改選擇器，使用更具體的類名
        let serviceHourDivs = merchantDiv.querySelectorAll('.service-hour');
        console.log(`Number of service hours found: ${serviceHourDivs.length}`);  // 新增日誌

        serviceHourDivs.forEach((serviceHourDiv, index) => {
            console.log(`Processing service hour ${index + 1}`);  // 新增日誌
            serviceHours.push({
                startTime: serviceHourDiv.querySelector('.start-time').value,
                endTime: serviceHourDiv.querySelector('.end-time').value,
                price: serviceHourDiv.querySelector('.price').value,
                serviceHourName: serviceHourDiv.querySelector('.service-time').value
            });
        });

        merchantData[merchantName] = {
            contact,
            phone_number: phoneNumber,
            merchant_id: merchantID,
            intro,
            address,
            google_map_src: googleMapSrc,
            supply,
            note,
            service_hours: serviceHours,
            on_broad: onlineStatus
        };

        console.log(`Collected data for ${merchantName}:`, merchantData[merchantName]);  // 新增日誌
    });

    console.log("Original data:", globalFetchData);  // 新增日誌
    console.log("Modified data:", merchantData);  // 修改日誌輸出

    let combinedData = [globalFetchData, merchantData, tokenValue];
    console.log("Combined data:", combinedData);  // 新增日誌
        let response = await fetch('/api/update_merchant_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': tokenValue
            },
            body: JSON.stringify(combinedData)
        });

        let data = await response.json();

        if (data.message) {
            alert(data.message);
            location.reload();
        }
        else if (data.error) {
            alert(data.error);
        }
});

let url = null;
document.querySelector(".order-setting-title").addEventListener("click", () => {
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "block";
    /*
    url = '/api/get_orders';
    fetchOrders(url);*/
});

let searchKeyword = null;
let searchCategory = null;
function addSearchOptionChangeListener() {
    document.querySelector("#search-option").addEventListener("change", (event) => {
        let searchCategory = event.target.value;
        
        let existingSelect = document.querySelector(".search-bar .search-keyword");
        if (existingSelect) {
            existingSelect.remove();
        }

        if (searchCategory === 'o.is_paid') {
            let isPaidSelect = document.createElement("select");
            isPaidSelect.classList.add("search-keyword"); 
            let optionIsPaid = document.createElement("option");
            optionIsPaid.value = "1";
            optionIsPaid.textContent = "已付款";
            
            let optionIsNotPaid = document.createElement("option");
            optionIsNotPaid.value = "0";
            optionIsNotPaid.textContent = "未付款";

            let optionIsRefund = document.createElement("option");
            optionIsRefund.value = "2";
            optionIsRefund.textContent = "已退款";
            
            isPaidSelect.appendChild(optionIsPaid);
            isPaidSelect.appendChild(optionIsNotPaid);
            isPaidSelect.appendChild(optionIsRefund);
            
            document.querySelector(".search-bar").appendChild(isPaidSelect);
        } else if (searchCategory === 'm.merchant_name') { 
            let merchantSelect = document.createElement("select");
            merchantSelect.classList.add("search-keyword"); 
            console.log(globalFetchData);
            for (let merchantName in globalFetchData) {
                let optionMerchant = document.createElement("option");
                optionMerchant.value = merchantName;
                optionMerchant.textContent = merchantName;
                
                merchantSelect.appendChild(optionMerchant);
            }
            document.querySelector(".search-bar").appendChild(merchantSelect);
        } else if (searchCategory === 'o.prime') { 
            let primeInput = document.createElement("input");
            primeInput.setAttribute("placeholder", "輸入銀行交易碼");
            primeInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(primeInput);
        } else if (searchCategory === 'o.booking_name_user') { 
            let nameInput = document.createElement("input");
            nameInput.setAttribute("placeholder", "輸入預約姓名");
            nameInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(nameInput);
        } else if (searchCategory === 'o.booking_phone_number_user') { 
            let phoneInput = document.createElement("input");
            phoneInput.setAttribute("placeholder", "輸入預約電話");
            phoneInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(phoneInput);
        } else if (searchCategory === 'o.booking_gmail') { 
            let mailInput = document.createElement("input");
            mailInput.setAttribute("placeholder", "輸入預約信箱");
            mailInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(mailInput);
        } else if (searchCategory === 'o.total_price') { 
            let totalPriceInput = document.createElement("input");
            totalPriceInput.setAttribute("placeholder", "輸入總金額");
            totalPriceInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(totalPriceInput);
        } else if (searchCategory === 'o.date') { 
            let dateInput = document.createElement("input");
            dateInput.setAttribute("placeholder", "年/月/日");
            dateInput.setAttribute("type", "date");
            dateInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(dateInput);
        } else if (searchCategory === 'o.service_time_name') { 
            let seviceTimeNameInput = document.createElement("input");
            seviceTimeNameInput.setAttribute("placeholder", "輸入時段名稱");
            seviceTimeNameInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(seviceTimeNameInput);
        } else if (searchCategory === 'o.order_number') { 
            let orderNumInput = document.createElement("input");
            orderNumInput.setAttribute("placeholder", "輸入訂單編號");
            orderNumInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(orderNumInput);
        } else if (searchCategory === 'o.comment') { 
            let commentInput = document.createElement("input");
            commentInput.setAttribute("placeholder", "輸入備註內容");
            commentInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(commentInput);
        } else if (searchCategory === 'blur') { 
            let blurInput = document.createElement("input");
            blurInput.setAttribute("placeholder", "輸入關鍵字");
            blurInput.classList.add("search-keyword");
            document.querySelector(".search-bar").appendChild(blurInput);
        };
    });
}

function searchOrders(){
    document.querySelector(".search-orders").addEventListener("click", (event) => {
        event.preventDefault();
        searchCategory = document.querySelector("#search-option").value;
        if (searchCategory === '') {
            url = `/api/get_orders`;
            fetchOrders(url);
        }
        else{
            searchKeyword = document.querySelector(".search-keyword").value;
            url = `/api/get_orders?keyword=${searchKeyword}&category=${searchCategory}`;
            fetchOrders(url);
        };
    });
};

function fetchOrders(url){
    document.querySelector(".order-data-form").innerHTML = '';
    let merchantCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    let token = merchantCookie ? merchantCookie.split('=')[1] : '';
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        for (let i = 0; i < data.length; i++) {
            let order = data[i];
            let orderDiv = document.createElement('div');
            orderDiv.className = 'order-data';
            for (let key in order) {
                    if (key === 'order_id') continue;
                    if (key === 'is_paid' && order[key] === 1) {
                        order[key] = '付款成功';
                    }
                    else if (key === 'is_paid' && order[key] === 0) {
                        order[key] = '付款失敗';
                    }
                    else if (key === 'is_paid' && order[key] === 2) {
                        order[key] = '已退款';
                    };
                    if (order[key] === null) {
                        order[key] = '無';
                    };
                    let orderContent = document.createElement('div');
                    orderContent.textContent = `${order[key]}`;
                    if (orderContent.textContent === '付款成功') {
                        orderContent.style.color = 'green';
                    }
                    else if (orderContent.textContent === '付款失敗') {
                        orderContent.style.color = 'red';
                    }
                    else if (orderContent.textContent === '已退款') {
                        orderContent.style.color = 'blue';
                    }
                    orderDiv.appendChild(orderContent);
            };
            orderDiv.setAttribute('id',(order['order_id']));
            document.querySelector('.order-data-form').appendChild(orderDiv);   
        };  
        checkSingleOrder(data);      
    });
};

function checkSingleOrder(orderData){
    document.querySelectorAll(".order-data").forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            let singleOrderDataisChecked = document.querySelector(".single-order-data");
            if (singleOrderDataisChecked) {
                singleOrderDataisChecked.remove();
            };
            const clickedOrderId = parseInt(event.currentTarget.id, 10);
            console.log(clickedOrderId);
            for (let order of orderData) {
                if (order["order_id"] === clickedOrderId) {
                    //console.log(order);
                    const newDiv = document.createElement("div");
                    for (let key in order) {
                        let newContentLabel = document.createElement("label");
                        newContentLabel.textContent = `${key}:`;
                        newContentLabel.className = "single-order-label";
                        let newContentInput = document.createElement("div");
                        newContentInput.textContent = `${order[key]}`;
                        newContentInput.className = "single-order-input";
                        let newContentContainer = document.createElement("div");
                        newContentContainer.className = "single-order-container";
                        newContentContainer.style.display = "flex";
                        newContentContainer.appendChild(newContentLabel);
                        newContentContainer.appendChild(newContentInput);
                        if (key === "order_id") {
                            newContentContainer.style.display = "none";
                        }
                        newDiv.appendChild(newContentContainer);
                    };
                    newDiv.className = "single-order-data";
                    let editButton = document.createElement("button");
                    editButton.className = "edit-button";
                    editButton.textContent = "編輯";
                    newDiv.appendChild(editButton);
                    let saveButton = document.createElement("button");
                    saveButton.className = "save-button";
                    saveButton.textContent = "保存";
                    newDiv.appendChild(saveButton);
                    let deleteButton = document.createElement("button");
                    deleteButton.className = "delete-button";
                    deleteButton.textContent = "刪除此筆訂單";
                    newDiv.appendChild(deleteButton);
                    let refundButton = document.createElement("button");
                    refundButton.className = "refund-button";
                    refundButton.textContent = "退款";
                    newDiv.appendChild(refundButton);
                    event.currentTarget.insertAdjacentElement('afterend', newDiv);
                    setTimeout(() => {
                        newDiv.style.opacity = 1;
                        newDiv.style.transform = 'translateY(0)'; 
                    }, 50);
                    buttonEffect(editButton, deleteButton, refundButton, saveButton, order, clickedOrderId);
                };
            };
        });
    });
};

function buttonEffect(editButton, deleteButton, refundButton, saveButton, originalContent, clickedOrderId){
    console.log(originalContent);
    let containers = document.querySelectorAll(".single-order-container");
    let orderInputs = document.querySelectorAll(".single-order-input");
    /*for (let orderInput of orderInputs) {
        
    }*/
    editButton.addEventListener("click", (event) => {
        event.preventDefault();
        for (let container of containers) {
            const editableFields = ['booking_name_user', 'booking_phone_number_user', 'booking_gmail', 'date', 'time_start', 'time_end'];
            for (let field of editableFields) {
                if (container.querySelector(`.single-order-label`).textContent === `${field}:`) {
                    container.querySelector(`.single-order-input`).contentEditable = true;
                    container.querySelector(`.single-order-input`).classList.add("editable-field");
                };
            };
        };
    });
    saveButton.addEventListener("click", (event) => {
        event.preventDefault(); 
        
        let contentInputs = document.querySelectorAll(".single-order-input");
        let editedContent = {};
        for (let input of contentInputs) {
            let container = input.closest(".single-order-container");
            if (container) {
                let labelText = container.querySelector(".single-order-label").textContent;
                if (labelText === 'time_start:' || labelText === 'time_end:') {
                    let timePattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):00$/;
                    if (!timePattern.test(input.textContent)) {
                        alert('請輸入正確的時間格式，如 09:00');
                        return;
                    }
                }
                else if (labelText === 'date:') {
                    let currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    let datePattern = /^\d{4}-\d{2}-\d{2}$/;
                    let inputDate = new Date(input.textContent);
                    inputDate.setHours(0, 0, 0, 0);
                    if (!datePattern.test(input.textContent)) {
                        alert('請輸入正確的日期格式，如 2020-01-01');
                        return;
                    };
                    if (inputDate <= currentDate) {
                        alert('請選擇明天以後的日期');
                        return;
                    };
                    let originalOrderDate = new Date(originalContent['date']);
                    originalOrderDate.setHours(0, 0, 0, 0);
                    if (originalOrderDate < currentDate) {
                        alert('該筆訂單已過期，無法編輯');
                        return;
                    };
                }
                
                input.contentEditable = false;
                input.classList.remove("editable-field");
                let editedLabelText = labelText.split(':')[0];
                let editedValue = input.textContent;
                editedContent[editedLabelText] = editedValue;
            }
        }
        console.log(editedContent);
        let conbinedContent = [originalContent, editedContent];
        console.log(conbinedContent);
        
        let sendingMessage = document.createElement("strong");
        sendingMessage.textContent = "資料上傳中...";
        document.querySelector(".single-order-data").appendChild(sendingMessage);

        fetch(`/api/edit_order/${clickedOrderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': tokenValue
            },
            body: JSON.stringify(conbinedContent)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message){
                    alert(data.message);
                }
                else if (data.error) {
                    alert(data.error);
                };
            });
    });
    
    deleteButton.addEventListener("click", (event) => {
        event.preventDefault();
        
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        let originalOrderDate = new Date(originalContent['date']);
        originalOrderDate.setHours(0, 0, 0, 0);
        if (originalOrderDate < currentDate) {
            alert('該筆訂單已過期，無法刪除');
            return;
        }
        else{
            let sendingMessage = document.createElement("strong");
            sendingMessage.textContent = "資料確認中...";
            document.querySelector(".single-order-data").appendChild(sendingMessage);

            fetch(`/api/delete_order/${clickedOrderId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokenValue
                }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message){
                        alert(data.message);
                        document.querySelector(".single-order-data").style.display = "none";
                        document.getElementById(`${clickedOrderId}`).style.display = "none";
                    }
                    else if (data.error) {
                        alert(data.error);
                    };
                });
        }
        //deleteOrder(event.currentTarget.parentElement.id);
    });
    refundButton.addEventListener("click", (event) => {
        event.preventDefault();
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        let originalOrderDate = new Date(originalContent['date']);
        originalOrderDate.setHours(0, 0, 0, 0);
        if (originalOrderDate < currentDate) {
            alert('該筆訂單已過期，無法刪除');
            return;
        }
        else{
            let sendingMessage = document.createElement("strong");
            sendingMessage.textContent = "資料確認中...";
            document.querySelector(".single-order-data").appendChild(sendingMessage);

            fetch(`/api/refund_order/${clickedOrderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokenValue
                }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message){
                        alert(data.message);
                        location.reload();
                    }
                    else if (data.error) {
                        alert(data.error);
                    };
            });
        }
    });
};