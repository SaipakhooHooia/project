let currentUrl = window.location.href;
let urlObj = new URL(currentUrl);
let path = urlObj.pathname;
let keyword = decodeURIComponent(path.split("/")[2]);
console.log(keyword);

let fetchData = null;
let calendarData = null;
let serviceHourData = null;
async function initialize(){
    document.querySelector(".selected-time").innerHTML = "";
    let response = await fetch("/api/merchant/" + keyword);
    let data = await response.json();
    fetchData = data;
    calendarData = data[keyword].calender;
    console.log(fetchData);
    serviceHourData = data[keyword].service_hours;
    renderImg(fetchData[keyword].images);
    let serviceHourList = getServiceHour(serviceHourData);
    renderCalender(calendarData);
    let serviceHourRange = renderServiceHour(serviceHourList);
    renderHour(calendarData, serviceHourRange);
    renderCurrentHour(calendarData.today_hour);
    toggleSelectedDate(serviceHourList, serviceHourRange);
    slideImages();
    caculateMerchantInfoWidth();
    renderMerchantInfo(fetchData, serviceHourList);
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

function toggleSelectedDate(serviceHourList, serviceHourRange) {
    document.querySelectorAll('.active-date').forEach(item => {
        item.addEventListener('click', function() {
            console.log('Clicked active-date:', this); 
            document.querySelectorAll('.active-date').forEach(element => element.classList.remove('selected'));
            this.classList.toggle('selected');
            toggleSelectedHour(serviceHourList, serviceHourRange);
        });
    });
};

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
    // 將日期字符串分割成數組
    const [year, month, day] = dateString.split('/');

    return {
        year: year,
        month: month,
        day: day
    };
}


let selectedDateandTimeRange = {};
function saveSelected(selectedTimeRange){
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
        activeMonth = thisElement.querySelector('.month').textContent;
        console.log("activeYear:", activeYear, "activeMonth:", activeMonth);
    }}
    if (nextElement) {
    let displayStyle = window.getComputedStyle(nextElement).display;
    if (displayStyle === "block") {
        console.log("next element is active");
        activeYear = nextElement.querySelector('.year').textContent;
        activeMonth = nextElement.querySelector('.month').textContent;
        console.log("activeYear:", activeYear, "activeMonth:", activeMonth);
    }}
    if (nextNextElement) {
    let displayStyle = window.getComputedStyle(nextNextElement).display;
    if (displayStyle === "block") {
        console.log("next-next element is active");
        activeYear = nextNextElement.querySelector('.year').textContent;
        activeMonth = nextNextElement.querySelector('.month').textContent;
        console.log("activeYear:", activeYear, "activeMonth:", activeMonth);
    }}
    activeDate = document.querySelector(".active-date.selected").textContent;
    if (activeDate) {
        selectedDateandTimeRange[activeYear+"/"+activeMonth+"/"+activeDate] = selectedTimeRange;
        console.log("selectedDateandTimeRange:", selectedDateandTimeRange);
        processReservations(selectedDateandTimeRange);
    };

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

let newReservations = {}; // 將 newReservations 設為全域變數

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
}

//在這裡切換到booking page
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
});
  
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
        currentIndex = (currentIndex + 1) % totalImages;
        imageContainer.style.transform = `translateX(-${600 * currentIndex}px)`;
    }, 3000); 
};

function caculateMerchantInfoWidth() {
    let merchantInfo = document.querySelector(".merchant-info");
    let merchantInfoContainer = document.querySelector(".merchant-info-container");
    let imgWrapper = document.querySelector(".image-wrapper");
    //console.log("merchantInforContainer.offsetWidth:", merchantInfoContainer.offsetWidth);
    //console.log("imgWrapper.offsetWidth:", imgWrapper.offsetWidth);
    merchantInfo.style.width = `${merchantInfoContainer.offsetWidth - imgWrapper.offsetWidth - 20}px`;
};

function renderMerchantInfo(fetchData, serviceHourList){
    document.querySelector(".merchant-name").textContent = Object.keys(fetchData)[0];
    document.querySelector(".address").textContent = '地址: 未定';
    for (let i = 0; i < serviceHourList.length; i++) {
        let serviceTime = serviceHourList[i];
            //console.log(serviceTime);
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
}