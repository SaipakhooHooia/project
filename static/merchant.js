let currentUrl = window.location.href;
let urlObj = new URL(currentUrl);
let path = urlObj.pathname;
let keyword = decodeURIComponent(path.split("/")[2]);
console.log(keyword);

let fetchData = null;
let calendarData = null;
let serviceHourData = null;
let orderData = null;
async function initialize(){
    //document.querySelector(".selected-time").innerHTML = "";
    let response = await fetch("/api/merchant/" + keyword);
    let data = await response.json();
    fetchData = data;
    orderData = fetchData.order_history;
    calendarData = data[keyword].calender;
    console.log(orderData);
    serviceHourData = data[keyword].service_hours;
    renderImg(fetchData[keyword].images);
    let serviceHourList = getServiceHour(serviceHourData);
    renderCalender(calendarData);
    /*let serviceHourRange = renderServiceHour(serviceHourList);
    renderHour(calendarData, serviceHourRange);
    renderCurrentHour(calendarData.today_hour);*/
    toggleSelectedDate(serviceHourList, orderData);
    slideImages();
    caculateMerchantInfoWidth();
    renderMerchantInfo(fetchData, serviceHourList);
    checkListButton();
}

initialize();

function getServiceHour(serviceHourData) {
    let serviceHourList = [];
    let serviceHour = null;
    if (serviceHourData.includes("|")) {//15:00,11:00,1200,過夜場|6:00,12:00,800,休憩
        serviceHour = serviceHourData.split("|");//serviceHour = "15:00,11:00,1200,過夜場","6:00,12:00,800,休憩"
    }
    else {
        serviceHour = [serviceHourData];
    }
    for (let i = 0; i < serviceHour.length; i++) {
        let serviceHourArray = serviceHour[i].split(",");//serviceHourArray = "15:00","11:00","1200","過夜場"
        let startTime = serviceHourArray[0];
        let endTime = serviceHourArray[1];
        let price = serviceHourArray[2];
        let service = serviceHourArray[3];
        serviceHourList.push([startTime, endTime, price, service]);
    }
    console.log(serviceHourList);
    return serviceHourList;
};

function renderCalender(calendarData){
    if (!calendarData) {
        console.error('No calendar data available.');
        return;
    }
    let thisYear = document.createElement("div");
    thisYear.textContent = calendarData.this_year;
    document.querySelector(".this-year").appendChild(thisYear);
    let thisMonth = document.createElement("div");
    thisMonth.textContent = calendarData.this_month;
    document.querySelector(".this-month").appendChild(thisMonth);
    let nextMonthYear = document.createElement("div");
    nextMonthYear.textContent = calendarData.next_month_year;
    document.querySelector(".next-month-year").appendChild(nextMonthYear);
    let nextMonth = document.createElement("div");
    nextMonth.textContent = calendarData.next_month;
    document.querySelector(".next-month").appendChild(nextMonth);
    let nextNextMonthYear = document.createElement("div");
    nextNextMonthYear.textContent = calendarData.next_next_month_year;
    document.querySelector(".next-next-month-year").appendChild(nextNextMonthYear);
    let nextNextMonth = document.createElement("div");
    nextNextMonth.textContent = calendarData.next_next_month;
    document.querySelector(".next-next-month").appendChild(nextNextMonth);

    let todayFound = false;
    let startColumnThisMonth = calendarData.this_month_first_day + 1; 
    for (let i = 0; i < calendarData.this_month_dates.length; i++) {
        let thisMonthDates = document.createElement("div");
        thisMonthDates.textContent = calendarData.this_month_dates[i];
        
        if (todayFound === false) {
            thisMonthDates.className = "inactive-date";
        } else {
            thisMonthDates.className = "active-date";
        }
        if (calendarData.this_month_dates[i] === calendarData.today_date) {
            todayFound = true;
            thisMonthDates.className = "active-date";
        }
        if (i === 0) {
            thisMonthDates.style.gridColumnStart = startColumnThisMonth;
        }
        document.querySelector(".this-month-dates").appendChild(thisMonthDates);
    }

    let startColumnNextMonth = calendarData.next_month_first_day + 1; 
    for(let i = 0; i < calendarData.next_month_dates.length; i++) {
        let nextMonthDates = document.createElement("div");
        nextMonthDates.textContent = calendarData.next_month_dates[i];
        nextMonthDates.className = "active-date";
        if (i === 0) {
            nextMonthDates.style.gridColumnStart = startColumnNextMonth;
        }
        document.querySelector(".next-month-dates").appendChild(nextMonthDates);
    }
    let startColumnNextNextMonth = calendarData.next_next_month_first_day + 1; 
    for(let i = 0; i < calendarData.next_next_month_dates.length; i++) {
        let nextNextMonthDates = document.createElement("div");
        nextNextMonthDates.textContent = calendarData.next_next_month_dates[i];
        nextNextMonthDates.className = "active-date";
        if (i === 0) {
            nextNextMonthDates.style.gridColumnStart = startColumnNextNextMonth;
        }
        document.querySelector(".next-next-month-dates").appendChild(nextNextMonthDates);
    }
};


document.querySelector(".last-month-button").addEventListener("click", () => {
    document.querySelector(".service-hour").innerHTML = "";

    let thisMonth = document.querySelector(".this");
    let next = document.querySelector(".next");
    let nextNext = document.querySelector(".next-next");
    let thisMonthDisplay = getComputedStyle(thisMonth).display;
    let nextDisplay = getComputedStyle(next).display;
    let nextNextDisplay = getComputedStyle(nextNext).display;

    if (thisMonthDisplay === "block") {
        document.querySelector(".this").style.display = "block";
        document.querySelector(".next").style.display = "none";
        document.querySelector(".next-next").style.display = "none";
    }
    else if (nextDisplay === "block"){
        document.querySelector(".this").style.display = "block";
        document.querySelector(".next").style.display = "none";
        document.querySelector(".next-next").style.display = "none";
    }
    else if (nextNextDisplay === "block"){
        document.querySelector(".this").style.display = "none";
        document.querySelector(".next").style.display = "block";
        document.querySelector(".next-next").style.display = "none";
    }
})

document.querySelector(".next-month-button").addEventListener("click", () => {
    document.querySelector(".service-hour").innerHTML = "";

    let thisMonth = document.querySelector(".this");
    let next = document.querySelector(".next");
    let nextNext = document.querySelector(".next-next");
    let thisMonthDisplay = getComputedStyle(thisMonth).display;
    let nextDisplay = getComputedStyle(next).display;
    let nextNextDisplay = getComputedStyle(nextNext).display;

    if (thisMonthDisplay === "block") {
        document.querySelector(".next").style.display = "block";
        document.querySelector(".this").style.display = "none";
        document.querySelector(".next-next").style.display = "none";
    }
    else if (nextDisplay === "block"){
        document.querySelector(".this").style.display = "none";
        document.querySelector(".next").style.display = "none";
        document.querySelector(".next-next").style.display = "block";
    }
    else if (nextNextDisplay === "block"){
        document.querySelector(".this").style.display = "none";
        document.querySelector(".next").style.display = "none";
        document.querySelector(".next-next").style.display = "block";
    }
})

function renderHour(calendarData, serviceHourRange) {
    document.querySelectorAll(".active-date").forEach(element => {
        element.addEventListener("click", () => {
            //console.log("clicked");
            document.querySelector(".service").style.display = "block";
            document.querySelector(".service-hour").innerHTML = "";
            for (let i = 0; i < 24; i++) {
                let hour = document.createElement("div");
                hour.textContent = `${i}:00`;
                document.querySelector(".service-hour").appendChild(hour);
            };
            updateServiceHourClasses(serviceHourRange);
        });
    });
}

function updateServiceHourClasses(serviceHourRange) {
    const hourDivs = document.querySelectorAll(".service-hour div");
    hourDivs.forEach(hourDiv => {
        if (serviceHourRange.includes(hourDiv.textContent)) {
            hourDiv.classList.add("active-hour");
            hourDiv.classList.remove("inactive-hour");
        } else {
            hourDiv.classList.add("inactive-hour");
            hourDiv.classList.remove("active-hour");
        }
    });
};


function renderCurrentHour(today_hour) { 
    //console.log(typeof today_hour); //string "15:00"
    let today = document.querySelector(".active-date");

    function convertToMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }

    today.addEventListener("click", () => {
        let todayTimes = document.querySelectorAll(".active-hour");
        let todayHourInMinutes = convertToMinutes(today_hour);

        for (let i = 0; i < todayTimes.length; i++) {
            let timeTextInMinutes = convertToMinutes(todayTimes[i].textContent);

            if (timeTextInMinutes < todayHourInMinutes) {
                todayTimes[i].classList.remove("active-hour");
                todayTimes[i].classList.add("inactive-hour");
            }
        };
    });
}


function renderServiceHour(serviceHourList) {
    let serviceHourRange = [];

    for (let i = 0; i < serviceHourList.length; i++) {
        let serviceHour = serviceHourList[i];
        let startHour = parseInt(serviceHour[0].split(":")[0]);
        let endHour = parseInt(serviceHour[1].split(":")[0]);

        if (endHour > startHour) {
            for (let j = startHour; j < endHour+1; j++) {
                serviceHourRange.push(`${j}:00`);
            }
        } 
        // 跨天
        else if (endHour < startHour) {
            for (let j = startHour; j < 24; j++) { 
                serviceHourRange.push(`${j}:00`);
            }
            for (let j = 0; j < endHour+1; j++) { 
                serviceHourRange.push(`${j}:00`);
            }
        }
    }
    //console.log("serviceHourRange:", serviceHourRange);
    return serviceHourRange;
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

function toggleSelectedDate(serviceHourList, orderData) {
    document.querySelectorAll('.active-date').forEach(item => {
        item.addEventListener('click', function() {
            console.log('Clicked active-date:', this); 
            document.querySelectorAll('.active-date').forEach(element => element.classList.remove('selected'));
            this.classList.toggle('selected');
            renderServiceHours(serviceHourList, orderData);
            //toggleSelectedHour(serviceHourList, serviceHourRange);
        });
    });
};
/*
function toggleSelectedHour(serviceHourList, serviceHourRange) {
    
    console.log("serviceHourList:", serviceHourList);
    let selectedTimeRange = [];
    for (let i = 0; i < serviceHourList.length; i++) {
        let serviceTimes = serviceHourList[i];
        let serviceTimeRangeToday = [];
        let serviceTimeRangeTomorrow = [];
        let startHour = parseInt(serviceTimes[0].split(":")[0]);
        let endHour = parseInt(serviceTimes[1].split(":")[0]);
        if (endHour > startHour) {
            for (let j = startHour; j < endHour+1; j++) {
                serviceTimeRangeToday.push(`${j}:00`);
            };
        }
        else if (endHour < startHour) {
            for (let j = startHour; j < 24; j++) {
                serviceTimeRangeToday.push(`${j}:00`);
            };
            for (let j = 0; j < endHour+1; j++) {
                serviceTimeRangeTomorrow.push(`${j}:00`);
            };
        }

        console.log("serviceTimeRangeToday:", serviceTimeRangeToday);
        console.log("serviceTimeRangeTomorrow:", serviceTimeRangeTomorrow);

        document.querySelectorAll('.active-hour').forEach(item => {
            item.addEventListener('click', function() {
                let selectedHour = this.textContent;
                let selectedHourInt = parseInt(selectedHour.split(":")[0]);
                let isCurrentlySelected = this.classList.contains('selected');
                
                function updateTimeRange(timeRange, isNextDay) {
                    if (!isCurrentlySelected) {
                        document.querySelectorAll('.active-hour').forEach(element => {
                            if (timeRange.includes(element.textContent)) {
                                element.classList.add('selected');
                                let existingRangeIndex = selectedTimeRange.findIndex(range => 
                                    range.start === serviceTimes[0] && 
                                    range.end === serviceTimes[1] &&
                                    range.selectedHour === selectedHour
                                );
                                if (existingRangeIndex === -1) {
                                    selectedTimeRange.push({
                                        start: serviceTimes[0],
                                        end: serviceTimes[1],
                                        selectedHour: selectedHour,
                                        isNextDay: isNextDay,
                                        price: serviceTimes[2],
                                        service_name: serviceTimes[3]
                                    });
                                }
                            }
                        });
                    } else {
                        document.querySelectorAll('.active-hour').forEach(element => {
                            if (timeRange.includes(element.textContent)) {
                                element.classList.remove('selected');
                                selectedTimeRange = selectedTimeRange.filter(range => 
                                    range.start !== serviceTimes[0] || 
                                    range.end !== serviceTimes[1] ||
                                    range.selectedHour !== selectedHour
                                );
                            }
                        });
                    }
                    saveSelected(selectedTimeRange);
                }

                if (serviceTimeRangeToday.includes(selectedHour)) {
                    updateTimeRange(serviceTimeRangeToday, true);
                }
                if (serviceTimeRangeTomorrow.includes(selectedHour)) {
                    updateTimeRange(serviceTimeRangeTomorrow, false);
                }
            });
        });
    }
};

function extractDateComponents(dateString) {
    const [year, month, day] = dateString.split('/');

    return {
        year: year,
        month: month,
        day: day
    };
}
*/

let selectedDateandTimeRange = {};
function saveSelected(){
    //console.log("selectedTimeRange:", selectedTimeRange);
    let activeYear = null;
    let activeMonth = null;
    let activeDate = null;
    let thisElement = document.querySelector(".this");
    let nextElement = document.querySelector(".next");
    let nextNextElement = document.querySelector(".next-next");

    if (thisElement) {
    let displayStyle = window.getComputedStyle(thisElement).display;
    if (displayStyle === "block") {
        //console.log("this element is active");
        activeYear = thisElement.querySelector('.year').textContent;
        activeMonth = monthToDigit[thisElement.querySelector('.month').textContent];
        console.log("activeYear:", activeYear, "activeMonth:", monthToDigit[activeMonth]);
    }}
    if (nextElement) {
    let displayStyle = window.getComputedStyle(nextElement).display;
    if (displayStyle === "block") {
        console.log("next element is active");
        activeYear = nextElement.querySelector('.year').textContent;
        activeMonth = monthToDigit[nextElement.querySelector('.month').textContent];
        console.log("activeYear:", activeYear, "activeMonth:", monthToDigit[activeMonth]);
    }}
    if (nextNextElement) {
    let displayStyle = window.getComputedStyle(nextNextElement).display;
    if (displayStyle === "block") {
        console.log("next-next element is active");
        activeYear = nextNextElement.querySelector('.year').textContent;
        activeMonth = monthToDigit[nextNextElement.querySelector('.month').textContent];
        console.log("activeYear:", activeYear, "activeMonth:", monthToDigit[activeMonth]);
    }}
    activeDate = document.querySelector(".active-date.selected").textContent;
    return {activeYear, activeMonth, activeDate};
    /*if (activeDate) {
        selectedDateandTimeRange[activeYear+"/"+activeMonth+"/"+activeDate] = selectedTimeRange;
        console.log("selectedDateandTimeRange:", selectedDateandTimeRange);
        processReservations(selectedDateandTimeRange);
    };*/

    /*if(Object.keys(newReservations).length > 0) {
        //console.log("newReservations:", newReservations);
        Object.keys(newReservations).forEach(date => {
            const { year, month, day } = extractDateComponents(date);
            //console.log(`Year: ${year}, Month: ${month}, Day: ${day}`);
            if (year === activeYear && month === activeMonth && day === activeDate) {
                for (let i = 0; i < newReservations[date].length; i++) {
                    let serviceTimes = newReservations[date][i];
                    //console.log(serviceTimes);
                    let startHour = parseInt(serviceTimes['start'].split(":")[0]);
                    let endHour = parseInt(serviceTimes['end'].split(":")[0]);
                    let serviceTimeToday = [];
                    for (let j = startHour; j < endHour+1; j++) {
                        serviceTimeToday.push(`${j}:00`);
                    }
                    console.log("serviceTimeToday:", serviceTimeToday);
                    document.querySelectorAll('.active-hour').forEach(element => {
                        if (serviceTimeToday.includes(element.textContent)) {
                            element.classList.add('selected');
                        }
                    });
                }
            }
        });
    };*/ //試圖儲存選取過的預約時間但失敗了。取得activeYear/activeMonth/activeDate有成功
};

function getPreviousDay(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const [monthDay, year] = formattedDate.split(', ');
    const [month, day] = monthDay.split(' ');
    return `${year}/${month}/${day.padStart(2, '0')}`;
};

function getNextDay(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const [monthDay, year] = formattedDate.split(', ');
    const [month, day] = monthDay.split(' ');
    return `${year}/${month}/${day.padStart(2, '0')}`;
};
/*
function processReservations(selectedDateandTimeRange) {
    newReservations = {}; // 重設全域變數
    
    for (const date in selectedDateandTimeRange) {
        selectedDateandTimeRange[date].forEach(service => {
            const startHour = parseInt(service.start.split(":")[0]);
            const endHour = parseInt(service.end.split(":")[0]);
            const isNextDay = service.isNextDay;
            let reservationDate = date;

            if (endHour < startHour && !isNextDay) {
                reservationDate = getPreviousDay(date);
            }

            if (!newReservations[reservationDate]) {
                newReservations[reservationDate] = [];
            }
            let existingReservation = newReservations[reservationDate].find(r => 
                r.start === service.start && r.end === service.end && r.price === service.price && r.service_name === service.service_name
            );

            if (!existingReservation) {
                newReservations[reservationDate].push({
                    start: service.start,
                    end: service.end,
                    price: service.price,
                    service_name: service.service_name
                });
            }
        });
    }

    const selectedTimeDiv = document.querySelector(".selected-time");
    selectedTimeDiv.innerHTML = "";
    
    Object.keys(newReservations).forEach(date => {
        let selectedDateDiv = document.createElement("div");
        selectedDateDiv.textContent = date;
        selectedTimeDiv.appendChild(selectedDateDiv);

        newReservations[date].forEach(reservation => {
            let bookingMessageDiv = document.createElement("div");
            let selectedTimeText = `${reservation.start} - ${reservation.end}`;
            let priceText = `${reservation.price}元`;
            let serviceNameText = reservation.service_name ? `（${reservation.service_name}）` : '';
            bookingMessageDiv.textContent = `${selectedTimeText}  ${priceText}${serviceNameText}`;
            selectedTimeDiv.appendChild(bookingMessageDiv);
        });

        if (newReservations[date].length > 0) {
            document.querySelector(".complete-button").style.display = "block";
        } else {
            document.querySelector(".complete-button").style.display = "none";
            selectedTimeDiv.textContent = '目前沒有預約紀錄';
        }
    });
    
    return newReservations;
}

function handleCompleteButtonClick() {
    if (document.querySelector(".selected-time").textContent.trim() === '目前沒有預約紀錄' || document.querySelector(".selected-time").textContent.trim() === '') {
        alert("請選擇日期");
        return false;
    } else {
        sendBookingData(newReservations);
    }
}*/

//在這裡切換到booking page
/*
document.querySelector(".complete-button").addEventListener("click", () => {
    let reservationData = {
        merchant_name: keyword,
        reservations: newReservations
    };
    localStorage.setItem("newReservations", JSON.stringify(reservationData));
    //newReservations;
    console.log("Booking data saved to localStorage and sent to server.");

    let userToken = document.cookie.split('; ').find(row => row.startsWith('user_token='));
    if (userToken) {
        window.location.href = `/booking`;
    }
    else{
        document.querySelector(".login-signup-form-user").style.display = "block";
        document.querySelector(".login-area-user").style.display = "block";
        document.querySelector(".signup-area-user").style.display = "none";
    }
});*/
  
//保存localStorage的預約紀錄
function updateSelectedDate() {
    let localStorage = JSON.parse(localStorage.getItem(keyword));
    if (localStorage) {
        console.log("localStorage:", localStorage);
    }
};

function renderImg(images) {
    let cloudfrontUrl = 'https://df6a6ozdjz3mp.cloudfront.net/';
    let merchantImg = document.querySelector(".image-container");
    for (let i = 0; i < images.length; i++) {
        merchantImg.style.width = `calc(600px * ${images.length})`;
        let image = document.createElement("div");
        image.classList.add("image");
        let url = cloudfrontUrl + keyword + "/" + images[i];
        //console.log(url);
        image.style.backgroundImage = `url(${url})`;
        merchantImg.appendChild(image);
    }
};

function slideImages() {
    let imageContainer = document.querySelector('.image-container');
    let images = document.querySelectorAll('.image');
    let currentIndex = 0;
    let totalImages = images.length;

    setInterval(() => {
        const slideWidth = window.matchMedia('(max-width: 1000px)').matches ? 400 : 600;
        currentIndex = (currentIndex + 1) % totalImages;
        imageContainer.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
    }, 3000); 
};

function caculateMerchantInfoWidth() {
    let merchantInfo = document.querySelector(".merchant-info");
    let merchantInfoContainer = document.querySelector(".merchant-info-container");
    let imgWrapper = document.querySelector(".image-wrapper");
    //console.log("merchantInforContainer.offsetWidth:", merchantInfoContainer.offsetWidth);
    //console.log("imgWrapper.offsetWidth:", imgWrapper.offsetWidth);
    const gapWidth = window.matchMedia('(max-width: 1000px)').matches ? 20 : 30;
    merchantInfo.style.width = `${merchantInfoContainer.offsetWidth - imgWrapper.offsetWidth - gapWidth}px`;
};

function renderMerchantInfo(fetchData, serviceHourList){
    document.querySelector(".merchant-name").textContent = Object.keys(fetchData)[0];
    document.querySelector(".address").textContent += fetchData[keyword]['address'];
    document.querySelector(".map-container iframe").src = fetchData[keyword]['google_map_src'];
    document.querySelector(".supply").textContent += fetchData[keyword]['supply'];
    document.querySelector(".note").textContent += fetchData[keyword]['note'];
    for (let i = 0; i < serviceHourList.length; i++) {
        let serviceTime = serviceHourList[i];
        let serviceHour = document.createElement("div");
        if (serviceTime[3] !== "") {
            serviceHour.textContent = `${serviceTime[3]}: ${serviceTime[0]} - ${serviceTime[1]}，${serviceTime[2]} 元`;
        }
        else{
            serviceHour.textContent = `${serviceTime[0]} - ${serviceTime[1]}`;
        }
        document.querySelector(".service-time-range").appendChild(serviceHour);
    };
    document.querySelector(".service-type").textContent = `${fetchData[keyword]['service_type']}類`;
    document.querySelector(".contact").textContent = `負責人: ${fetchData[keyword]['user_name']}`;
    let intro = document.createElement("div");
    intro.textContent = `${fetchData[keyword]['intro']}`;
    document.querySelector(".intro").appendChild(intro);
};

function renderServiceHours(serviceHourList, orderData) {
    let serviceHourRanges = document.querySelectorAll(".service-hour-range");
    if (serviceHourRanges) {
        for (let serviceHourRange of serviceHourRanges) {
            serviceHourRange.remove();
        }
    };

    let activeTime = saveSelected();
    console.log("activeTime:", activeTime);//{"activeYear": "2024","activeMonth": "08","activeDate": "30"}
    if (activeTime.activeDate < 10){
        activeTime.activeDate = `0${activeTime.activeDate}`;
    }
    let currentDate = `${activeTime.activeYear}-${activeTime.activeMonth}-${activeTime.activeDate}`;
    let newReservations = JSON.parse(localStorage.getItem("newReservations")) || { merchant_name: keyword, reservations: {} };
    let listElement = document.querySelector(".list");
    if (newReservations.merchant_name && newReservations.merchant_name !== keyword) {
        newReservations.merchant_name = keyword;
        newReservations.reservations = {};
        localStorage.setItem("newReservations", JSON.stringify(newReservations));
        listElement.innerHTML = '';
    }
    for (let i = 0; i < serviceHourList.length; i++) {
        let serviceHour = serviceHourList[i];
        let serviceHourRange = document.createElement("h3");
        serviceHourRange.classList.add("service-hour-range");
        serviceHourRange.textContent = `${serviceHour[0]} - ${serviceHour[1]}\t ${serviceHour[3]} `;
        serviceHourRange.dataset.index = i; 
        console.log("currentDate:", currentDate);
        for (let order of orderData) {
            let orderDate = order[0];
            console.log("orderDate:", orderDate);
            console.log(order[1], order[2]);
            console.log(serviceHour[0], serviceHour[1]);
            if (orderDate === currentDate) {
                console.log("orderDate === currentDate");
                let serviceHourStart = parseInt(serviceHour[0].split(":")[0]);
                let serviceHourEnd = parseInt(serviceHour[1].split(":")[0]);
                let orderStart = parseInt(order[1].split(":")[0]);
                let orderEnd = parseInt(order[2].split(":")[0]);
                if (serviceHourEnd < serviceHourStart) {//午夜時間判定
                    if ((serviceHourStart <= orderStart || serviceHourEnd >= orderStart) ||
                        (serviceHourStart <= orderEnd || serviceHourEnd >= orderEnd)) {
                        console.log("service hour range cancelled");
                        serviceHourRange.classList.add('cancelled');
                    }
                } else {//普通時間判定
                    if ((serviceHourStart <= orderStart && serviceHourEnd >= orderStart) ||
                        (serviceHourStart <= orderEnd && serviceHourEnd >= orderEnd)) {
                        console.log("service hour range cancelled");
                        serviceHourRange.classList.add('cancelled');
                    }
                }
            };
        };

        serviceHourRange.addEventListener('click', function() {
            if (this.classList.contains('clicked')) {
                this.classList.remove('clicked');
                this.textContent = this.textContent.replace(' (已選)', '');
                
                if (newReservations.reservations[currentDate]) {
                    newReservations.reservations[currentDate] = newReservations.reservations[currentDate].filter(r => 
                        !(r.start === serviceHour[0] && r.end === serviceHour[1] && r.service_name === serviceHour[3])
                    );
                    
                    if (newReservations.reservations[currentDate].length === 0) {
                        delete newReservations.reservations[currentDate];
                    }
                }
            } 
            else if (!this.classList.contains('cancelled')) {
                this.classList.add('clicked');
                this.textContent += ' (已選)';
                
                if (!newReservations.reservations[currentDate]) {
                    newReservations.reservations[currentDate] = [];
                }
                newReservations.reservations[currentDate].push({
                    start: serviceHour[0],
                    end: serviceHour[1],
                    price: serviceHour[2],
                    service_name: serviceHour[3]
                });
            }
            
            localStorage.setItem("newReservations", JSON.stringify(newReservations));
        });

        document.querySelector(".service-time").appendChild(serviceHourRange);
    };

    //renderListFuntion(serviceHourList, activeTime);
    renderSelectedTime(newReservations);
};

function checkListButton(){
    document.querySelector(".check-list").addEventListener('click', function() {
        console.log("Check list button clicked");
        let newReservations = JSON.parse(localStorage.getItem("newReservations")) || { merchant_name: keyword, reservations: {} };
        let listElement = document.querySelector(".list");
        if (newReservations.merchant_name && newReservations.merchant_name !== keyword) {
            newReservations.merchant_name = keyword;
            newReservations.reservations = {};
            localStorage.setItem("newReservations", JSON.stringify(newReservations));
            listElement.innerHTML = '';
        }

        if (!newReservations.merchant_name) {
            newReservations.merchant_name = keyword;
            newReservations.reservations = {};
            localStorage.setItem("newReservations", JSON.stringify(newReservations));
            listElement.innerHTML = '';
        }

        listElement.innerHTML = '';
        
        let titleElement = document.createElement("div");
        titleElement.classList.add("reserve-title");
        titleElement.textContent = (newReservations.merchant_name) + " 預約表";
        let Xicon = document.createElement("img");
        Xicon.classList.add("fa-xmark");
        Xicon.src = "/static/x_icon.png";
        titleElement.appendChild(Xicon);
        Xicon.addEventListener('click', function() {
            listElement.style.display = "none";
        });
        if (!document.querySelector(".reserve-title")) {
            listElement.appendChild(titleElement);
        }
        
        for (let date in newReservations.reservations) {
            let dateCard = document.createElement("div");
            dateCard.classList.add("date-card");
            dateCard.innerHTML = `<div class="reserve-date">${date}</div>`;
            
            for (let reservation of newReservations.reservations[date]) {
                let reservationCard = document.createElement("div");
                reservationCard.classList.add("reservation-card");
                reservationCard.innerHTML = `
                    <div>開始時間: ${reservation.start}</div>
                    <div>結束時間: ${reservation.end}</div>
                    <div>價格: ${reservation.price}</div>
                    <div>服務名稱: ${reservation.service_name}</div>
                `;
                dateCard.appendChild(reservationCard);
            };
            listElement.appendChild(dateCard);
        };
        let goToCheck = document.createElement("div");
        goToCheck.classList.add("go-to-check");
        goToCheck.textContent = "確認預約";
        listElement.appendChild(goToCheck);
        goToCheck.addEventListener('click', function() {
            let userToken = document.cookie.split('; ').find(row => row.startsWith('user_token='));
            if (userToken) {
            window.location.href = "/booking";
            }
            else{
                document.querySelector(".login-signup-form-user").style.display = "block";
            }
        });
        listElement.style.display = "block";
    });
};
/*
function renderListFuntion(serviceHourList, activeTime) {
    let newReservations = JSON.parse(localStorage.getItem("newReservations")) || { reservations: {} };
    
    document.querySelector(".add-to-list").addEventListener('click', function() {
        let currentDate = `${activeTime.activeYear}-${activeTime.activeMonth}-${activeTime.activeDate}`;
        let clickedElements = document.querySelectorAll(".service-hour-range.clicked");

        if (!newReservations.reservations[currentDate]) {
            newReservations.reservations[currentDate] = [];
        }

        for (let clickedElement of clickedElements) {
            let index = clickedElement.dataset.index;
            let serviceHour = serviceHourList[index];

            let tempDict = {
                "start": serviceHour[0],
                "end": serviceHour[1],
                "price": serviceHour[2],
                "service_name": serviceHour[3]
            };

            let existingReservation = newReservations.reservations[currentDate].find(r => 
                r.start === tempDict.start && 
                r.end === tempDict.end && 
                r.service_name === tempDict.service_name
            );

            if (!existingReservation) {
                newReservations.reservations[currentDate].push(tempDict);
            }
        }

        newReservations.merchant_name = keyword;

        localStorage.setItem("newReservations", JSON.stringify(newReservations));
        
        console.log("Updated reservations:", newReservations);
        renderSelectedTime(newReservations);
    });
};*/


function renderSelectedTime(newReservations){
    if(keyword === newReservations.merchant_name){
        for(let date in newReservations.reservations){
            let selectedDate = saveSelected();
            if(date === `${selectedDate.activeYear}-${selectedDate.activeMonth}-${selectedDate.activeDate}`){
                for (let reservation of newReservations.reservations[date]) {
                    for(let serviceHourRange of document.querySelectorAll(".service-hour-range")){
                        if(serviceHourRange.textContent.includes(reservation.start) && serviceHourRange.textContent.includes(reservation.end))
                            {
                            serviceHourRange.classList.add('clicked');
                            if(!serviceHourRange.textContent.includes('(已選)')) {
                                serviceHourRange.textContent += ' (已選)';
                            };
                        }
                    };
                };
            };
        };
    };
};