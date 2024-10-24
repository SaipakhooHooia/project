let currentUrl = window.location.href;
let urlObj = new URL(currentUrl);

let keyword = decodeURIComponent(urlObj.searchParams.get("keyword") || "");
document.querySelector(".search-box").value = keyword;
let city = decodeURIComponent(urlObj.searchParams.get("city") || "");
let type = decodeURIComponent(urlObj.searchParams.get("type") || "");
let price = decodeURIComponent(urlObj.searchParams.get("price") || "");
let more = decodeURIComponent(urlObj.searchParams.get("more") || "");

console.log("URL parameters:", { keyword, city, type, price, more });

async function getMerchants(keyword , city , type , price , more) {
    let url = `/api/merchants-browse`;
    let params = new URLSearchParams();

    if (keyword) params.append('keyword', keyword);
    if (city) params.append('city', city);
    if (type) params.append('type', type);
    if (price) params.append('price', price);
    if (more) params.append('more', more);

    if (params.toString()) {
        url += `?${params.toString()}`;
    };
    console.log("Request parameters:", { keyword, city, type, price, more });
    console.log("Request URL:", url);
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    console.log(Object.keys(data).length);

    Object.keys(data).forEach(merchantName => {
        let merchantData = data[merchantName];
        let merchantElement = document.createElement('div');
        let cloudfrontUrl = 'https://df6a6ozdjz3mp.cloudfront.net/';
        if (merchantData.images && merchantData.images.length > 0) {
            let firstImage = merchantData.images[0];
            let imageUrl = cloudfrontUrl + merchantName + '/' + firstImage;
            console.log(imageUrl);
            merchantElement.style.backgroundImage = `url(${imageUrl})`;
            let merchantNameDiv = document.createElement('div');
            merchantNameDiv.textContent = merchantName;
            merchantElement.appendChild(merchantNameDiv);
        } else {
            console.log(`No images found for ${merchantName}`);
        }
        document.querySelector('.main-container').appendChild(merchantElement);

        merchantElement.addEventListener('click', () => {
            let textContent = merchantElement.firstChild.textContent;
            window.location.href = `/merchant/${textContent}`;
        });
    });
};

getMerchants(keyword , city , type , price , more);