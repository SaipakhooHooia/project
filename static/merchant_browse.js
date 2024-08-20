let currentUrl = window.location.href;
let urlObj = new URL(currentUrl);
let keyword = urlObj.searchParams.get("keyword");
document.querySelector(".search-box").value = keyword;

async function getMerchants(keyword = ''){
    let url = keyword ? `/api/merchants-browse?keyword=${keyword}` : `/api/merchants-browse`;
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

getMerchants(keyword);