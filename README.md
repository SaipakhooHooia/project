# Unnamed Rental
## 核心User Story
Unnamed Rental 是一個提供商家可以上架自助型的空間租借服務、使用者可以進行瀏覽、租借的服務平台。進入首頁後可以以使用者的身分直接對空間進行搜尋，或者是註冊/登入來瀏覽之前的租借歷史紀錄、查看即將到來的預約或取消訂單等等。也可以以商家的身分登入，註冊新商家或者是查看訂單紀錄，對訂單進行退款或修改。

### 使用者方面

在首頁自帶關鍵字搜尋功能，將搜尋次數較多的關鍵字放置在首頁。

<img src="/picture/popular_applications.png" alt="受歡迎的應用" width="70%">

在搜尋條旁可以點開篩選視窗，可進階篩選縣市、場地類型、租金和其他篩選條件。

<img src="/picture/keyword_search.png" alt="關鍵字篩選" width="30%">

點入景點頁面後進到下面的月曆，可以點擊日期查看可預約的時段。選擇時段後選擇「查看已選時段」可以查看目前選擇的所有時段。點選「確認預約」後可以進到預約頁面。

<img src="/picture/booking_window.png" alt="查看選擇時段" width="70%">

進入預約頁面後填寫預約資訊。

<img src="/picture/booking_data.png" alt="填寫預約資料" width="70%">

預約成功後會直接進到會員中心，查看方才預約的訂單和歷史訂單。

<img src="/picture/user_member_page.png" alt="使用者頁面" width="70%">

可以在會員中心進行篩選，查看過去訂單、未來訂單和取消紀錄等訂單詳情。過去訂單可對該訂單進行評分，未來訂單在一天前可取消並退款。

<img src="/picture/user_member_page_filter.png" alt="使用者頁面" width="30%">

針對預約完成並完成付款流程，但預約時間尚未到來的訂單，使用者可以在會員中心直接取消該筆預約並進行退款。

<img src="/picture/user_member_page_cancel_booking.png" alt="使用者取消預約" width="70%">

在預約完後，使用者會在信箱收到預約成功通知，例如下面的範例。

<img src="/picture/booking_success_notify.png" alt="使用者預約成功通知" width="70%">

在預約到期之前的一小時，使用者會在信箱收到商家設定的大門密碼。

<img src="/picture/password_notify.png" alt="使用者密碼通知" width="50%">

在預約到期後，使用者可以在會員中心對該筆預約打心評價。

<img src="/picture/user_member_page_send_rate.png" alt="使用者打心評價" width="70%">

### 商家方面
商家可以在首頁選擇註冊新帳號，或者是直接登入商家會員中心。

<img src="/picture/merchant_options.png" alt="商家註冊登入" width="50%">

商家會員中心的功能表提供預約月曆、訂單查詢、新增商家、常見問題和目前已存在的商家的狀態和訂單查閱。

<img src="/picture/merchant_member_page_list.png" alt="商家中心功能表" width="20%">

在預約月曆的頁面可以查看該月份和未來兩個月的訂單總情況，點擊月曆上的圓圈可以展開查看預約日期、時間、單號、預約者聯絡資料等該筆預約的詳情。

<img src="/picture/merchant_member_page_calender.png" alt="商家中心月曆" width="70%">

在訂單查詢頁面中可以用商店名稱、預約資料等進行訂單的篩選。

<img src="/picture/merchant_member_page_booking_manage.png" alt="商家中心訂單查詢" width="70%">

點擊該筆訂單可以查看該筆訂單的詳情，也可以對該筆訂單的資料進行使用者連絡資料、訂單日期和時間的編輯，也可以刪除該筆預約。在刪除預約時系統同時會寄信通知預約人並退費。

<img src="/picture/merchant_member_page_booking_manage_option.png" alt="商家中心訂單管理功能" width="70%">

如果要新增商店，可以在新增商家頁面填入商家店名、地址、銀行帳號等詳細資料。

<img src="/picture/merchant_member_page_add_merchant.png" alt="商家中心新增商家" width="70%">

如果要修改已存在的商店的資料，可以在商家列表下選擇該商店，並在展開的列表中選擇「商家資訊管理」，就可以編輯商店資料。

<img src="/picture/merchant_member_page_merchant_info.png" alt="商家中心商家資訊管理" width="70%">

## 核心技術
#### 後端: 
Python、FastAPI、Redis
#### 前端: 
JavaScript、HTML
#### 身分驗證: 
Google OAuth、JWT
#### 金流: 
Tappay金流串接
#### 圖片儲存: 
AWS S3
#### 資料儲存: 
AWS RDS(MySQL)
#### 信件發送: 
AWS Lambda、AWS EventListener、MySQL Trigger
#### Server: 
AWS EC2
#### 版本管理: 
Github

## 系統架構圖
<img src="/picture/system_architecture.png" alt="系統架構圖" width="50%">

## DB ERD
<img src="/picture/ERD.png" alt="ERD" width="70%">