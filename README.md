# Chùa Đêm 3D · Một ngày an yên

Game 3D tiếng Việt với chế độ chơi đơn và phòng chơi chung tối đa 100 người. Bạn tự tạo nhân vật rồi khám phá khuôn viên chùa hư cấu. Game lấy cảm hứng từ [Đi Chùa Xõa Stress 3D](https://github.com/namnt22295/di-chua-xoa-stress-3d).

## Chơi thử

Giải nén ZIP và mở **index.html** trong Chrome hoặc Edge để chơi đơn. Bấm **Nhạc nền** để phát hoặc tạm dừng bản piano đính kèm. Nhạc phát lặp. Bấm **Hiệu ứng** để bật riêng các hiệu ứng như tiếng mõ. Dùng **WASD** hoặc phím mũi tên để đi, kéo chuột để xoay camera và nhấn **E** khi thấy nút tương tác. Bạn cũng có thể nhấp vào mặt đất để đi. Trên điện thoại, dùng các nút mũi tên hoặc chạm đất rồi vuốt để xoay góc nhìn.

- **Ao cá sau chùa** — hỏi Thích Trung Hiếu **Ao câu cá ở đâu?**, chọn **Đi theo thầy** và đi sát để thầy dẫn qua lối bên phải. Tại cầu gỗ, thả phao và đợi tín hiệu **Cá cắn câu**. Kéo cá lên thành công mới hoàn thành nhiệm vụ. Cá được thả lại ao.
- **Chánh điện** — bước qua cửa giữa để vào khu 100 đệm. Chọn **Ngồi thiền** ở gần một đệm và ngồi đủ 12 giây. Tượng Phật Tổ ở giữa cuối điện.
- **Cờ caro** — đến mái cờ ở bên trái sân. Thích Thể Hiện chơi mức vừa trên bàn 13 × 13. Bạn cầm X, đi trước và thắng khi xếp ít nhất 5 quân liền nhau.
- **Tàu lượn** — ga nằm cạnh hồ sen, phía bên trái sân chùa. Tàu đợi ở ga, có 10 ghế. Chọn **Lên ghế trống** để tự khởi hành sau một nhịp ngắn. Tàu chở bạn hết một vòng rồi trả bạn về ga hồ sen.
- Nhân vật và nhật ký 10 hoạt động được lưu trong trình duyệt. Các phòng chia sẻ vị trí, tên hiển thị, ghế thiền và ghế tàu. Nhiệm vụ và ván caro được tính riêng từng người.

## Chạy phòng chung trên máy

Cài Node.js 22 trở lên. Mở Terminal hoặc PowerShell tại thư mục đã giải nén rồi chạy:

```sh
npm ci --prefix server
npm start --prefix server
```

Mở **http://localhost:8080**, vào game, bấm **Chơi chung**, giữ địa chỉ **ws://localhost:8080/room**, nhập mã phòng như **CHUA-DEM** rồi bấm **Vào phòng**. Mở hai cửa sổ trình duyệt để thử nhìn thấy nhân vật của nhau. Để chơi qua mạng nội bộ, mở trang bằng địa chỉ IP của máy chạy server và dùng cùng mã phòng. Phòng nằm trong bộ nhớ của máy chủ. Khi máy chủ khởi động lại, mọi người cần vào lại phòng.

## Đăng game lên Internet

**GitHub Pages** phục vụ tệp game. Đưa toàn bộ tệp trong ZIP lên thư mục gốc của repo Public, giữ các thư mục `vendor/` và `assets/`, rồi bật **Settings → Pages → Deploy from a branch → main → /(root)**.

**Cập nhật từ bản cũ:** triển khai lại cả phần game và máy chủ để dùng chung lịch tàu mới.

**Chơi chung qua Internet** cần thêm một dịch vụ Node.js có WebSocket, ví dụ [Render Web Service](https://render.com/docs/web-services):

1. Kết nối cùng repo, để **Root Directory** trống và chọn môi trường Node.js 22 trở lên.
2. Đặt **Build Command** là `npm ci --prefix server` và **Start Command** là `npm start --prefix server`. Có thể đặt đường dẫn kiểm tra sức khỏe là `/health`.
3. Dùng **một instance** cho dịch vụ để cả phòng dùng chung trạng thái. Khi deploy xong, lấy địa chỉ dạng `wss://ten-dich-vu.onrender.com/room`.
4. Người chơi mở trang GitHub Pages, bấm **Chơi chung**, điền địa chỉ đó và cùng nhập một mã phòng. Có thể điền sẵn thông tin bằng cách thêm `?server=wss%3A%2F%2Ften-dich-vu.onrender.com%2Froom&room=CHUA-DEM` vào link game. Người chơi cũng có thể mở trực tiếp trang HTTPS của dịch vụ Node.js.

Phòng nhận tối đa 100 kết nối. Hiệu năng thực tế phụ thuộc vào gói máy chủ, mạng và thiết bị chơi. Nên dùng trình duyệt bật tăng tốc đồ họa khi chơi đông. Khi WebGL không khả dụng, chế độ vẽ dự phòng hiển thị tối đa 24 khách gần bạn để giảm tải.

Three.js 0.160.1 được đóng gói trong `vendor/`; giấy phép MIT nằm ở `vendor/THREE-LICENSE.txt`.

Nhạc nền: bản piano do người dùng cung cấp. Hiệu ứng mõ: [Pocket Sound](https://pocket-se.info/) ([mẫu Mokugyo](https://en.pocket-se.info/archives/524s/)), cắt thành một tiếng gõ cho mỗi lần bấm.
