/*document.querySelector(".merchant-setting-title").addEventListener("click", () => {
    document.querySelector(".merchant-setting-form").style.display = "block";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "none";
    renderMerchantMemberPage(globalFetchData);
});*/

let globalFetchData = null;
let tokenValue = null;

async function merchantSettingInitialize(){
    let memberData = await fetchMerchantData();
    if (memberData) {
        globalFetchData = memberData;
        //renderMerchantMemberPage(memberData);
        merchantCalender();
        merchantColorList(memberData);
        renderColorToCalender();
        dotReaction();
        renderMerchantName(memberData);
        renderMerchantNameDiv(memberData);
        adjustInputWidths();
        document.querySelector(".order-setting-form").style.display = "none";
        addSearchOptionChangeListener();
        searchOrders();
        renderOldNewMerchantForm();
    }
};
merchantSettingInitialize();
//在這裡得到所有gmail對應的所有商家資料
async function fetchMerchantData() {
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

//在這裡顯示商家編輯資訊
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
        //let googleMapSrc = memberData[merchantName].google_map_src;
        let supply = memberData[merchantName].supply;
        let note = memberData[merchantName].note;
        let merchantOnBroad = memberData[merchantName].on_broad;
        let doorPassword = memberData[merchantName].door_password;
        
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
            //{ label: 'google map 定位連結', name: 'google_map_src', value: googleMapSrc },
            { label: '供應商品', name: 'supply', value: supply, isTextarea: true },
            { label: '注意事項', name: 'note', value: note, isTextarea: true },
            { label: '大門密碼', name: 'door_password', value: doorPassword },
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

function renderMerchantName(memberData) {
    for (let merchantName in memberData) {
        let merchantNameDiv = document.createElement('div');
        merchantNameDiv.textContent = merchantName;
        merchantNameDiv.className = 'merchant-name';
        merchantNameDiv.tag = merchantName;
        
        document.querySelector(".setting-list").appendChild(merchantNameDiv);
    };
};
function renderMerchantNameDiv(memberData) {
    document.querySelectorAll(".merchant-name").forEach((element) => {
        if (!element.querySelector('.merchant-infor') && !element.querySelector('.merchant-orders')) {
            let infoVisible = false;
            let timeoutId;
    
            let merchantInfor = document.createElement('div');
            merchantInfor.className = 'merchant-infor';
            merchantInfor.textContent = '商家資訊管理';
            merchantInfor.style.display = 'none';
    
            let merchantOrders = document.createElement('div');
            merchantOrders.className = 'merchant-orders';
            merchantOrders.textContent = '訂單管理';
            merchantOrders.style.display = 'none';
    
            element.appendChild(merchantInfor); 
            element.appendChild(merchantOrders);
            
            merchantAndOrders(element.textContent, merchantInfor, merchantOrders, memberData, element.tag);
            
            function showInfo() {
                merchantInfor.style.display = 'block';
                merchantOrders.style.display = 'block';
                infoVisible = true;
            }
    
            function hideInfo() {
                merchantInfor.style.display = 'none';
                merchantOrders.style.display = 'none';
                infoVisible = false;
            }
    
            function startHideTimer() {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (!element.matches(':hover') && 
                        !merchantInfor.matches(':hover') && 
                        !merchantOrders.matches(':hover')) {
                        hideInfo();
                    }
                }, 200); 
            }
    
            element.addEventListener("mouseover", () => {
                clearTimeout(timeoutId);
                if (!infoVisible) {
                    showInfo();
                }
            });
    
            element.addEventListener("mouseout", startHideTimer);
    
            [merchantInfor, merchantOrders].forEach(el => {
                el.addEventListener("mouseover", () => clearTimeout(timeoutId));
                el.addEventListener("mouseout", startHideTimer);
            });
        }
    });
};
//在這裡設定輸入框的寬度
function adjustInputWidth(input) {
    const valueLength = input.value.length;
    input.style.width = `${valueLength + 20}ch`;
}

function adjustInputWidths() {
    document.querySelectorAll('.intro').forEach(input => {
        adjustInputWidth(input);
    });
};

//在這裡送出編輯的商家資料
document.querySelector(".submit").addEventListener("click", async (event) => {
    event.preventDefault();
    document.querySelector(".sending-message").textContent = "資料送出中...";
    let token = document.cookie.split('; ').find(row => row.startsWith('token='));
    let tokenValue = token.split('=')[1];
    let submitButton = document.querySelector(".submit");
    submitButton.disabled = true; 

    // 收集所有商家資料
    let merchantData = {};
    let merchantDivs = document.querySelectorAll('.merchant-member-data > div');

    merchantDivs.forEach(merchantDiv => {
        let merchantName = merchantDiv.querySelector('h2').textContent;
        console.log(`Processing merchant: ${merchantName}`);  // 新增日誌
        
        let contact = merchantDiv.querySelector('.contact').value;
        let phoneNumber = merchantDiv.querySelector('.phone_number').value;
        let accountNum = merchantDiv.querySelector('.account_num').value;
        let intro = merchantDiv.querySelector('.intro').value;
        let address = merchantDiv.querySelector('.address').value;
        //let googleMapSrc = merchantDiv.querySelector('.google_map_src').value;
        let supply = merchantDiv.querySelector('.supply').value;
        let note = merchantDiv.querySelector('.note').value;
        let onlineStatus = merchantDiv.querySelector('.on-broad-checkbox').checked ? 1 : 0;
        let doorPassword = merchantDiv.querySelector('.door_password').value;

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
            account_num: accountNum,
            intro,
            address,
            google_map_src: 
            "https://www.google.com/maps/embed/v1/place?key=AIzaSyAc3N8bavhgecxeY7ldWBAYs5vpW3cC0q4&q=" + address,
            supply,
            note,
            service_hours: serviceHours,
            on_broad: onlineStatus,
            door_password: doorPassword
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

//在這裡設定訂單點擊事件
let url = null;
document.querySelector(".order-setting-title").addEventListener("click", () => {
    document.querySelector(".common-question-form").style.display = "none";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "block";
    document.querySelector(".merchant-calender-form").style.display = "none";
    document.querySelector(".add-new-merchant-form").style.display = "none";
    document.querySelector(".add-new-merchant-form2").style.display = "none";

    /*
    url = '/api/get_orders';
    fetchOrders(url);*/
});

let searchKeyword = null;
let searchCategory = null;
//在這裡設定搜尋catogory
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

//在這裡設定搜尋的訂單的url
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

//在這裡fetch搜尋的訂單
/*
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
        return data;   
    });
};*/

async function fetchOrders(url) {
    document.querySelector(".order-data-form").innerHTML = '';
    let merchantCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    let token = merchantCookie ? merchantCookie.split('=')[1] : '';
    
    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let data = await response.json();
        console.log("Fetched orders:", data);
        
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
            }
            orderDiv.setAttribute('id', order['order_id']);
            document.querySelector('.order-data-form').appendChild(orderDiv);   
        }  

        checkSingleOrder(data);   

        return data;  
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

//在這裡設定訂單編輯按鈕
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

//在這裡設定按鈕效果
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

function merchantAndOrders(merchantName, merchantInfor, merchantOrders, memberData, merchantTag) {
    console.log(merchantTag);

    merchantInfor.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector(".common-question-form").style.display = "none";
        document.querySelector(".merchant-setting-form").style.display = "block";
        document.querySelector(".order-setting-form").style.display = "none";
        document.querySelector(".merchant-calender-form").style.display = "none";
        document.querySelector(".add-new-merchant-form").style.display = "none";
        document.querySelector(".add-new-merchant-form2").style.display = "none";

        let dict = {};
        dict[merchantTag] = memberData[merchantTag];
        renderMerchantMemberPage(dict);
    });

    merchantOrders.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector(".common-question-form").style.display = "none";
        document.querySelector(".merchant-setting-form").style.display = "none";
        document.querySelector(".order-setting-form").style.display = "block";
        document.querySelector(".merchant-calender-form").style.display = "none";
        document.querySelector(".add-new-merchant-form").style.display = "none";
        document.querySelector(".add-new-merchant-form2").style.display = "none";
        url = `/api/get_orders?keyword=${merchantTag}&category=m.merchant_name`;
        fetchOrders(url);
        /*addSearchOptionChangeListener();
        document.getElementById("search-option").value = 'm.merchant_name';
        document.getElementById("search-keyword").value = merchantTag;*/
        setTimeout(() => {
            showFetchMerchant(merchantTag);
        }, 500);
    });
};

function showFetchMerchant(merchantTag) {
    document.querySelector("#search-option").value = 'm.merchant_name';
    if (!document.querySelector(".search-keyword")) {
        let merchantSelect = document.createElement("select");
        merchantSelect.classList.add("search-keyword"); 
        for (let merchantName in globalFetchData) {
            let optionMerchant = document.createElement("option");
            optionMerchant.value = merchantName;
            optionMerchant.textContent = merchantName;
            merchantSelect.appendChild(optionMerchant);
        };
        merchantSelect.value = merchantTag;
        document.querySelector(".search-bar").appendChild(merchantSelect);
    }
    else{
        document.querySelector(".search-keyword").value = merchantTag;
    }  
};

let calenderMonthList = 
        [["this_year", "this_month", "this_month_dates", "this_month_first_day", "today_date"],
        ["next_month_year", "next_month", "next_month_dates", "next_month_first_day", ""],
        ["next_next_month_year", "next_next_month", "next_next_month_dates", "next_next_month_first_day", ""]];

let currentMonthIndex = 0; 

function merchantCalender() {
    fetch('/api/calender')
    .then(response => response.json())
    .then(data => {
        let calenderData = data;
        console.log(calenderData);
        
        function renderMonth(index) {
            renderBasicCalender(
                calenderData[calenderMonthList[index][0]], 
                calenderData[calenderMonthList[index][1]], 
                calenderData[calenderMonthList[index][2]], 
                calenderData[calenderMonthList[index][3]], 
                calenderData[calenderMonthList[index][4]]
            );
        };
        
        renderMonth(currentMonthIndex);
        
        document.querySelector(".right-arrow").addEventListener("click", (event) => {
            event.preventDefault();
            currentMonthIndex = (currentMonthIndex + 1) % calenderMonthList.length; 
            renderMonth(currentMonthIndex);
            renderColorToCalender();
            dotReaction();
        });
        
        document.querySelector(".left-arrow").addEventListener("click", (event) => {
            event.preventDefault();
            currentMonthIndex = (currentMonthIndex - 1 + calenderMonthList.length) % calenderMonthList.length; 
            renderMonth(currentMonthIndex);
            renderColorToCalender();
            dotReaction();
        });
    });
};

function renderBasicCalender(year, month, dates, first_date, today = null) {
    document.querySelector(".calender-form").innerHTML = "";
    document.querySelector(".year").textContent = year;
    document.querySelector(".month").textContent = month;
    for (let i = 0; i < dates.length; i++) {
        let dateContainer = document.createElement("div");
        dateContainer.classList.add("date-container");
        let date = document.createElement("div");
        date.classList.add("date");
        date.textContent = dates[i];
        dateContainer.appendChild(date);
        let colorContainer = document.createElement("div");
        colorContainer.classList.add("merchant-color-container");
        dateContainer.appendChild(colorContainer);
        document.querySelector(".calender-form").appendChild(dateContainer);

        if (i === 0) {
            dateContainer.style.gridColumnStart = first_date+1;
        };

        if (today != "") {
            if (dates[i] === today) {
                dateContainer.classList.add("today");
            };
        };
    };
};

let merchantColorDict = {};
/*{
    "IKEA展示間": "brown",
    "本能寺會客室": "red",
    "皇家露營區": "orange",
    "山海之間": "yellow",
    "林園撞球館": "green",
    "test": "blue"
}*/
function merchantColorList(memberData) {
    let merchantList = [];
    let colorList = [
        'brown', 'red', 'orange', 'yellow', 'green', 
        'blue', 'purple', 'pink', 'black', 'gray', 
        'teal', 'navy', 'maroon', 'olive', 'lime', 
        'aqua', 'fuchsia', 'indigo', 'coral', 'gold'
    ];
    for (let merchantName in memberData) {
        merchantList.push(merchantName);
    };

    for (let i = 0; i < merchantList.length; i++) {
        let merchantName = document.createElement("div");
        let merchantColor = document.createElement("div");
        merchantColor.style.backgroundColor = colorList[i];
        merchantColor.classList.add("merchant-color");
        merchantName.textContent = merchantList[i];
        merchantName.appendChild(merchantColor);
        merchantName.classList.add("merchant-name-in-color-list");
        document.querySelector(".merchant-color-list").appendChild(merchantName);

        merchantColorDict[merchantList[i]] = colorList[i];
    };
};

let monthToDigit = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12"
};

async function renderColorToCalender() {
    let url = `/api/get_orders?keyword=1&category=o.is_paid`;
    let totalOrderData = await fetchOrders(url);
    console.log("totalOrderData", totalOrderData);

    if (!totalOrderData || totalOrderData.length === 0) {
        console.error('No order data available');
        return;
    }

    for (let i = 0; i < totalOrderData.length; i++) {
        let order = totalOrderData[i];
        let orderDigitMonth = order.date.split('-')[1];
        let orderMonth = Object.keys(monthToDigit).find(key => monthToDigit[key] === orderDigitMonth);
        let orderDay = order.date.split('-')[2];

        let currentMonth = document.querySelector(".month").textContent.trim();
        let dates = document.querySelectorAll(".date");

        for (let date of dates) {
            if ((date.textContent.trim() === orderDay || `0${date.textContent}`.trim() === orderDay.toString()) && orderMonth === currentMonth) {
                let merchantColorDiv = document.createElement("div");
                let color = merchantColorDict[order.merchant_name];
                if (color) {
                    merchantColorDiv.style.backgroundColor = color;
                } else {
                    console.warn(`Color for merchant "${order.merchant_name}" not found`);
                    merchantColorDiv.style.backgroundColor = 'gray'; 
                }
                merchantColorDiv.classList.add("merchant-color-on-calender");
                merchantColorDiv.setAttribute("order-id", order.order_id);
                merchantColorDiv.setAttribute("merchant-name", order.merchant_name);
                let container = date.closest(".date-container").querySelector(".merchant-color-container");
                container.appendChild(merchantColorDiv);
                break; 
            };
        };
    };
    dotReaction();
};

function dotReaction() {
    let merchantColorList = document.querySelectorAll(".merchant-color");
    document.querySelectorAll(".merchant-color-on-calender").forEach(merchantColor => {
        merchantColor.addEventListener("mouseover", (event) => {
            let currentColor = event.target.style.backgroundColor;
            let sameMerchantColorDots = document.querySelectorAll(".merchant-color-on-calender");
            for (let dot of sameMerchantColorDots) {
                if (currentColor === dot.style.backgroundColor) {
                    dot.style.opacity = 0.5;
                };
            };

            for (let color of merchantColorList) {
                if (currentColor === color.style.backgroundColor) {
                    color.parentElement.style.opacity = 0.5;
                };
            };
        });
    
        merchantColor.addEventListener("mouseout", (event) => {
            let sameMerchantColorDots = document.querySelectorAll(".merchant-color-on-calender");
            for (let dot of sameMerchantColorDots) {
                dot.style.opacity = 1;
            };
            for (let color of merchantColorList) {
                color.parentElement.style.opacity = 1;
            };
        });
    });

    let merchantNameColorList = document.querySelectorAll(".merchant-name-in-color-list");
    let merchantColorOnCalender = document.querySelectorAll(".merchant-color-on-calender");
    merchantNameColorList.forEach(merchantName => {
        merchantName.addEventListener("mouseover", (event) => {
            let currentColor = event.target.querySelector(".merchant-color").style.backgroundColor;
            for (let dot of merchantColorOnCalender) {
                if(currentColor === dot.style.backgroundColor) {
                    dot.style.opacity = 0.5;
                    merchantName.style.opacity = 0.5;
                };
            }
        });
    
        merchantName.addEventListener("mouseout", (event) => {
            for (let dot of merchantColorOnCalender) {
                dot.style.opacity = 1;
                merchantName.style.opacity = 1;
            }
        });
    });
    let merchantDots = document.querySelectorAll(".merchant-color-on-calender");
    merchantDots.forEach(merchantDot => {
        if (merchantDot.classList.contains("clicked")) {
            merchantDot.classList.remove("clicked");
        }
        merchantDot.addEventListener("click", (event) => {
            merchantDots.forEach(dot => dot.classList.remove("clicked"));
            event.target.classList.add("clicked");
            let orderId = event.target.getAttribute("order-id");
            checkOrderDetailbyDot(orderId);
        });
    });
};

async function checkOrderDetailbyDot(orderId) {
    let url = `/api/get_orders?keyword=${orderId}&category=o.id`;
    let orderDetail = await fetchOrders(url);      
    console.log("orderDetail", orderDetail);

    let orderDetailContainer = document.createElement("div");
    orderDetailContainer.classList.add("order-detail-container");
    document.querySelector(".order-detail-form").innerHTML = "";
    orderDetailContainer.innerHTML = `
    <strong>預約場地: ${orderDetail[0].merchant_name}</strong>
    <div>預約日期: ${orderDetail[0].date}</div>
    <div>預約時間: ${orderDetail[0].time_start} - ${orderDetail[0].time_end}</div>
    <div>預約時段: ${orderDetail[0].service_time_name}</div>
    <div>訂單狀態: ${orderDetail[0].is_paid}</div>
    <div>訂單編號: ${orderDetail[0].order_number}</div>
    <div>銀行交易碼: ${orderDetail[0].prime}</div>
    <div>單筆金額: ${orderDetail[0].price}</div>
    <div>訂單總金額: ${orderDetail[0].total_price}</div>
    <div>訂單備註: ${orderDetail[0].comment}</div>
    <strong class = "contact-info">聯絡方式</strong>
    <div>姓名: ${orderDetail[0].booking_name_user}</div>
    <div>電話: ${orderDetail[0].booking_phone_number_user}</div>
    <div>信箱: ${orderDetail[0].booking_gmail}</div>
    `;

    document.querySelector(".order-detail-form").appendChild(orderDetailContainer);
    document.querySelector(".order-detail-form").style.display = "block";
};

document.querySelector(".merchant-calender").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".common-question-form").style.display = "none";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "block";
    document.querySelector(".add-new-merchant-form").style.display = "none";
    document.querySelector(".add-new-merchant-form2").style.display = "none";

});

document.querySelector(".add-merchant-title").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".common-question-form").style.display = "none";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "none";
    document.querySelector(".add-new-merchant-form").style.display = "block";
    document.querySelector(".add-new-merchant-form2").style.display = "none";
    renderOldNewMerchantForm();
});

document.querySelector(".common-question-title").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".common-question-form").style.display = "block";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "none";
    document.querySelector(".add-new-merchant-form").style.display = "none";
    document.querySelector(".add-new-merchant-form2").style.display = "none";

});
/*
document.querySelector(".question-mark").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".common-question-form").style.display = "block";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "none";
    document.querySelector(".add-new-merchant-form").style.display = "none";
    document.querySelector(".add-new-merchant-form2").style.display = "none";
    let tutorialElement = document.querySelector('.google-map-src-tutorial-title');
    tutorialElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    tutorialElement.classList.add('flash');
    
    setTimeout(() => {
        tutorialElement.classList.remove('flash');
    }, 1000); 
});*/

document.querySelector(".last-page").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".common-question-form").style.display = "none";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "none";
    document.querySelector(".add-new-merchant-form").style.display = "block";
    document.querySelector(".add-new-merchant-form2").style.display = "none";
});

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
    /*let googleMapRawData = document.getElementById("google-map-src").value;
    let srcRegex = /src="([^"]*)"/;
    let match = googleMapRawData.match(srcRegex);
    if (!match) {
        alert("Google 地圖網址格式錯誤。");
        return;
    };*/
    let googleMapSrc = "https://www.google.com/maps/embed/v1/place?key=AIzaSyAc3N8bavhgecxeY7ldWBAYs5vpW3cC0q4&q=" + address;

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
    document.querySelector(".common-question-form").style.display = "none";
    document.querySelector(".merchant-setting-form").style.display = "none";
    document.querySelector(".order-setting-form").style.display = "none";
    document.querySelector(".merchant-calender-form").style.display = "none";
    document.querySelector(".add-new-merchant-form").style.display = "none";
    document.querySelector(".add-new-merchant-form2").style.display = "block";
});

function renderOldNewMerchantForm() {
    let newMerchantForm = document.querySelector(".add-new-merchant-form");
    if (newMerchantForm?.style.display === "block") {
      try {
        let merchantData = JSON.parse(localStorage.getItem("merchantData") || "{}");
        
        let fieldsToUpdate = {
          "new-merchant-name": "merchant_name",
          "new-user-name": "user_name",
          "phone-num": "phone_number",
          "account-num": "account_number",
          "service-type": "service_type",
          "new-address": "address",
          //"google-map-src": "google_map_src",
          "new-intro": "intro",
          "new-supply": "supply",
          "new-note": "note"
        };
  
        for (let [elementId, dataKey] of Object.entries(fieldsToUpdate)) {
            let element = document.getElementById(elementId);
          if (element) {
            element.value = merchantData[dataKey] || "";
          }
        }
      } catch (error) {
        console.error("Error parsing merchant data:", error);
      };
    };
  };
