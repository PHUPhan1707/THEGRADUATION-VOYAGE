/**
 * Cấu hình mặc định của thiệp. Đây là nguồn dữ liệu "tĩnh" – hoạt động ngay cả khi
 * không có Supabase. Nếu có Supabase / lưu trong trang /admin thì giá trị ở đó sẽ ghi đè.
 */
export const SITE_CONFIG = {
  graduateName: 'Phan An Phú',
  university: 'Trường Đại học Quốc tế – ĐHQG TP.HCM',
  universityEn: 'International University – Vietnam National University HCMC',
  /** Định dạng YYYY-MM-DD */
  graduationDate: '2026-11-28',
  /** Định dạng HH:mm (24h). Để '' nếu chưa chốt giờ. Ví dụ: '08:00' */
  ceremonyTime: '',
  venue: 'Nhà điều hành Sinh viên',
  mapsLink: 'https://maps.google.com/?q=Nhà+điều+hành+Sinh+viên+ĐHQG+TP.HCM',
  timezone: 'Asia/Ho_Chi_Minh',
  projectName: 'THE GRADUATION VOYAGE',
  tagline: 'Hành Trình Đến Tân Thế Giới',
  quote: 'Một hành trình kết thúc, một hành trình mới bắt đầu!',
  letter: {
    paragraphs: [
      'Sau những năm tháng vượt qua vô số con sóng mang tên deadline, bài tập, đồ án và những kỳ thi, cuối cùng con tàu thanh xuân của mình cũng đã cập đến một cột mốc thật đặc biệt.',
      'Vào ngày {date}, mình sẽ chính thức khép lại hành trình đại học tại {university}. Và sẽ thật tuyệt vời nếu có bạn ở bên cạnh trong ngày đặc biệt này!',
    ],
    closing: 'Hẹn gặp bạn tại bến cảng tốt nghiệp!',
  },
  /** Thông điệp khi chưa chốt giờ */
  timeTbd: 'Sẽ thông báo sớm',
}
