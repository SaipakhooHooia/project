let cloudFrontUrl = "https://df6a6ozdjz3mp.cloudfront.net/";

function getMerchants() {
    fetch("/api/merchanting")
    .then(response => response.json())
    .then(data => {const categories = Object.keys(data);
        
        for (let i = 1; i <= 6; i++) {
            const category = categories[i - 1];
            const contentElement = document.querySelector(`.content${i}`);
            
            if (!contentElement) continue;

            contentElement.style.backgroundColor = 'rgba(84, 84, 84, 0.5)';  
            contentElement.style.backgroundImage = '';  
            contentElement.innerHTML = ''; 

            const textDiv = document.createElement("div");
            textDiv.textContent = category ? category : 'No Category'; 
            contentElement.appendChild(textDiv);

            if (i > categories.length) continue; 

            const firstItem = data[category] && data[category][0];

            if (!firstItem) continue;  

            const firstItemName = Object.keys(firstItem)[0];
            const images = firstItem[firstItemName];
            const firstImage = images ? images[0] : null;

            if (firstImage) {
                contentElement.style.backgroundImage = `url(${cloudFrontUrl}${firstItemName}/${firstImage})`;
                console.log(cloudFrontUrl + firstItemName + '/' + firstImage);
            }
            document.querySelector(`.content${i}`).addEventListener('click', (event) => {
                let keyword = event.currentTarget.firstChild.textContent;
                console.log(keyword);
                window.location.href = `/merchant_browse?keyword=${keyword}`;
            });
        }})
    .catch(error => console.error('Error fetching merchants:', error));
    /*try {
        let response = await fetch("/api/merchants");
        if (!response.ok) {
            throw new Error('Network response was not ok');
        };
        let data = await response.json();

        if (!data) return;
        console.log(data);
        const categories = Object.keys(data);
        
        for (let i = 1; i <= 6; i++) {
            const category = categories[i - 1];
            const contentElement = document.querySelector(`.content${i}`);
            
            if (!contentElement) continue;

            contentElement.style.backgroundColor = 'rgba(84, 84, 84, 0.5)';  
            contentElement.style.backgroundImage = '';  
            contentElement.innerHTML = ''; 

            const textDiv = document.createElement("div");
            textDiv.textContent = category ? category : 'No Category'; 
            contentElement.appendChild(textDiv);

            if (i > categories.length) continue; 

            const firstItem = data[category] && data[category][0];

            if (!firstItem) continue;  

            const firstItemName = Object.keys(firstItem)[0];
            const images = firstItem[firstItemName];
            const firstImage = images ? images[0] : null;

            if (firstImage) {
                contentElement.style.backgroundImage = `url(${cloudFrontUrl}${firstItemName}/${firstImage})`;
                console.log(cloudFrontUrl + firstItemName + '/' + firstImage);
            }
            document.querySelector(`.content${i}`).addEventListener('click', (event) => {
                let keyword = event.currentTarget.firstChild.textContent;
                console.log(keyword);
                window.location.href = `/merchant_browse?keyword=${keyword}`;
            });
        }

    } catch (error) {
        console.error('Error fetching merchants:', error);
    }*/
};

getMerchants();
