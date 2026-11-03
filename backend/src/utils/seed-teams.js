// Bổ sung dữ liệu nhóm (thành viên, nhóm mới, tin nhắn, tài liệu, lời mời, yêu cầu tham gia)
// vào database hiện có. Không xoá dữ liệu cũ; chạy lại nhiều lần không bị nhân đôi.
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const { mongoUri } = require('../config/env');
const { User, Team, JoinRequest, TeamResource, TeamMessage } = require('../models');
const TeamInvitation = require('../models/team-invitation.model');

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const ago = (days, hours = 0) => new Date(Date.now() - days * DAY - hours * HOUR);

const mail = (id) => `${id}@fpt.edu.vn`;

// Thành viên bổ sung cho các nhóm đã có: [tên nhóm, [{ user, daysAgo }]]
const extraMembers = [
  ['HealthMate - Trợ lý sức khỏe', [{ user: 'nganhtkse161122', daysAgo: 12 }]],
  ['PayFlow - Ví điện tử sinh viên', [{ user: 'huydqhe162788', daysAgo: 10 }]],
  ['MediScan AI', [{ user: 'phatnthe164900', daysAgo: 14 }, { user: 'khanhtvhe162355', daysAgo: 6 }]],
  ['StudyHub - Nền tảng học nhóm', [{ user: 'thuannmhe161234', daysAgo: 9 }, { user: 'namcnhe163011', daysAgo: 4 }]],
  ['CampusEats - Đặt món căng tin', [{ user: 'baotghe162001', daysAgo: 8 }]],
  ['GreenCycle - Phân loại rác thông minh', [{ user: 'nguyenltse160877', daysAgo: 11 }, { user: 'anhpdhe163344', daysAgo: 5 }]],
  ['SecureVault - Quản lý mật khẩu', [{ user: 'namcnhe163011', daysAgo: 7 }]],
  ['CodeArena - Luyện thi lập trình', [{ user: 'baotghe162001', daysAgo: 13 }, { user: 'thuannmhe161234', daysAgo: 3 }]],
  ['EventGo - Quản lý sự kiện CLB', [{ user: 'nganhtkse161122', daysAgo: 9 }, { user: 'yenvhse161600', daysAgo: 2 }]],
  ['BrandLab - Studio nhận diện thương hiệu', [{ user: 'linhbpse160455', daysAgo: 6 }]],
  ['FinTrack - Dashboard đầu tư', [{ user: 'phatnthe164900', daysAgo: 8 }, { user: 'huydqhe162788', daysAgo: 1 }]],
];

const newTeams = [
  {
    name: 'SmartLib - Thư viện số FPTU',
    description:
      'Xây dựng hệ thống mượn trả sách trực tuyến cho thư viện trường: tra cứu sách, đặt chỗ, nhắc hạn trả qua email và thống kê sách được mượn nhiều.',
    topic: 'Giáo dục, quản lý thư viện, web',
    major: 'Kỹ thuật phần mềm',
    skillsNeeded: ['React', '.NET', 'SQL Server', 'UI/UX'],
    maxMembers: 5,
    leader: 'huydqhe162788',
    members: [{ user: 'yenvhse161600', daysAgo: 5 }],
    createdDaysAgo: 6,
  },
  {
    name: 'TravelMate - Gợi ý lịch trình du lịch',
    description:
      'Ứng dụng gợi ý lịch trình du lịch tiết kiệm cho sinh viên dựa trên ngân sách, sở thích và thời gian, có tích hợp bản đồ và chia sẻ chi phí nhóm.',
    topic: 'Du lịch, hệ gợi ý, AI',
    major: 'Trí tuệ nhân tạo',
    skillsNeeded: ['Python', 'Recommender System', 'React Native', 'Content Marketing'],
    maxMembers: 4,
    leader: 'phatnthe164900',
    members: [{ user: 'linhbpse160455', daysAgo: 3 }],
    createdDaysAgo: 4,
  },
  {
    name: 'CyberQuest - Luyện CTF',
    description:
      'Nhóm luyện thi Capture The Flag: chia sẻ write-up, dựng lab luyện tập web exploitation, forensics, crypto và tham gia các giải CTF sinh viên.',
    topic: 'An toàn thông tin, CTF, pentest',
    major: 'An toàn thông tin',
    skillsNeeded: ['Linux', 'Web Security', 'Reverse Engineering', 'Python'],
    maxMembers: 5,
    leader: 'anhpdhe163344',
    members: [{ user: 'khanhtvhe162355', daysAgo: 15 }],
    createdDaysAgo: 16,
  },
  {
    name: 'ArtBox - Triển lãm số',
    description:
      'Website triển lãm tác phẩm đồ hoạ của sinh viên, đã hoàn thành và trình bày tại Demo Day học kỳ trước. Nhóm hiện không nhận thêm thành viên.',
    topic: 'Thiết kế, triển lãm trực tuyến',
    major: 'Thiết kế đồ họa',
    skillsNeeded: ['Figma', 'Illustrator', 'Webflow'],
    maxMembers: 4,
    leader: 'nganhtkse161122',
    members: [{ user: 'linhbpse160455', daysAgo: 40 }, { user: 'hanlgse160199', daysAgo: 38 }],
    createdDaysAgo: 45,
    status: 'closed',
  },
];

// Tin nhắn nhóm: số đầu là vị trí người gửi trong danh sách thành viên (0 = trưởng nhóm).
const messageTemplates = {
  'HealthMate - Trợ lý sức khỏe': [
    [2, 'Chào mọi người, mình là Ngân, sẽ lo phần UI/UX. Mình đã xem qua wireframe, có vài góp ý về màn hình nhắc uống thuốc.'],
    [0, 'Welcome Ngân! Bạn cứ comment thẳng trên file Figma nhé, mình đã share quyền chỉnh sửa.'],
    [1, 'API nhắc lịch uống thuốc mình đẩy lên nhánh dev rồi, mọi người pull về test giúp.'],
    [2, 'Mình đã làm xong bộ màu và component cho màn hình chính, tối nay review được không?'],
    [0, 'Ok, 20h tối nay họp nhanh trên Meet nhé. Deadline nộp bản demo là thứ 6 tuần sau.'],
  ],
  'PayFlow - Ví điện tử sinh viên': [
    [2, 'Mình vào nhóm rồi nhé. Mình có kinh nghiệm SQL Server, có thể phụ phần thiết kế CSDL giao dịch.'],
    [0, 'Hay quá, bạn xem giúp bảng transactions với ledger, mình đang phân vân có tách bảng không.'],
    [2, 'Nên tách, ledger ghi theo kiểu double-entry thì đối soát dễ hơn. Mình vẽ lại ERD và gửi sau.'],
  ],
  'MediScan AI': [
    [0, 'Dataset X-quang phổi mình đã tiền xử lý xong, ảnh resize về 224x224 và để trên Drive nhóm.'],
    [1, 'Mình train thử ResNet50 được accuracy 87% trên tập validation, chiều nay up notebook lên.'],
    [2, 'Mình sẽ dựng API Flask để nhận ảnh và trả kết quả, đóng gói bằng Docker luôn cho dễ deploy.'],
    [0, 'Cảm ơn mọi người. Tuần sau thử thêm EfficientNet rồi so sánh nhé.'],
  ],
  'StudyHub - Nền tảng học nhóm': [
    [0, 'Chào Thuận và Nam! Mình chia việc: Thuận làm module phòng học realtime, Nam làm phần backend thông báo.'],
    [2, 'Ok, mình định dùng Socket.IO cho phòng học, mọi người thấy ổn không?'],
    [3, 'Ổn đó. Mình sẽ dựng hàng đợi thông báo bằng Redis để không bị nghẽn khi nhiều người online.'],
    [1, 'Mình cập nhật lại giao diện trang phòng học theo góp ý buổi trước rồi nha.'],
    [0, 'Tuyệt, thứ 4 mình demo cho thầy hướng dẫn, mọi người merge code trước tối thứ 3 nhé.'],
  ],
  'CampusEats - Đặt món căng tin': [
    [0, 'Bảo vào nhóm rồi, chào mừng! Bạn phụ trách phần thanh toán và tích hợp ví nhé.'],
    [2, 'Ok anh. Mình dùng VNPay sandbox để test trước nhé.'],
    [1, 'Mình chuẩn bị khảo sát sinh viên về giờ cao điểm ở căng tin, cuối tuần có kết quả.'],
  ],
  'GreenCycle - Phân loại rác thông minh': [
    [0, 'Mình đã chụp thêm khoảng 500 ảnh rác thải ở khu ký túc xá để bổ sung dataset.'],
    [1, 'Mình label xong 3 lớp nhựa, giấy, kim loại. Còn lớp hữu cơ thì chia nhau làm nhé.'],
    [2, 'Mình nghiên cứu phần cứng Raspberry Pi + camera, đã đặt linh kiện rồi.'],
    [0, 'Cảm ơn Đức Anh. Mục tiêu tuần này là chạy được model trên Pi với tốc độ trên 5 FPS.'],
  ],
  'SecureVault - Quản lý mật khẩu': [
    [0, 'Mình chốt dùng AES-256-GCM để mã hoá vault, khoá dẫn xuất bằng Argon2id.'],
    [1, 'Đồng ý. Mình viết thêm test cho phần đồng bộ để đảm bảo server không bao giờ thấy plaintext.'],
    [2, 'Mình review kiến trúc rồi, nên thêm cơ chế khôi phục bằng recovery key nữa.'],
  ],
  'CodeArena - Luyện thi lập trình': [
    [0, 'Hệ thống chấm bài tự động chạy được rồi, đang giới hạn thời gian và bộ nhớ bằng Docker.'],
    [1, 'Mình thêm được 30 bài tập mẫu với testcase, phân theo độ khó.'],
    [2, 'Mình mới vào nhóm, sẽ làm phần giao diện bảng xếp hạng bằng React nhé.'],
    [0, 'Chào Thuận! Có gì thắc mắc về API cứ hỏi mình.'],
  ],
  'EventGo - Quản lý sự kiện CLB': [
    [0, 'Mình đã liên hệ được 3 CLB đồng ý dùng thử EventGo cho sự kiện tháng 11.'],
    [1, 'Kế hoạch truyền thông mình đã cập nhật trên Drive, mọi người xem góp ý giúp.'],
    [2, 'Mình gửi bản thiết kế poster và banner cho trang sự kiện rồi nha.'],
    [3, 'Mình bắt đầu làm chức năng check-in bằng QR code.'],
  ],
  'MindCare - Chatbot tâm lý': [
    [0, 'Mình thu thập được bộ dữ liệu hội thoại tư vấn tiếng Việt, đang làm sạch dữ liệu.'],
    [1, 'Mình thử fine-tune PhoBERT để phân loại cảm xúc, kết quả ban đầu khá ổn.'],
    [0, 'Nhóm vẫn cần thêm 1 bạn làm web để dựng giao diện chat, ai biết ai giới thiệu nhé.'],
  ],
  'BrandLab - Studio nhận diện thương hiệu': [
    [0, 'Khách hàng đầu tiên là CLB Guitar, họ cần logo và bộ nhận diện trước 15/11.'],
    [1, 'Mình làm brief và moodboard rồi, gửi trong mục tài liệu nhóm.'],
    [0, 'Đẹp quá! Mình phác 3 phương án logo, thứ 5 cùng chọn nhé.'],
  ],
  'DevOps Pipeline Lab': [
    [0, 'Pipeline CI trên GitHub Actions đã chạy, build và push image lên registry tự động.'],
    [1, 'Mình dựng xong cụm k3s 3 node trên máy ảo, đang cấu hình ingress.'],
    [2, 'Mình thêm bước quét lỗ hổng image bằng Trivy vào pipeline rồi.'],
    [0, 'Nhóm đủ người rồi, tuần sau thử triển khai blue-green deployment.'],
  ],
  'FinTrack - Dashboard đầu tư': [
    [0, 'Mình viết xong tài liệu yêu cầu, gồm 3 dashboard: danh mục, lãi lỗ và cảnh báo giá.'],
    [1, 'Mình làm API lấy dữ liệu chứng khoán, đang cache theo phút.'],
    [2, 'Mình phụ trách phân tích dữ liệu, sẽ làm biểu đồ phân bổ tài sản.'],
    [3, 'Mình vừa vào nhóm, sẽ hỗ trợ phần backend với Bảo nhé.'],
  ],
  'SmartLib - Thư viện số FPTU': [
    [0, 'Chào Yến, mình đã tạo repo và dựng khung .NET Web API rồi.'],
    [1, 'Ok anh, mình làm phần frontend React, trước mắt là trang tra cứu sách.'],
    [0, 'Nhóm còn thiếu bạn làm UI/UX và một bạn backend nữa, mình đang mời thêm.'],
  ],
  'TravelMate - Gợi ý lịch trình du lịch': [
    [0, 'Ý tưởng là gợi ý lịch trình Đà Lạt và Phú Quốc trước, dữ liệu lấy từ các review công khai.'],
    [1, 'Mình làm khảo sát nhu cầu du lịch của sinh viên, đã có hơn 120 phản hồi rồi.'],
  ],
  'CyberQuest - Luyện CTF': [
    [0, 'Cuối tuần này có giải CTF sinh viên, nhóm mình đăng ký rồi nhé.'],
    [1, 'Mình chuẩn bị write-up các bài forensics giải năm ngoái để mọi người ôn.'],
    [0, 'Mình dựng lab DVWA trên server nhóm, link trong mục tài liệu.'],
  ],
  'ArtBox - Triển lãm số': [
    [0, 'Cảm ơn cả nhóm đã đồng hành, dự án đạt giải nhì Demo Day!'],
    [1, 'Yeah! Mình lưu lại toàn bộ hình ảnh sự kiện trên Drive rồi.'],
    [2, 'Mình đóng nhóm nhé, hẹn mọi người ở dự án sau.'],
  ],
};

// Tài liệu dạng link: [vị trí người đăng, tiêu đề, url]
const resourceTemplates = {
  'HealthMate - Trợ lý sức khỏe': [
    [0, 'Tài liệu React Native - Bắt đầu', 'https://reactnative.dev/docs/getting-started'],
    [2, 'Hướng dẫn thiết kế Material Design 3', 'https://m3.material.io/'],
  ],
  'PayFlow - Ví điện tử sinh viên': [
    [0, 'Spring Boot Reference', 'https://docs.spring.io/spring-boot/index.html'],
    [1, 'VNPay - Tài liệu tích hợp', 'https://sandbox.vnpayment.vn/apis/'],
  ],
  'MediScan AI': [
    [0, 'Bộ dữ liệu Chest X-Ray (Kaggle)', 'https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia'],
    [1, 'TensorFlow - Transfer learning', 'https://www.tensorflow.org/tutorials/images/transfer_learning'],
  ],
  'StudyHub - Nền tảng học nhóm': [
    [0, 'Socket.IO Documentation', 'https://socket.io/docs/v4/'],
    [2, 'React - Tài liệu chính thức', 'https://react.dev/learn'],
  ],
  'CampusEats - Đặt món căng tin': [[0, 'ASP.NET Core Documentation', 'https://learn.microsoft.com/aspnet/core/']],
  'GreenCycle - Phân loại rác thông minh': [
    [0, 'Raspberry Pi Camera Documentation', 'https://www.raspberrypi.com/documentation/accessories/camera.html'],
    [1, 'YOLO - Ultralytics Docs', 'https://docs.ultralytics.com/'],
  ],
  'SecureVault - Quản lý mật khẩu': [
    [0, 'OWASP Password Storage Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'],
  ],
  'CodeArena - Luyện thi lập trình': [
    [0, 'Codeforces Problemset', 'https://codeforces.com/problemset'],
    [1, 'CP-Algorithms', 'https://cp-algorithms.com/'],
  ],
  'EventGo - Quản lý sự kiện CLB': [[1, 'Canva - Mẫu poster sự kiện', 'https://www.canva.com/posters/templates/']],
  'MindCare - Chatbot tâm lý': [[1, 'PhoBERT (VinAI)', 'https://github.com/VinAIResearch/PhoBERT']],
  'BrandLab - Studio nhận diện thương hiệu': [[0, 'Figma Learn', 'https://help.figma.com/hc/en-us']],
  'DevOps Pipeline Lab': [
    [0, 'GitHub Actions Documentation', 'https://docs.github.com/actions'],
    [2, 'Trivy - Image scanning', 'https://trivy.dev/'],
  ],
  'FinTrack - Dashboard đầu tư': [[2, 'Pandas User Guide', 'https://pandas.pydata.org/docs/user_guide/index.html']],
  'SmartLib - Thư viện số FPTU': [[0, '.NET Web API Tutorial', 'https://learn.microsoft.com/aspnet/core/tutorials/first-web-api']],
  'CyberQuest - Luyện CTF': [
    [0, 'CTFtime - Lịch giải CTF', 'https://ctftime.org/'],
    [1, 'PortSwigger Web Security Academy', 'https://portswigger.net/web-security'],
  ],
};

// Lời mời: [nhóm, người được mời, trạng thái, lời nhắn, số ngày trước]
const invitationTemplates = [
  ['SmartLib - Thư viện số FPTU', 'thuannmhe161234', 'pending', 'Bạn mạnh React và Node.js, nhóm mình đang cần người làm phần web. Tham gia cùng tụi mình nhé!', 1],
  ['GreenCycle - Phân loại rác thông minh', 'thuannmhe161234', 'pending', 'Nhóm cần một bạn dựng dashboard web theo dõi thùng rác, bạn có hứng thú không?', 2],
  ['BrandLab - Studio nhận diện thương hiệu', 'thuannmhe161234', 'rejected', 'Mời bạn làm website portfolio cho studio.', 12],
  ['PayFlow - Ví điện tử sinh viên', 'namcnhe163011', 'pending', 'Nhóm cần người thiết kế hệ thống chịu tải cao, mời bạn tham gia.', 2],
  ['HealthMate - Trợ lý sức khỏe', 'anhpdhe163344', 'pending', 'Ứng dụng có lưu dữ liệu sức khỏe, nhóm cần bạn tư vấn phần bảo mật.', 1],
  ['SecureVault - Quản lý mật khẩu', 'namcnhe163011', 'accepted', 'Mời bạn tham gia review kiến trúc hệ thống.', 8],
  ['TravelMate - Gợi ý lịch trình du lịch', 'yenvhse161600', 'pending', 'Nhóm cần bạn làm app React Native.', 1],
];

// Yêu cầu tham gia: [nhóm, người xin, trạng thái, lời nhắn, số ngày trước]
const joinRequestTemplates = [
  ['MindCare - Chatbot tâm lý', 'thuannmhe161234', 'pending', 'Mình làm web với React và Node.js, có thể dựng giao diện chat cho nhóm.', 1],
  ['DevOps Pipeline Lab', 'thuannmhe161234', 'rejected', 'Mình muốn học thêm về CI/CD và Docker.', 10],
  ['StudyHub - Nền tảng học nhóm', 'thuannmhe161234', 'accepted', 'Mình có kinh nghiệm realtime với Socket.IO, muốn góp sức cho StudyHub.', 10],
  ['CodeArena - Luyện thi lập trình', 'thuannmhe161234', 'accepted', 'Mình làm frontend được, muốn làm bảng xếp hạng.', 4],
  ['HealthMate - Trợ lý sức khỏe', 'huydqhe162788', 'pending', 'Mình biết .NET và SQL Server, có thể hỗ trợ backend quản lý hồ sơ bệnh nhân.', 2],
  ['HealthMate - Trợ lý sức khỏe', 'hanlgse160199', 'pending', 'Mình làm phân tích nghiệp vụ, có thể viết tài liệu yêu cầu và kế hoạch dự án.', 1],
  ['TravelMate - Gợi ý lịch trình du lịch', 'nganhtkse161122', 'pending', 'Mình muốn thiết kế giao diện app du lịch.', 1],
  ['CyberQuest - Luyện CTF', 'namcnhe163011', 'pending', 'Mình muốn luyện thêm mảng reverse engineering.', 2],
  ['MediScan AI', 'baotghe162001', 'cancelled', 'Mình muốn hỗ trợ backend.', 9],
];

const toDate = (daysAgo, hoursOffset = 0) => ago(daysAgo, hoursOffset);

const insertWithDates = async (Model, data, createdAt, updatedAt = createdAt) => {
  const doc = new Model(data);
  await doc.validate();
  await Model.collection.insertOne({ ...doc.toObject(), createdAt, updatedAt });
};

const run = async () => {
  await connectDB(mongoUri);

  const users = await User.find({ role: 'student' }).select('_id email');
  const userByKey = new Map(users.map((u) => [u.email.split('@')[0], u]));
  const userId = (key) => {
    const user = userByKey.get(key);
    if (!user) throw new Error(`Không tìm thấy sinh viên ${mail(key)}`);
    return user._id;
  };

  const stats = { members: 0, teams: 0, messages: 0, resources: 0, invitations: 0, joinRequests: 0 };

  // 1. Tạo nhóm mới
  for (const t of newTeams) {
    if (await Team.exists({ name: t.name })) continue;
    const createdAt = toDate(t.createdDaysAgo);
    const leaderId = userId(t.leader);
    const team = new Team({
      name: t.name,
      description: t.description,
      topic: t.topic,
      major: t.major,
      skillsNeeded: t.skillsNeeded,
      maxMembers: t.maxMembers,
      leader: leaderId,
      members: [
        { user: leaderId, role: 'leader', joinedAt: createdAt },
        ...t.members.map((m) => ({ user: userId(m.user), role: 'member', joinedAt: toDate(m.daysAgo) })),
      ],
      status: t.status || 'recruiting',
    });
    team.syncStatus();
    await team.validate();
    await Team.collection.insertOne({ ...team.toObject(), createdAt, updatedAt: createdAt });
    stats.teams += 1;
  }

  // 2. Bổ sung thành viên cho nhóm có sẵn
  for (const [name, additions] of extraMembers) {
    const team = await Team.findOne({ name });
    if (!team) continue;
    let changed = false;
    for (const { user, daysAgo } of additions) {
      const id = userId(user);
      if (team.isMember(id) || team.members.length >= team.maxMembers) continue;
      team.members.push({ user: id, role: 'member', joinedAt: toDate(daysAgo) });
      changed = true;
      stats.members += 1;
      // Yêu cầu đang chờ của người này (nếu có) coi như đã được duyệt
      await JoinRequest.updateMany(
        { team: team._id, applicant: id, status: 'pending' },
        { status: 'accepted', decidedAt: toDate(daysAgo), decidedBy: team.leader }
      );
    }
    if (changed) {
      team.syncStatus();
      await team.save();
    }
  }

  const teams = await Team.find({});
  const teamByName = new Map(teams.map((t) => [t.name, t]));
  const memberAt = (team, index) => team.members[Math.min(index, team.members.length - 1)].user;

  // 3. Tin nhắn nhóm (chỉ thêm cho nhóm còn ít hơn 3 tin nhắn)
  for (const [name, lines] of Object.entries(messageTemplates)) {
    const team = teamByName.get(name);
    if (!team) continue;
    if ((await TeamMessage.countDocuments({ team: team._id })) >= 3) continue;
    const startDays = Math.min(lines.length + 1, 6);
    for (let i = 0; i < lines.length; i += 1) {
      const [index, content] = lines[i];
      const createdAt = toDate(startDays - i, (i * 3) % 7);
      await insertWithDates(TeamMessage, { team: team._id, sender: memberAt(team, index), content }, createdAt);
      stats.messages += 1;
    }
  }

  // 4. Tài liệu nhóm dạng link
  for (const [name, items] of Object.entries(resourceTemplates)) {
    const team = teamByName.get(name);
    if (!team) continue;
    for (let i = 0; i < items.length; i += 1) {
      const [index, title, linkUrl] = items[i];
      if (await TeamResource.exists({ team: team._id, linkUrl })) continue;
      await insertWithDates(
        TeamResource,
        { team: team._id, uploadedBy: memberAt(team, index), type: 'link', title, linkUrl },
        toDate(5 - i, 2)
      );
      stats.resources += 1;
    }
  }

  // 5. Lời mời tham gia nhóm
  for (const [name, invitee, status, message, daysAgo] of invitationTemplates) {
    const team = teamByName.get(name);
    if (!team) continue;
    const inviteeId = userId(invitee);
    if (await TeamInvitation.exists({ team: team._id, invitee: inviteeId })) continue;
    if (status === 'pending' && (team.isMember(inviteeId) || team.status !== 'recruiting')) continue;
    if (status === 'accepted' && !team.isMember(inviteeId)) continue;
    await insertWithDates(
      TeamInvitation,
      {
        team: team._id,
        invitee: inviteeId,
        invitedBy: team.leader,
        message,
        status,
        decidedAt: status === 'pending' ? null : toDate(daysAgo - 1),
      },
      toDate(daysAgo),
      toDate(status === 'pending' ? daysAgo : daysAgo - 1)
    );
    stats.invitations += 1;
  }

  // 6. Yêu cầu tham gia nhóm
  for (const [name, applicant, status, message, daysAgo] of joinRequestTemplates) {
    const team = teamByName.get(name);
    if (!team) continue;
    const applicantId = userId(applicant);
    if (await JoinRequest.exists({ team: team._id, applicant: applicantId })) continue;
    if (status === 'pending' && (team.isMember(applicantId) || team.status !== 'recruiting')) continue;
    if (status === 'accepted' && !team.isMember(applicantId)) continue;
    const decided = status === 'accepted' || status === 'rejected';
    await insertWithDates(
      JoinRequest,
      {
        team: team._id,
        applicant: applicantId,
        message,
        status,
        decidedAt: decided ? toDate(daysAgo - 1) : null,
        decidedBy: decided ? team.leader : null,
      },
      toDate(daysAgo),
      toDate(status === 'pending' ? daysAgo : Math.max(daysAgo - 1, 0))
    );
    stats.joinRequests += 1;
  }

  console.log('Đã bổ sung dữ liệu nhóm:', stats);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
