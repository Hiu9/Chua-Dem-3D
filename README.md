# Bản cập nhật V3 · Nhiệm vụ hằng ngày

- Toàn bộ 10 nhiệm vụ tự làm mới lúc **00:00 theo giờ Việt Nam (UTC+7)**. Khi game đang mở, kiểm tra mỗi giây; khi quay lại tab hoặc mở game vào ngày mới, tiến độ cũng được làm mới. Tên và diện mạo nhân vật được giữ lại.
- Bộ đếm gõ mõ về 0, đèn sen và hương trở về trạng thái chưa hoàn thành. Hoạt động đang làm dở được ghi vào ngày mà bạn hoàn thành. Nếu đã thiền xong và vẫn đang ngồi qua ngày mới, đứng dậy rồi ngồi lại để làm nhiệm vụ thiền hôm nay.
- Dữ liệu cũ chưa có ngày sẽ được giữ làm tiến độ hôm nay trong lần nâng cấp đầu tiên, sau đó tự reset vào nửa đêm kế tiếp.
- Tiến độ tiếp tục lưu trong trình duyệt như bản trước, dựa trên đồng hồ thiết bị; không đồng bộ giữa nhiều máy.
- Đã xóa hai ghế dài bên trong Bui's House cùng các vùng va chạm của chúng. Giữ lại bàn Tiến lên và bốn ghế nhỏ xung quanh.

## Cập nhật

Giải nén ZIP, tải toàn bộ nội dung lên GitHub để ghi đè bản cũ, giữ `index.html` ở gốc repo. Chờ Render triển khai bản mới và hiện Live, sau đó nhấn Ctrl + F5. Cấu hình Build/Start không đổi.

Đã kiểm tra mốc nửa đêm Việt Nam, giữ tiến độ trong cùng ngày, tải dữ liệu ngày cũ, nâng cấp dữ liệu chưa có ngày, hoàn thành nhiệm vụ qua ngày, reset bộ đếm và đèn sen, giữ hồ sơ nhân vật, xóa vùng chặn của hai ghế dài và giữ bốn ghế nhỏ. Chưa kiểm tra trực quan trên trình duyệt thật hoặc cập nhật dịch vụ Render.

---

# Bản cập nhật V2 · Caro 1 đấu 1 và bộ bài từ ảnh

## Những thay đổi trong bản này

- Thay `assets/completion.mp3` bằng âm thanh từ tệp `hoan thanh(1).MP3` mới gửi. Chỉ cắt phần im lặng cuối tệp.
- Thêm tiếng tàu từ `tau luon.MP3`. Âm thanh phát khi ngồi lên tàu, lặp trong chuyến đi và dừng/reset khi hết vòng, rời ghế do mất kết nối hoặc tắt Hiệu ứng. Bật lại Hiệu ứng trong chuyến đi sẽ phát tiếp. Âm thanh tàu độc lập với lựa chọn bài nhạc nền.
- Caro có hai lựa chọn: chơi với NPC Thích Thể Hiện hoặc chơi 1 đấu 1 với người thật.
- Thích Trung Hiếu đưa người chơi tới ao rồi tự đi ngược tuyến đường về sân chùa, đúng vị trí/hướng ban đầu. Thầy không chờ người chơi trong lượt về và có thể dẫn đường lại sau khi về tới nơi.
- Tách 52 lá trực tiếp từ ảnh đính kèm, không vẽ lại. Mỗi lá nằm ở `assets/cards/card-00.png` đến `card-51.png`. Bảng `assets/cards/mapping.json` ghi số, chất và vùng cắt trong ảnh gốc. Mã tăng theo 3♠, 3♣, 3♦, 3♥, …, 2♥ để khớp luật game. Bàn Tiến lên dùng ảnh này cho bài trên tay và bài vừa đánh; tên lá vẫn có cho hỗ trợ truy cập.
- Sửa tiếng hoàn thành thiền bị gọi lặp mỗi khung hình; giờ chỉ phát một lần cho mỗi lượt ngồi thiền hoàn tất.

## Chơi caro cùng bạn bè

1. Hai người vào **Chơi chung**, cùng máy chủ và cùng mã phòng.
2. Cùng tới mái cờ bên trái sân chùa, tương tác với bàn caro của Thích Thể Hiện.
3. Chọn **Đánh với người thật · 1 đấu 1**. Người ngồi đầu tiên cầm X, người thứ hai cầm O. Khi đủ hai người, ván tự bắt đầu.
4. X đi trước. Bấm ô trống khi tới lượt mình; ít nhất 5 quân liên tiếp là thắng, không xét chặn hai đầu, cùng luật với chế độ NPC.
5. Hết ván, cả hai bấm **Sẵn sàng ván mới** để chơi tiếp. **Đóng · giữ chỗ** chỉ ẩn bàn; **Rời bàn** nhường ghế và hủy ván đang chơi. Nếu ai mất kết nối, người còn lại chờ đối thủ mới. Mỗi phòng có một bàn caro 2 ghế.

## Cập nhật lên GitHub và Render

Giải nén ZIP rồi tải toàn bộ nội dung lên repo, ghi đè các tệp cũ. `index.html` phải nằm ngay gốc repo. Nhớ tải thư mục **assets/cards/** với đủ 52 PNG, **caro-online.js**, **caro.js**, **game.js**, **social.js** và cả **server/**. Đơn giản nhất là tải toàn bộ nội dung ZIP trong một lần.

Commit vào `main`, chờ Render triển khai bản mới và hiện Live. Giữ Build Command `npm ci --prefix server`, Start Command `npm start --prefix server`. Sau đó tất cả người chơi nhấn Ctrl + F5 để tải lại. Nếu Render chưa tự cập nhật, chọn Manual Deploy → Deploy latest commit.

## Kiểm tra

Đã kiểm tra cú pháp; caro qua các kết nối WebSocket riêng: chờ/đủ bàn, người thứ ba bị từ chối, lượt sai, ô không hợp lệ, thắng ngang và chéo, cả hai đồng ý chơi lại, đối thủ mất kết nối rồi thay người mới, cách ly phòng. Máy chủ phục vụ đủ 52 ảnh và âm thanh tàu. Kiểm tra DOM mô phỏng đã qua cho khởi tạo game, ảnh bài, điều khiển caro, NPC đi về khi người chơi ở lại ao và vòng đời âm thanh tàu. Chưa kiểm tra hình ảnh/âm thanh trực tiếp trên trình duyệt thật hoặc triển khai lên Render của bạn.

---

# Bản cập nhật Bui's House

## Nội dung mới

- Tiếng hoàn thành nhiệm vụ và tiếng gõ mõ dùng tệp bạn cung cấp. Phần im lặng ở cuối hai hiệu ứng được cắt để giảm tải. Hiệu ứng bật mặc định; nút Hiệu ứng bật/tắt cả hai.
- Nút Nhạc nền mở menu: Nhạc chùa, Nhạc chill hoặc Tắt nhạc. Chỉ một bài phát tại một thời điểm.
- Bui's House ở phía sau chùa, bên phải ao cá khi đi từ sân chùa theo lối bên phải. Nhà dựng 3D lấy cảm hứng từ ảnh: mái bằng, cột trắng vân hồng, khung cửa xám, đèn lồng, ghế gỗ và hoa vàng. Mái tự ẩn khi tới gần để nhìn được bên trong.
- Đến bàn trong nhà, bấm E: chọn chơi với 3 NPC (4 tụ) hoặc với người thật.
- Với người thật: cả 4 người vào cùng phòng Chơi chung, tới nhà và chọn Chơi với người cùng phòng. Người ngồi đầu tiên bấm Bắt đầu. Mỗi phòng có một bàn 4 ghế. Chưa đủ 4 người thì chờ, không tự thêm NPC. Mỗi người chỉ nhận bài của mình.
- Chọn các lá bài rồi bấm Đánh bài đã chọn; Bỏ lượt để chờ vòng mới. Đóng giữ chỗ; Rời bàn nhường ghế. Người thật có 45 giây mỗi lượt; quá giờ máy chủ tự bỏ lượt hoặc đánh mở vòng. Rời bàn/mất kết nối hủy ván hiện tại để mọi người chia lại khi đủ người.
- Nút Chat gửi tin nhắn đến người đang kết nối cùng phòng. Không lưu lịch sử trên máy chủ; rời phòng xóa khung chat của bạn. Giới hạn 240 ký tự, khoảng một tin mỗi giây.

## Luật Tiến lên của bản này

Mỗi tụ 13 lá. Thứ tự 3–4–5–6–7–8–9–10–J–Q–K–A–2; chất bích < chuồn < rô < cơ. Mỗi ván mới, người có 3 bích mở và phải đánh kèm lá đó. Hỗ trợ bài rác, đôi, sám, sảnh từ ba lá không chứa 2, tứ quý và đôi thông từ ba đôi. Bộ cùng loại, cùng số lá phải lớn hơn bộ trước. Ba đôi thông hoặc tứ quý chặt heo đơn; tứ quý chặt ba đôi thông. Bốn đôi thông chặt heo đơn, đôi heo, ba đôi thông và tứ quý, vẫn theo lượt. Bỏ lượt thì chờ vòng mới. Xếp hạng đến khi còn một người giữ bài. Không áp dụng tới trắng, đút mù, phạt thối, tính tiền hay cược.

## Đưa bản cập nhật lên GitHub / Render

1. Giải nén ZIP, tải toàn bộ nội dung bên trong lên repo `Hiu9/Chua-Dem-3D`, ghi đè bản cũ. `index.html` nằm ngay gốc repo, cùng `assets/`, `vendor/`, `server/` và các tệp JS/CSS. Không tải cả thư mục bao ngoài.
2. Commit lên nhánh `main`. Giữ Build Command `npm ci --prefix server` và Start Command `npm start --prefix server`.
3. Chờ Render triển khai commit mới và hiện Live. Nếu cần, chọn Manual Deploy → Deploy latest commit. Phải cập nhật cả server để có chat và bàn bài trực tuyến.
4. Mở lại link game, nhấn Ctrl + F5. Tất cả người chơi nên tải lại cùng phiên bản trước khi vào phòng.

## Kiểm tra bản này

Đã kiểm tra cú pháp JavaScript, chạy 100 ván NPC, chạy hết một ván qua 4 kết nối WebSocket riêng, kiểm tra bài riêng từng người, chat cách ly giữa hai phòng, rời bàn khi mất kết nối và phục vụ các âm thanh mới. Kiểm tra DOM với môi trường mô phỏng: game khởi tạo, tạo thế giới 3D, tìm được đường đi từ cổng đến nhà, chọn bài, chọn nhạc và hiển thị chat an toàn. Chưa kiểm tra trực quan bằng trình duyệt thật trên máy/điện thoại của bạn và chưa triển khai lên Render.

---

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
