let globalFetchData = null;
let tokenValue = null;
async function initialize(){
    let memberData = await authorize();
    if (memberData) {
        globalFetchData = memberData;
        renderMerchantMemberPage(memberData);
        adjustInputWidths();
    }
};
initialize();

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
        }

        merchantDiv.appendChild(serviceHoursContainer);
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
            service_hours: serviceHours
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

        if (data === true) {
            alert('商家資料已更新');
            location.reload();
        }
});

