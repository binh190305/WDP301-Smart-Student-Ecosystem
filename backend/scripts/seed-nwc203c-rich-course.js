const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../src/models/user.model');
const Course = require('../src/models/course.model');
const Lesson = require('../src/models/lesson.model');
const Material = require('../src/models/material.model');
const Quiz = require('../src/models/quiz.model');

async function seedNWC203c() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const nwc = await Course.findOne({ code: 'NWC203c' });
  if (!nwc) {
    console.error('NWC203c not found!');
    process.exit(1);
  }
  console.log(`Found course: [${nwc.code}] ${nwc.title}`);

  const lecturer = await User.findOne({ role: 'lecturer' }) || await User.findOne({});
  console.log(`Using lecturer ID: ${lecturer._id}`);

  // 1. Delete existing lessons, materials, quizzes for NWC203c
  await Lesson.deleteMany({ course: nwc._id });
  await Material.deleteMany({ course: nwc._id });
  await Quiz.deleteMany({ course: nwc._id });

  // 2. Create rich materials for NWC203c
  const mat1 = await Material.create({
    course: nwc._id,
    uploadedBy: lecturer._id,
    title: 'Slide bài giảng Chương 1: Kiến trúc Mạng Máy tính & Mô hình OSI 7 Tầng (PDF)',
    description: 'Tài liệu chi tiết về 7 tầng OSI, chức năng từng tầng và quá trình đóng gói dữ liệu (Encapsulation).',
    fileUrl: '/uploads/materials/slide-nwc203c-chuong1-osi.pdf',
    fileName: 'slide-nwc203c-chuong1-osi.pdf',
    mimeType: 'application/pdf',
    size: 2450000,
  });

  const mat2 = await Material.create({
    course: nwc._id,
    uploadedBy: lecturer._id,
    title: 'Tài liệu Bắt gói tin Wireshark: Phân tích Giao thức DNS & HTTP/HTTPS (DOCX)',
    description: 'Hướng dẫn từng bước cách sử dụng Wireshark filter: dns, http, tls.handshake để phân tích gói tin.',
    fileUrl: '/uploads/materials/lab-wireshark-dns-http.docx',
    fileName: 'lab-wireshark-dns-http.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1850000,
  });

  const mat3 = await Material.create({
    course: nwc._id,
    uploadedBy: lecturer._id,
    title: 'Bảng tổng hợp & Công thức Chia mạng con IPv4 Subnetting (CheatSheet)',
    description: 'Bảng tra nhanh CIDR từ /8 đến /30, công thức tính số subnet, wildcard mask và địa chỉ broadcast.',
    fileUrl: '/uploads/materials/cheatsheet-ipv4-subnetting.pdf',
    fileName: 'cheatsheet-ipv4-subnetting.pdf',
    mimeType: 'application/pdf',
    size: 980000,
  });

  const mat4 = await Material.create({
    course: nwc._id,
    uploadedBy: lecturer._id,
    title: 'File Lab Cisco Packet Tracer: Cấu hình Router, Switch & Định tuyến OSPF (.pkt)',
    description: 'Topology mạng hoàn chỉnh cho bài thực hành định tuyến đa vùng OSPF Single Area.',
    fileUrl: '/uploads/materials/lab-cisco-ospf-topology.pkt',
    fileName: 'lab-cisco-ospf-topology.pkt',
    mimeType: 'application/octet-stream',
    size: 3200000,
  });

  console.log('✅ Created 4 rich materials for NWC203c');

  // 3. Create interactive quizzes for NWC203c
  const quiz1 = await Quiz.create({
    title: 'Trắc nghiệm Chương 1: Mô hình OSI & TCP/IP (NWC203c)',
    course: nwc._id,
    createdBy: lecturer._id,
    isPublished: true,
    timeLimitMinutes: 15,
    passingPercentage: 70,
    questions: [
      {
        questionText: 'Trong mô hình OSI 7 tầng, tầng nào chịu trách nhiệm định tuyến (routing) gói tin qua mạng?',
        options: ['Data Link Layer', 'Network Layer (Tầng Mạng)', 'Transport Layer', 'Physical Layer'],
        correctIndexes: [1],
        explanation: 'Network Layer (Tầng 3) sử dụng địa chỉ logic (IP) và các bảng định tuyến (Routing Table) để chuyển tiếp gói tin.'
      },
      {
        questionText: 'Đơn vị dữ liệu giao thức (PDU) tại Tầng Giao vận (Transport Layer) của giao thức TCP được gọi là gì?',
        options: ['Packet', 'Frame', 'Segment', 'Bit'],
        correctIndexes: [2],
        explanation: 'TCP chia nhỏ dữ liệu thành các Segment; trong khi UDP gọi là Datagram, Network Layer là Packet và Data Link Layer là Frame.'
      },
      {
        questionText: 'Thứ tự đúng của quá trình đóng gói dữ liệu (Encapsulation) từ trên xuống dưới là gì?',
        options: [
          'Data → Segment → Packet → Frame → Bits',
          'Data → Frame → Packet → Segment → Bits',
          'Bits → Frame → Packet → Segment → Data',
          'Packet → Segment → Frame → Data → Bits'
        ],
        correctIndexes: [0],
        explanation: 'Dữ liệu từ tầng ứng dụng được chia thành Segments (Transport), gắn IP Header thành Packets (Network), gắn MAC Header/Trailer thành Frames (Data Link) và truyền qua kênh vật lý dưới dạng Bits.'
      }
    ]
  });

  const quiz2 = await Quiz.create({
    title: 'Trắc nghiệm Chương 3: Giao thức TCP/UDP & Bắt tay 3 bước',
    course: nwc._id,
    createdBy: lecturer._id,
    isPublished: true,
    timeLimitMinutes: 15,
    passingPercentage: 70,
    questions: [
      {
        questionText: 'Tiến trình bắt tay 3 bước (Three-way Handshake) của TCP sử dụng các cờ (flags) nào theo thứ tự?',
        options: ['SYN → SYN-ACK → ACK', 'ACK → SYN → SYN-ACK', 'FIN → ACK → FIN-ACK', 'SYN → ACK → DATA'],
        correctIndexes: [0],
        explanation: 'Bắt tay 3 bước của TCP: 1. Client gửi SYN, 2. Server phản hồi SYN-ACK, 3. Client gửi ACK xác nhận.'
      },
      {
        questionText: 'Giao thức nào dưới đây hoạt động trên nền UDP thay vì TCP?',
        options: ['HTTP/1.1', 'DNS (Domain Name System)', 'FTP (File Transfer Protocol)', 'SMTP (Email)'],
        correctIndexes: [1],
        explanation: 'DNS phân giải tên miền nhanh chóng sử dụng cổng UDP 53; trong khi HTTP, FTP, SMTP yêu cầu truyền tin tin cậy trên TCP.'
      }
    ]
  });

  const quiz3 = await Quiz.create({
    title: 'Kiểm tra Thực hành: Tính toán Subnetting IPv4 & CIDR',
    course: nwc._id,
    createdBy: lecturer._id,
    isPublished: true,
    timeLimitMinutes: 20,
    passingPercentage: 60,
    questions: [
      {
        questionText: 'Dải mạng 192.168.1.0/26 có Subnet Mask dạng thập phân là bao nhiêu?',
        options: ['255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224'],
        correctIndexes: [2],
        explanation: '/26 gồm 26 bit 1. Byte cuối là 11000000 = 128 + 64 = 192. Vậy Subnet Mask là 255.255.255.192.'
      },
      {
        questionText: 'Với Subnet Mask /26, mỗi mạng con có tối đa bao nhiêu địa chỉ IP khả dụng cho máy tính (Hosts)?',
        options: ['64', '62', '32', '30'],
        correctIndexes: [1],
        explanation: 'Số bit host là 32 - 26 = 6. Tổng số IP là 2^6 = 64. Trừ Network Address và Broadcast Address thì còn 62 host khả dụng.'
      }
    ]
  });

  console.log('✅ Created 3 quizzes for NWC203c');

  // 4. Create 5 comprehensive, highly detailed lessons for NWC203c
  await Lesson.create([
    {
      course: nwc._id,
      createdBy: lecturer._id,
      title: 'Chương 1: Tổng quan Kiến trúc Mạng Máy tính, Mô hình OSI 7 Tầng & Bộ Giao thức TCP/IP',
      order: 1,
      materials: [mat1._id],
      quiz: quiz1._id,
      content: `### 🎯 Mục tiêu học tập cốt lõi:
1. Phân biệt được sự khác biệt giữa mô hình tham chiếu lý thuyết OSI 7 tầng và bộ giao thức thực tế TCP/IP.
2. Hiểu bản chất quá trình đóng gói dữ liệu (Data Encapsulation) và mở gói dữ liệu (Decapsulation).
3. Xác định chính xác vai trò của địa chỉ MAC (Physical), IP (Logical) và Port (Process-to-process).

### 📖 Nội dung chi tiết:

#### 1. Mô hình Tham chiếu OSI 7 Tầng:
- **Tầng 7 - Application (Ứng dụng)**: Giao diện trực tiếp với người dùng và các ứng dụng mạng (HTTP, HTTPS, FTP, DNS, SMTP).
- **Tầng 6 - Presentation (Trình diễn)**: Định dạng dữ liệu (JSON, XML), nén dữ liệu và mã hóa bảo mật (TLS/SSL encryption).
- **Tầng 5 - Session (Phiên)**: Thiết lập, duy trì và đồng bộ hóa phiên kết nối giữa hai tiến trình.
- **Tầng 4 - Transport (Giao vận)**: Truyền dữ liệu end-to-end, kiểm soát luồng (Flow control), kiểm soát lỗi (Error control) với TCP hoặc UDP. PDU là **Segment**.
- **Tầng 3 - Network (Mạng)**: Định tuyến gói tin qua các mạng khác nhau dựa trên địa chỉ logic (IP Address). Thiết bị tiêu biểu: **Router**. PDU là **Packet**.
- **Tầng 2 - Data Link (Liên kết dữ liệu)**: Truyền dữ liệu tin cậy giữa hai nút kề nhau trong cùng mạng LAN dựa trên địa chỉ vật lý (MAC Address). Thiết bị tiêu biểu: **Switch**. PDU là **Frame**.
- **Tầng 1 - Physical (Vật lý)**: Truyền các chuỗi bit nhị phân (0 và 1) qua môi trường vật lý (Cáp xoắn đôi Cat6, Cáp quang Fiber, Sóng vô tuyến Wi-Fi).

#### 2. Quá trình Đóng gói Dữ liệu (Encapsulation Flow):
\`\`\`text
[Application Data]
  ↓ (Gắn TCP Header: Source Port, Dest Port, Seq Num)
[Segment] (Tầng 4)
  ↓ (Gắn IP Header: Source IP, Dest IP, TTL)
[Packet] (Tầng 3)
  ↓ (Gắn Ethernet Header: Source MAC, Dest MAC + FCS Trailer)
[Frame] (Tầng 2)
  ↓ (Mã hóa tín hiệu điện/quang)
0110100101... [Bits] (Tầng 1)
\`\`\`

### 🛠️ Bài tập thực hành & Tự học:
- Tải về Slide bài giảng PDF đính kèm bên dưới để xem minh họa chi tiết.
- Hoàn thành bài trắc nghiệm **Quiz Chương 1** (15 phút) để đánh giá mức độ hiểu bài.`
    },
    {
      course: nwc._id,
      createdBy: lecturer._id,
      title: 'Chương 2: Tầng Ứng dụng (Application Layer): Giao thức HTTP/HTTPS, DNS & DHCP',
      order: 2,
      materials: [mat2._id],
      content: `### 🎯 Mục tiêu học tập cốt lõi:
1. Hiểu cơ chế hoạt động của Web: HTTP Request/Response, Headers, Status Codes và SSL/TLS Handshake.
2. Nắm vững tiến trình phân giải tên miền DNS theo cấu trúc cây phân cấp (Hierarchical Tree).
3. Cơ chế cấp phát địa chỉ IP động DHCP theo quy trình 4 bước DORA.

### 📖 Nội dung chi tiết:

#### 1. Giao thức HTTP & HTTPS:
- **Cấu trúc HTTP Request**:
  - Request Line: \`GET /api/v1/courses HTTP/1.1\`
  - Headers: \`Host: ste.edu.vn\`, \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`
  - Body: Dữ liệu JSON/Form gửi lên máy chủ.
- **HTTPS & Chứng chỉ SSL/TLS**:
  - Hoạt động trên cổng 443, sử dụng thuật toán mã hóa bất đối xứng (RSA/ECC) trong quá trình bắt tay để trao đổi khóa đối xứng (AES-256) mã hóa dữ liệu truyền tải.

#### 2. Hệ thống Phân giải Tên miền DNS:
- Khi người dùng gõ \`ste.fpt.edu.vn\`, quá trình truy vấn lặp (Iterative Query) diễn ra qua các máy chủ:
  1. **Local DNS Cache / ISP Resolver**
  2. **Root DNS Server (.)**
  3. **TLD Server (.vn)**
  4. **Authoritative Name Server (fpt.edu.vn)**: Trả về bản ghi A (IPv4) hoặc AAAA (IPv6).

#### 3. Quy trình Cấp phát IP Động DHCP (DORA):
\`\`\`text
Client                            DHCP Server
  | ----- DHCP Discover (Broadcast) ----> |
  | <---- DHCP Offer (Unicast/Bcast) --- |
  | ----- DHCP Request (Broadcast) -----> |
  | <---- DHCP Acknowledgment (ACK) ---- |
\`\`\`

### 🛠️ Bài thực hành Wireshark:
- Mở Wireshark, gõ filter \`dns || http\` và truy cập một website để quan sát trực tiếp các gói tin DNS Query và HTTP 200 OK.`
    },
    {
      course: nwc._id,
      createdBy: lecturer._id,
      title: 'Chương 3: Tầng Giao vận (Transport Layer): So sánh TCP vs UDP & Tiến trình Bắt tay 3 bước',
      order: 3,
      quiz: quiz2._id,
      content: `### 🎯 Mục tiêu học tập cốt lõi:
1. So sánh chi tiết ưu nhược điểm giữa hai giao thức chủ đạo TCP (Transmission Control Protocol) và UDP (User Datagram Protocol).
2. Hiểu cơ chế thiết lập kết nối Bắt tay 3 bước (Three-way Handshake) và giải phóng kết nối 4 bước (Four-way Teardown).
3. Các cơ chế đảm bảo độ tin cậy: Báo nhận (ACK), Đánh số thứ tự (Sequence Number), Truyền lại khi hết giờ (Retransmission Timeout) và Cửa sổ trượt (Sliding Window).

### 📖 Nội dung chi tiết:

#### 1. Bảng So sánh Chuyên sâu TCP vs UDP:
| Đặc tính | TCP (RFC 793) | UDP (RFC 768) |
| :--- | :--- | :--- |
| **Bản chất** | Hướng kết nối (Connection-oriented) | Phi kết nối (Connectionless) |
| **Độ tin cậy** | Đảm bảo 100% dữ liệu không mất mát | Không đảm bảo (Best-effort delivery) |
| **Kiểm soát luồng & tắc nghẽn** | Có (Sliding Window, Congestion Window) | Không có |
| **Header Size** | 20 - 60 bytes | 8 bytes cố định |
| **Tốc độ** | Chậm hơn do overhead bắt tay | Rất nhanh, độ trễ cực thấp |
| **Ứng dụng tiêu biểu** | Web (HTTP), Email (SMTP), File (FTP) | Live Stream, Video Call (WebRTC), Game Online, DNS |

#### 2. Tiến trình Bắt tay 3 Bước TCP (Three-way Handshake):
\`\`\`text
Client                                  Server
  |                                        |
  |  1. SYN (seq = 100)                    |
  | -------------------------------------> |  (Server nhận yêu cầu kết nối)
  |                                        |
  |  2. SYN-ACK (seq = 300, ack = 101)     |
  | <------------------------------------- |  (Server chấp nhận và gửi cờ đồng bộ)
  |                                        |
  |  3. ACK (seq = 101, ack = 301)         |
  | -------------------------------------> |  (Client xác nhận kết nối thành công)
  |                                        |
=== Kết nối ESTABLISHED: Bắt đầu truyền dữ liệu ===
\`\`\`

### 🛠️ Luyện tập:
- Làm bài trắc nghiệm **Quiz Chương 3** để nắm chắc các trạng thái kết nối TCP (LISTEN, SYN_SENT, SYN_RCVD, ESTABLISHED, TIME_WAIT).`
    },
    {
      course: nwc._id,
      createdBy: lecturer._id,
      title: 'Chương 4: Tầng Mạng: Kỹ thuật Chia mạng con IPv4 Subnetting, VLSM & Định tuyến CIDR',
      order: 4,
      materials: [mat3._id],
      quiz: quiz3._id,
      content: `### 🎯 Mục tiêu học tập cốt lõi:
1. Nắm vững cấu trúc địa chỉ IPv4 32-bit: Phân chia Network Bits và Host Bits.
2. Thành thạo công thức tính toán chia mạng con (Subnetting) với Subnet Mask và ký hiệu CIDR (\`/24\`, \`/26\`, \`/28\`).
3. Xác định chính xác Network Address, Broadcast Address, First Usable IP, Last Usable IP cho từng subnet.

### 📖 Nội dung chi tiết:

#### 1. Công thức Vàng trong Subnetting:
- Cho địa chỉ mạng với prefix \`/N\`. Ta mượn $s$ bit từ phần Host để chia mạng con:
  - **Prefix mới**: $N_{new} = N + s$
  - **Số mạng con tạo thành**: $2^s$
  - **Số bit host còn lại**: $h = 32 - N_{new}$
  - **Tổng số địa chỉ IP mỗi subnet**: $2^h$
  - **Số địa chỉ IP khả dụng cho máy tính (Usable Hosts)**: $2^h - 2$ *(trừ địa chỉ mạng và địa chỉ quảng bá)*.
  - **Bước nhảy (Block Size / Magic Number)**: $256 - \\text{Octet thay đổi của Subnet Mask}$.

#### 2. Ví dụ Thực hành Mẫu:
- **Đề bài**: Cho dải mạng \`192.168.1.0/24\`. Hãy chia thành 4 mạng con bằng nhau:
  - Cần 4 mạng con: $2^s = 4 \\implies s = 2$ bit mượn.
  - Prefix mới: $24 + 2 = \\mathbf{/26}$.
  - Subnet Mask mới: \`255.255.255.192\` (do 2 bit mượn: $128 + 64 = 192$).
  - Số host mỗi subnet: $2^6 - 2 = \\mathbf{62}$ máy tính.
  - Bước nhảy: $256 - 192 = \\mathbf{64}$.
  - **Bảng 4 mạng con**:
    1. **Subnet 1**: \`192.168.1.0/26\` | IP dùng được: \`192.168.1.1\` đến \`192.168.1.62\` | Broadcast: \`192.168.1.63\`
    2. **Subnet 2**: \`192.168.1.64/26\` | IP dùng được: \`192.168.1.65\` đến \`192.168.1.126\` | Broadcast: \`192.168.1.127\`
    3. **Subnet 3**: \`192.168.1.128/26\` | IP dùng được: \`192.168.1.129\` đến \`192.168.1.190\` | Broadcast: \`192.168.1.191\`
    4. **Subnet 4**: \`192.168.1.192/26\` | IP dùng được: \`192.168.1.193\` đến \`192.168.1.254\` | Broadcast: \`192.168.1.255\`

### 🛠️ Bài tập:
- Tải về file CheatSheet PDF bên dưới và hoàn thành bài kiểm tra tính toán Subnetting (Quiz 3).`
    },
    {
      course: nwc._id,
      createdBy: lecturer._id,
      title: 'Chương 5: Thực hành Cisco Packet Tracer: Cấu hình Router, Switch & Giao thức Định tuyến OSPF',
      order: 5,
      materials: [mat4._id],
      content: `### 🎯 Mục tiêu học tập cốt lõi:
1. Sử dụng thành thạo phần mềm mô phỏng mạng Cisco Packet Tracer.
2. Nắm vững các câu lệnh CLI của hệ điều hành Cisco IOS trên Router và Switch.
3. Cấu hình định tuyến tĩnh (Static Route) và định tuyến động OSPF (Open Shortest Path First).

### 📖 Hướng dẫn Lệnh CLI Cisco IOS:

#### 1. Các chế độ dòng lệnh (Command Modes):
\`\`\`text
Router> enable                  ! Chuyển sang Privileged EXEC Mode
Router# configure terminal      ! Chuyển sang Global Configuration Mode
Router(config)# hostname R1     ! Đặt tên cho Router
R1(config)#
\`\`\`

#### 2. Cấu hình Địa chỉ IP cho Cổng Mạng (Interface):
\`\`\`text
R1(config)# interface GigabitEthernet0/0/0
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# description LAN Connection to Switch 1
R1(config-if)# no shutdown     ! Bật cổng mạng (up/up)
R1(config-if)# exit
\`\`\`

#### 3. Cấu hình Định tuyến Động OSPF:
\`\`\`text
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
R1(config-router)# network 10.0.0.0 0.0.0.3 area 0
R1(config-router)# exit
\`\`\`

### 🛠️ Tải về File Thực hành:
- Tải về file topology \`lab-cisco-ospf-topology.pkt\` đính kèm bên dưới, mở trên Cisco Packet Tracer và tiến hành chạy lệnh \`ping\` kiểm tra kết nối giữa các PC trong 2 mạng LAN.`
    }
  ]);

  console.log('✅ Successfully seeded 5 rich chapters for NWC203c with materials and quizzes!');
  await mongoose.disconnect();
}

seedNWC203c().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

